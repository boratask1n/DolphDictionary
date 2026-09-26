import { Word, ReviewFeedback, DifficultyLabel, LearningStatus, ReviewLog, ReviewMode } from '../types';

export interface SchedulingResult {
  updatedWord: Word;
  reviewLog: ReviewLog;
}

/**
 * Calculates Difficulty Label based on continuous 1.0 - 10.0 scale
 */
export function getDifficultyLabel(rating: number): DifficultyLabel {
  if (rating <= 3.5) return 'Easy';
  if (rating <= 6.0) return 'Medium';
  if (rating <= 8.0) return 'Hard';
  return 'Very Hard';
}

/**
 * Modern FSRS-inspired adaptive Spaced Repetition Algorithm
 * Independent from React components and UI.
 */
export function calculateNextReview(
  word: Word,
  feedback: ReviewFeedback,
  mode: ReviewMode = 'daily',
  reviewTimestamp: Date = new Date()
): SchedulingResult {
  const now = reviewTimestamp.getTime();
  const lastReviewTime = word.lastReviewed
    ? new Date(word.lastReviewed).getTime()
    : new Date(word.dateAdded).getTime();

  // Elapsed time in days
  const elapsedDays = Math.max(0.01, (now - lastReviewTime) / (1000 * 60 * 60 * 24));
  const prevInterval = word.stabilityDays || 1;
  const prevDifficulty = word.difficultyRating || 5.0;

  let newStability: number;
  let newDifficulty = prevDifficulty;
  let newStreak = word.streak || 0;
  let newLapses = word.lapses || 0;
  let correctDelta = 0;
  let incorrectDelta = 0;
  let newStatus: LearningStatus = word.learningStatus;

  switch (feedback) {
    case 'forgot': {
      // Lapse: user could not recall the word
      incorrectDelta = 1;
      newStreak = 0;
      newLapses += 1;
      // Difficulty increases
      newDifficulty = Math.min(10.0, prevDifficulty + 1.6);
      // Stability resets to short recovery interval (e.g. 6 to 12 hours)
      newStability = 0.35; // ~8.4 hours
      newStatus = newLapses >= 2 ? 'difficult' : 'learning';
      break;
    }

    case 'difficult': {
      // Recalled partially or with significant cognitive effort
      correctDelta = 1;
      newStreak += 1;
      // Difficulty nudges up slightly
      newDifficulty = Math.min(10.0, prevDifficulty + 0.5);
      // Interval expansion is constrained
      const multiplier = Math.max(1.15, 1.35 - (newDifficulty / 20));
      newStability = Math.max(1.0, prevInterval * multiplier);
      newStatus = prevInterval < 3 ? 'learning' : 'review';
      break;
    }

    case 'remembered': {
      // Recalled cleanly
      correctDelta = 1;
      newStreak += 1;
      // Difficulty gently decreases
      newDifficulty = Math.max(1.0, prevDifficulty - 0.35);
      
      // Adaptive exponential expansion based on stability and ease
      // Words that are easier expand faster; harder words expand more cautiously
      const easeBonus = (10.5 - newDifficulty) / 5.0; // range ~0.1 to 1.9
      const expansionFactor = 1.6 + easeBonus;
      
      if (word.reviewCount === 0) {
        newStability = 1.8; // First successful recall scheduled for ~2 days
      } else if (word.reviewCount === 1) {
        newStability = 4.5;
      } else {
        newStability = Math.max(2.0, prevInterval * expansionFactor);
      }

      // Check mastery criteria
      if (newStreak >= 5 && newStability >= 25) {
        newStatus = 'mastered';
      } else {
        newStatus = 'review';
      }
      break;
    }
  }

  // Calculate exact next review timestamp
  const nextReviewMs = now + Math.round(newStability * 24 * 60 * 60 * 1000);
  const nextReviewDateIso = new Date(nextReviewMs).toISOString();

  const updatedWord: Word = {
    ...word,
    difficultyRating: Number(newDifficulty.toFixed(2)),
    difficultyLabel: getDifficultyLabel(newDifficulty),
    learningStatus: newStatus,
    lastReviewed: reviewTimestamp.toISOString(),
    nextReviewDate: nextReviewDateIso,
    reviewCount: word.reviewCount + 1,
    correctCount: word.correctCount + correctDelta,
    incorrectCount: word.incorrectCount + incorrectDelta,
    stabilityDays: Number(newStability.toFixed(2)),
    difficultyFactor: Number(newDifficulty.toFixed(2)),
    lapses: newLapses,
    streak: newStreak,
  };

  const reviewLog: ReviewLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    wordId: word.id,
    wordText: word.word,
    timestamp: reviewTimestamp.toISOString(),
    feedback,
    previousIntervalDays: Number(prevInterval.toFixed(2)),
    newIntervalDays: Number(newStability.toFixed(2)),
    previousDifficulty: Number(prevDifficulty.toFixed(2)),
    newDifficulty: Number(newDifficulty.toFixed(2)),
    mode,
  };

  return { updatedWord, reviewLog };
}

/**
 * Prioritizes words for review queue based on:
 * - Overdue status (nextReviewDate <= now)
 * - Lapses & low accuracy
 * - Difficult flag
 * - Days since last reviewed
 */
export function prioritizeReviewQueue(words: Word[], limit?: number): Word[] {
  const now = Date.now();

  const scored = words.map((w) => {
    const nextMs = new Date(w.nextReviewDate).getTime();
    const isOverdue = nextMs <= now;
    const overdueDays = (now - nextMs) / (1000 * 60 * 60 * 24);

    let priorityScore = 0;

    if (isOverdue) {
      priorityScore += 100 + Math.min(50, overdueDays * 5);
    } else {
      // Future reviews get negative score based on how far away they are
      priorityScore -= Math.min(100, Math.abs(overdueDays) * 2);
    }

    // Difficult words get higher review priority
    if (w.learningStatus === 'difficult' || w.difficultyRating >= 7.0) {
      priorityScore += 30;
    }

    // Repeatedly failed words
    if (w.lapses > 0) {
      priorityScore += Math.min(40, w.lapses * 10);
    }

    // Low accuracy bonus priority
    if (w.reviewCount > 0) {
      const accuracy = w.correctCount / w.reviewCount;
      if (accuracy < 0.6) {
        priorityScore += 25;
      }
    }

    return { word: w, priorityScore };
  });

  // Sort descending by priority score
  scored.sort((a, b) => b.priorityScore - a.priorityScore);

  const result = scored.map((s) => s.word);
  return limit ? result.slice(0, limit) : result;
}
