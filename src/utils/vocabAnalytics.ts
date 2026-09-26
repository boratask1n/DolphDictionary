import { Word, ReviewLog, LanguageCode } from '../types';
import { UserVocabContext } from '../services/aiTutorService';

export function buildUserVocabContext(
  words: Word[],
  reviewLogs: ReviewLog[],
  activeLanguage: LanguageCode
): UserVocabContext {
  const langWords = words.filter((w) => w.language === activeLanguage);

  const mastered = langWords
    .filter((w) => w.learningStatus === 'mastered')
    .map((w) => w.word);

  const learning = langWords
    .filter((w) => w.learningStatus === 'learning' || w.learningStatus === 'review')
    .map((w) => w.word);

  const difficult = langWords
    .filter(
      (w) =>
        w.learningStatus === 'difficult' ||
        (w.lapses && w.lapses > 0) ||
        w.difficultyRating >= 6.0
    )
    .map((w) => w.word);

  const recent = [...langWords]
    .sort(
      (a, b) =>
        new Date(b.dateAdded || 0).getTime() - new Date(a.dateAdded || 0).getTime()
    )
    .slice(0, 10)
    .map((w) => w.word);

  const totalReviews = reviewLogs.length;
  const correctReviews = reviewLogs.filter((l) => l.feedback !== 'forgot').length;
  const accuracyRate =
    totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 100;

  // Streak: consecutive days with reviews
  const reviewDates = new Set(
    reviewLogs.map((l) => new Date(l.timestamp).toDateString())
  );
  let streak = 0;
  const now = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    if (reviewDates.has(d.toDateString())) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return {
    activeLanguage,
    totalWords: langWords.length,
    masteredWords: mastered,
    learningWords: learning,
    difficultWords: difficult,
    recentWords: recent,
    accuracyRate,
    streak,
  };
}
