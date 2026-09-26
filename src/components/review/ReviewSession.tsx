import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Volume2, 
  RotateCcw, 
  ChevronRight, 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  Clock,
  ArrowRight,
  Layers,
  Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Word, ReviewFeedback, ReviewMode } from '../../types';
import { calculateNextReview, prioritizeReviewQueue } from '../../algorithms/spacedRepetition';
import { speechService } from '../../services/speech';

interface ReviewSessionProps {
  allWords: Word[];
  initialMode?: ReviewMode;
  onCompleteReview: (updatedWord: Word, feedback: ReviewFeedback, mode: ReviewMode) => void;
  onExit: () => void;
}

export const ReviewSession: React.FC<ReviewSessionProps> = ({
  allWords,
  initialMode = 'daily',
  onCompleteReview,
  onExit,
}) => {
  const [selectedMode, setSelectedMode] = useState<ReviewMode>(initialMode);
  const [isRevealed, setIsRevealed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionResults, setSessionResults] = useState<{
    remembered: number;
    difficult: number;
    forgot: number;
  }>({ remembered: 0, difficult: 0, forgot: 0 });
  const [isCompleted, setIsCompleted] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Generate the review queue according to mode
  const reviewQueue = useMemo(() => {
    const now = Date.now();

    switch (selectedMode) {
      case 'daily': {
        // Words due or overdue
        const dueWords = allWords.filter(
          (w) => new Date(w.nextReviewDate).getTime() <= now
        );
        if (dueWords.length > 0) {
          return prioritizeReviewQueue(dueWords);
        }
        // Fallback to top priority words if none strictly overdue
        return prioritizeReviewQueue(allWords, 15);
      }

      case 'quick': {
        // 5 - 10 cards
        return prioritizeReviewQueue(allWords, 7);
      }

      case 'difficult': {
        // Words marked difficult or with lapses > 0 or rating >= 6.0
        const diffWords = allWords.filter(
          (w) => w.learningStatus === 'difficult' || w.difficultyRating >= 6.0 || w.lapses > 0
        );
        return diffWords.length > 0 ? diffWords : prioritizeReviewQueue(allWords, 8);
      }

      case 'recent': {
        return [...allWords]
          .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
          .slice(0, 10);
      }

      case 'random': {
        return [...allWords].sort(() => 0.5 - Math.random()).slice(0, 10);
      }

      default:
        return prioritizeReviewQueue(allWords);
    }
  }, [allWords, selectedMode]);

  const currentWord = reviewQueue[currentIndex];

  // Audio pronunciation
  const handlePlayAudio = useCallback(async (wordToSpeak?: Word) => {
    const target = wordToSpeak || currentWord;
    if (!target) return;
    setIsPlayingAudio(true);
    await speechService.speak(target.word, target.language);
    setIsPlayingAudio(false);
  }, [currentWord]);

  // Handle Memory Feedback (Forgot, Difficult, Remembered)
  const handleFeedback = useCallback((feedback: ReviewFeedback) => {
    if (!currentWord || isCompleted) return;

    // Run independent SRS algorithm
    const { updatedWord } = calculateNextReview(currentWord, feedback, selectedMode);
    onCompleteReview(updatedWord, feedback, selectedMode);

    // Update session metrics
    setSessionResults((prev) => ({
      ...prev,
      [feedback]: prev[feedback] + 1,
    }));

    // Proceed to next card or complete
    if (currentIndex + 1 < reviewQueue.length) {
      setIsRevealed(false);
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  }, [currentWord, isCompleted, selectedMode, onCompleteReview, currentIndex, reviewQueue.length]);

  // Keyboard navigation as per Section 33:
  // Space → Show Answer
  // Left Arrow → Forgot
  // Down Arrow → Difficult
  // Right Arrow → Remembered
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (!isRevealed && !isCompleted) {
          setIsRevealed(true);
        }
      } else if (isRevealed && !isCompleted) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handleFeedback('forgot');
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          handleFeedback('difficult');
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          handleFeedback('remembered');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRevealed, isCompleted, handleFeedback]);

  // Restart or change mode
  const handleRestart = (newMode?: ReviewMode) => {
    if (newMode) setSelectedMode(newMode);
    setCurrentIndex(0);
    setIsRevealed(false);
    setIsCompleted(false);
    setSessionResults({ remembered: 0, difficult: 0, forgot: 0 });
  };

  // If word list is completely empty
  if (allWords.length === 0) {
    return (
      <div className="py-16 text-center max-w-md mx-auto">
        <BookOpen className="w-12 h-12 mx-auto text-slate-400 mb-3" />
        <h2 className="font-serif text-xl font-bold text-slate-800 dark:text-slate-200">
          Tekrar Edilecek Kelime Yok
        </h2>
        <p className="text-xs text-slate-500 mt-2 mb-6">
          Henüz kelime bankanızda kelime bulunmuyor. Önce birkaç akademik kelime ekleyin.
        </p>
        <button
          onClick={onExit}
          className="px-5 py-2.5 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-500"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  // Session Completion Screen
  if (isCompleted) {
    const total = sessionResults.remembered + sessionResults.difficult + sessionResults.forgot;
    const accuracy = total > 0 ? Math.round((sessionResults.remembered / total) * 100) : 0;

    return (
      <div className="max-w-xl mx-auto py-10 px-4 text-center">
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-500 mx-auto flex items-center justify-center border border-sky-200 dark:border-sky-800">
            <Sparkles className="w-8 h-8" />
          </div>

          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Tekrar Seansı Tamamlandı
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Bellek kararlılıkları FSRS algoritmasıyla yeniden hesaplandı ve veritabanına kaydedildi.
            </p>
          </div>

          {/* Metrics summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
              <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Hatırlandı</div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                {sessionResults.remembered}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
              <div className="text-xs text-amber-700 dark:text-amber-300 font-medium">Zorlanıldı</div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono mt-1">
                {sessionResults.difficult}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60">
              <div className="text-xs text-rose-700 dark:text-rose-300 font-medium">Unutuldu</div>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono mt-1">
                {sessionResults.forgot}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
            <span>Seans Doğruluk Skoru:</span>
            <span className="font-bold text-sky-600 dark:text-sky-400 text-sm font-mono">%{accuracy}</span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={() => handleRestart('daily')}
              className="flex-1 px-4 py-2.5 rounded-xl bg-sky-600 text-white text-xs sm:text-sm font-semibold hover:bg-sky-500 shadow-sm transition flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Yeni Seans Başlat</span>
            </button>
            <button
              onClick={onExit}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Genel Bakışa Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Mode Switcher & Progress Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => handleRestart('daily')}
            className={`px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer font-semibold ${
              selectedMode === 'daily'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Günün Tekrarı
          </button>
          <button
            onClick={() => handleRestart('quick')}
            className={`px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer font-semibold ${
              selectedMode === 'quick'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Hızlı (7 Kart)
          </button>
          <button
            onClick={() => handleRestart('difficult')}
            className={`px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer font-semibold ${
              selectedMode === 'difficult'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Zor Kelimeler
          </button>
          <button
            onClick={() => handleRestart('random')}
            className={`px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer font-semibold ${
              selectedMode === 'random'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Rastgele
          </button>
        </div>

        {/* Counter */}
        <div className="text-xs font-mono text-slate-500 dark:text-slate-400 font-semibold px-2 shrink-0">
          {currentIndex + 1} / {reviewQueue.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <div 
          className="h-full bg-amber-500 transition-all duration-300 rounded-full"
          style={{ width: `${((currentIndex + 1) / reviewQueue.length) * 100}%` }}
        />
      </div>

      {/* FLASHCARD (Physical card feel with motion animation) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentWord.id + (isRevealed ? '-revealed' : '-front')}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.98 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative min-h-[380px] sm:min-h-[420px] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl flex flex-col justify-between p-6 sm:p-8 text-slate-900 dark:text-slate-100"
        >
          {/* Card Top Information */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {currentWord.partOfSpeech}
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                {currentWord.primaryAcademicContext}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Aralık: {currentWord.stabilityDays} gün</span>
            </div>
          </div>

          {/* FRONT OF CARD: WORD & AUDIO */}
          <div className="my-auto py-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
                {currentWord.word}
              </h1>
              <button
                id="card-audio-btn"
                onClick={() => handlePlayAudio()}
                disabled={isPlayingAudio}
                className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-sky-500 transition shadow-xs"
                title="Sesli Telaffuz (Web Speech API)"
              >
                <Volume2 className={`w-5 h-5 ${isPlayingAudio ? 'animate-pulse text-sky-500' : ''}`} />
              </button>
            </div>

            {/* REVEALED CONTENT (Animate in after clicking Show Answer) */}
            {isRevealed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="pt-6 border-t border-slate-100 dark:border-slate-800/80 text-left space-y-4 max-h-[220px] overflow-y-auto pr-1"
              >
                {/* Turkish Meaning */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Türkçe Anlam
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {currentWord.meanings[0]?.trMeaning}
                  </div>
                  {currentWord.meanings[0]?.secondaryTrMeanings && currentWord.meanings[0].secondaryTrMeanings.length > 0 && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      İkincil: {currentWord.meanings[0].secondaryTrMeanings.join(', ')}
                    </div>
                  )}
                </div>

                {/* Academic Example Sentence */}
                {currentWord.examples && currentWord.examples.length > 0 && (
                  <div className="p-3 rounded-xl bg-sky-50/50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 text-xs">
                    <p className="font-serif italic text-slate-800 dark:text-slate-200">
                      "{currentWord.examples[0].sentence}"
                    </p>
                    {currentWord.examples[0].trTranslation && (
                      <p className="text-slate-500 dark:text-slate-400 mt-1">
                        🇹🇷 {currentWord.examples[0].trTranslation}
                      </p>
                    )}
                  </div>
                )}

                {/* Personal Note if any */}
                {currentWord.personalNote && (
                  <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200/50 dark:border-amber-900/40">
                    💡 <strong>Not:</strong> {currentWord.personalNote}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* CARD ACTION FOOTER */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            {!isRevealed ? (
              <button
                id="show-answer-btn"
                onClick={() => setIsRevealed(true)}
                className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-sky-500 dark:hover:bg-sky-400 text-white font-semibold text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                <span>ANLAMI GÖSTER</span>
                <span className="text-[11px] opacity-70 font-mono hidden sm:inline">(Boşluk / Space)</span>
              </button>
            ) : (
              /* Exactly 3 primary memory feedback buttons (Section 14) */
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {/* 🔴 Forgot */}
                <button
                  id="feedback-forgot-btn"
                  onClick={() => handleFeedback('forgot')}
                  className="py-3 px-2 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/80 transition flex flex-col items-center justify-center gap-1 shadow-xs"
                >
                  <div className="flex items-center gap-1 text-xs sm:text-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>Unuttum</span>
                  </div>
                  <span className="text-[10px] text-rose-500 dark:text-rose-400 font-mono hidden sm:inline">
                    [← Sol Ok]
                  </span>
                </button>

                {/* 🟡 Difficult */}
                <button
                  id="feedback-difficult-btn"
                  onClick={() => handleFeedback('difficult')}
                  className="py-3 px-2 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/80 transition flex flex-col items-center justify-center gap-1 shadow-xs"
                >
                  <div className="flex items-center gap-1 text-xs sm:text-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Zorlandım</span>
                  </div>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono hidden sm:inline">
                    [↓ Aşağı Ok]
                  </span>
                </button>

                {/* 🟢 Remembered */}
                <button
                  id="feedback-remembered-btn"
                  onClick={() => handleFeedback('remembered')}
                  className="py-3 px-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/80 transition flex flex-col items-center justify-center gap-1 shadow-xs"
                >
                  <div className="flex items-center gap-1 text-xs sm:text-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Hatırladım</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono hidden sm:inline">
                    [→ Sağ Ok]
                  </span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Footer shortcut hints */}
      <div className="text-center text-[11px] text-slate-400 space-x-3 hidden sm:block">
        <span>Klavye Kısayolları:</span>
        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">Space: Anlamı Göster</span>
        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">←: Unuttum</span>
        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">↓: Zorlandım</span>
        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">→: Hatırladım</span>
      </div>
    </div>
  );
};
