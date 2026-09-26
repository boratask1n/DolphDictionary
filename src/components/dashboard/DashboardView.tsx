import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  RotateCw, 
  Flame, 
  TrendingUp, 
  ArrowRight, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Volume2, 
  GraduationCap, 
  Plus, 
  Calendar,
  Bookmark,
  Bot,
  Target,
  Edit3,
  X,
  BarChart3,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Word, ReviewLog, LanguageCode } from '../../types';
import { HomeAIChatWidget } from '../ai/HomeAIChatWidget';
import { DashboardAnalyticsCarousel } from './DashboardAnalyticsCarousel';

interface DashboardViewProps {
  words: Word[];
  reviewLogs: ReviewLog[];
  activeLanguage: LanguageCode;
  onStartReview: () => void;
  onNavigateToReels: () => void;
  onNavigateToDictionary: (filterContext?: string) => void;
  onNavigateToAnalytics?: () => void;
  onAddNew: () => void;
  onSelectWord?: (word: Word) => void;
  onOpenAIChat?: (word?: Word) => void;
  userWeeklyGoal?: number;
  onUpdateWeeklyGoal?: (goal: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  words,
  reviewLogs,
  activeLanguage,
  onStartReview,
  onNavigateToReels,
  onNavigateToDictionary,
  onNavigateToAnalytics,
  onAddNew,
  onSelectWord,
  onOpenAIChat,
  userWeeklyGoal,
  onUpdateWeeklyGoal,
}) => {
  const [playingWordId, setPlayingWordId] = useState<string | null>(null);
  const [showQuickCarouselPreview, setShowQuickCarouselPreview] = useState(false);

  // Filter words strictly for current active language
  const languageWords = useMemo(() => {
    return words.filter((w) => w.language === activeLanguage);
  }, [words, activeLanguage]);

  const now = Date.now();

  // Metrics
  const totalWords = languageWords.length;
  const masteredWords = languageWords.filter((w) => w.learningStatus === 'mastered').length;
  const learningWords = languageWords.filter((w) => w.learningStatus === 'learning' || w.learningStatus === 'review').length;
  const dueWords = languageWords.filter((w) => new Date(w.nextReviewDate).getTime() <= now);
  const difficultWords = languageWords.filter(
    (w) => w.learningStatus === 'difficult' || w.difficultyRating >= 6.0 || (w.lapses && w.lapses > 0)
  );

  const masteryPercentage = totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0;
  const learningPercentage = totalWords > 0 ? Math.round((learningWords / totalWords) * 100) : 0;
  const difficultPercentage = totalWords > 0 ? Math.max(0, 100 - masteryPercentage - learningPercentage) : 0;

  // Review logs calculations
  const totalReviews = reviewLogs.length;
  const correctReviews = reviewLogs.filter((l) => l.feedback !== 'forgot').length;
  const accuracy = totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 100;

  // Streak calculation
  const currentStreak = useMemo(() => calculateStreak(reviewLogs), [reviewLogs]);

  // User configurable weekly goal
  const [weeklyGoal, setWeeklyGoal] = useState<number>(() => {
    if (userWeeklyGoal && userWeeklyGoal > 0) return userWeeklyGoal;
    const stored = localStorage.getItem('lexilab_weekly_goal');
    return stored ? parseInt(stored, 10) : 30;
  });
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoalInput, setTempGoalInput] = useState<number>(weeklyGoal);

  useEffect(() => {
    if (userWeeklyGoal && userWeeklyGoal > 0) {
      setWeeklyGoal(userWeeklyGoal);
      setTempGoalInput(userWeeklyGoal);
    }
  }, [userWeeklyGoal]);

  const handleSaveGoal = (newGoal: number) => {
    const valid = Math.max(5, Math.min(250, newGoal));
    setWeeklyGoal(valid);
    localStorage.setItem('lexilab_weekly_goal', valid.toString());
    if (onUpdateWeeklyGoal) {
      onUpdateWeeklyGoal(valid);
    }
    setIsEditingGoal(false);
  };

  // Weekly completed words calculation (unique words studied/reviewed in last 7 days)
  const weeklyCompletedWords = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const minTimestamp = sevenDaysAgo.getTime();

    const uniqueCompletedWordIds = new Set<string>();

    reviewLogs.forEach((log) => {
      try {
        if (new Date(log.timestamp).getTime() >= minTimestamp) {
          uniqueCompletedWordIds.add(log.wordId);
        }
      } catch {
        // ignore
      }
    });

    languageWords.forEach((w) => {
      if (w.lastReviewed) {
        try {
          if (new Date(w.lastReviewed).getTime() >= minTimestamp) {
            uniqueCompletedWordIds.add(w.id);
          }
        } catch {
          // ignore
        }
      }
    });

    return uniqueCompletedWordIds.size;
  }, [reviewLogs, languageWords]);

  const weeklyProgressPercentage = Math.min(100, Math.round((weeklyCompletedWords / weeklyGoal) * 100));
  const remainingWeeklyWords = Math.max(0, weeklyGoal - weeklyCompletedWords);
  const isWeeklyGoalAchieved = weeklyCompletedWords >= weeklyGoal;

  // Daily completed words counter (unique words studied/reviewed today)
  const dailyCompletedWords = useMemo(() => {
    const todayKey = new Date().toISOString().split('T')[0];
    const todayWordIds = new Set<string>();

    reviewLogs.forEach((log) => {
      try {
        if (log.timestamp.startsWith(todayKey)) {
          todayWordIds.add(log.wordId);
        }
      } catch {
        // ignore
      }
    });

    languageWords.forEach((w) => {
      if (w.lastReviewed && w.lastReviewed.startsWith(todayKey)) {
        todayWordIds.add(w.id);
      }
    });

    return todayWordIds.size;
  }, [reviewLogs, languageWords]);

  const dailyTarget = 10;
  const isDailyTargetAchieved = dailyCompletedWords >= dailyTarget;

  // Spotlight Word of the Day (seeded deterministically by date or first due word)
  const spotlightWord = useMemo(() => {
    if (languageWords.length === 0) return null;
    if (dueWords.length > 0) return dueWords[0];
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return languageWords[dayOfYear % languageWords.length];
  }, [languageWords, dueWords]);

  // Distinct academic contexts
  const academicContexts = useMemo(() => {
    const map = new Map<string, number>();
    languageWords.forEach((w) => {
      const ctx = w.primaryAcademicContext || 'General Academic';
      map.set(ctx, (map.get(ctx) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [languageWords]);

  // Recently added or studied words (last 4)
  const recentWords = useMemo(() => {
    return [...languageWords]
      .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
      .slice(0, 4);
  }, [languageWords]);

  // Audio pronunciation using Web Speech API
  const playAudio = (word: Word, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (playingWordId) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word.word);
      utterance.lang = activeLanguage === 'de' ? 'de-DE' : 'en-US';
      utterance.rate = 0.88;
      setPlayingWordId(word.id);
      utterance.onend = () => setPlayingWordId(null);
      utterance.onerror = () => setPlayingWordId(null);
      window.speechSynthesis.speak(utterance);
    }
  };

  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat('tr-TR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    }).format(new Date());
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-7 pb-24">
      
      {/* 1. HERO GREETING & STATUS BANNER */}
      <section className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] p-6 sm:p-8 shadow-xs">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* Live date and status chips */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-semibold">
                <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{formattedDate}</span>
              </span>

              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-900 dark:text-amber-300 font-mono text-xs font-bold border border-amber-500/20">
                <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 fill-amber-500/20" />
                <span>{currentStreak > 0 ? `${currentStreak} Gün Seri` : 'Bugün Başla'}</span>
              </span>

              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {activeLanguage === 'en' ? '🇬🇧 İngilizce' : '🇩🇪 Almanca'}
              </span>
            </div>

            {/* Editorial Greeting Headline */}
            <div>
              <h1 className="font-serif font-bold text-2xl sm:text-3xl lg:text-4xl text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                Günün Kelime Çalışması
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 font-sans max-w-xl leading-relaxed">
                Aralıklı tekrar (FSRS) ve animasyonlu Sticky Reels ile kelimeleri kalıcı hafızanıza kaydedin.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2.5 shrink-0">
            <button
              id="hero-start-review-btn"
              onClick={onStartReview}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-950 font-sans font-semibold text-sm transition active:scale-95 shadow-xs cursor-pointer"
            >
              <RotateCw className="w-4 h-4 text-amber-400 dark:text-amber-600" />
              <span>Günün Tekrarına Başla</span>
              <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 dark:bg-black/10 text-xs font-mono font-bold">
                {dueWords.length}
              </span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onOpenAIChat && (
                <button
                  onClick={() => onOpenAIChat()}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 text-xs font-semibold border border-amber-500/20 transition cursor-pointer"
                  title="AI Dil Koçu ile Sohbet Et"
                >
                  <Bot className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>AI Dil Koçu</span>
                </button>
              )}

              <button
                onClick={onNavigateToReels}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Sticky Reels</span>
              </button>

              <button
                onClick={onAddNew}
                className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition cursor-pointer"
                title="Yeni Kelime Ekle"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Kelime Ekle</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HAFTALIK HEDEF İLERLEMESİ VE GÜNLÜK TAMAMLANAN KELİME SAYACI */}
      <section className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* LEFT: Haftalık Kelime Öğrenme Hedefi & İlerleme Çubuğu (Col 7) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400">
                    <Target className="w-4 h-4" />
                  </span>
                  <h2 className="font-serif font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                    Haftalık Hedef İlerlemesi
                  </h2>
                </div>

                {/* Edit Target Goal Button */}
                <button
                  onClick={() => {
                    setTempGoalInput(weeklyGoal);
                    setIsEditingGoal(!isEditingGoal);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                  title="Haftalık Hedefi Düzenle"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Hedefi Düzenle</span>
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Belirlediğiniz haftalık kelime hedefine göre öğrenilen ve başarıyla tekrarlanan kelime ilerlemeniz.
              </p>
            </div>

            {/* Inline Goal Editor Drawer/Box if active */}
            {isEditingGoal && (
              <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2.5 transition">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <span>Haftalık Kelime Hedefini Belirle:</span>
                  <button 
                    onClick={() => setIsEditingGoal(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {[15, 25, 35, 50, 75].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => handleSaveGoal(preset)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                        weeklyGoal === preset
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] hover:border-amber-400'
                      }`}
                    >
                      {preset} Kelime
                    </button>
                  ))}

                  <div className="flex items-center gap-1.5 ml-auto">
                    <input
                      type="number"
                      min={5}
                      max={250}
                      value={tempGoalInput}
                      onChange={(e) => setTempGoalInput(Number(e.target.value))}
                      className="w-16 px-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-center focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <button
                      onClick={() => handleSaveGoal(tempGoalInput)}
                      className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition cursor-pointer"
                    >
                      Kaydet
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Bar Container */}
            <div className="space-y-2">
              <div className="flex items-end justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-sans font-bold text-2xl sm:text-3xl text-slate-900 dark:text-slate-100 tabular-nums">
                    {weeklyCompletedWords}
                  </span>
                  <span className="text-slate-400 font-mono text-xs sm:text-sm font-semibold">
                    / {weeklyGoal} kelime
                  </span>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  <span>%{weeklyProgressPercentage} Tamamlandı</span>
                </div>
              </div>

              {/* Visual Segmented & Animated Progress Bar */}
              <div className="relative w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isWeeklyGoalAchieved
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/20'
                      : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600'
                  }`}
                  style={{ width: `${weeklyProgressPercentage}%` }}
                />
              </div>

              {/* Status Message */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                {isWeeklyGoalAchieved ? (
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Tebrikler! Haftalık kelime hedefinize ulaştınız 🎉</span>
                  </span>
                ) : (
                  <span>
                    Hedefe ulaşmak için <strong className="text-slate-700 dark:text-slate-200 font-mono">{remainingWeeklyWords}</strong> kelime kaldı.
                  </span>
                )}

                <span className="font-mono text-[11px] text-slate-400 hidden sm:inline">
                  Son 7 Gün İlerlemesi
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: Günlük Tamamlanan Kelime Sayacı (Col 5) */}
          <div className="lg:col-span-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-amber-50/30 dark:from-slate-800/50 dark:to-slate-800/30 border border-slate-200/60 dark:border-white/[0.06] flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-700 dark:text-sky-400">
                  <Clock className="w-4 h-4" />
                </span>
                <span className="font-serif font-bold text-sm text-slate-900 dark:text-slate-100">
                  Günlük Tamamlanan Sayaç
                </span>
              </div>

              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                isDailyTargetAchieved
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                  : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {isDailyTargetAchieved ? 'Hedef Aşıldı ✓' : `Hedef: ${dailyTarget} / gün`}
              </span>
            </div>

            {/* Counter display */}
            <div className="flex items-baseline gap-3 my-1">
              <div className="font-sans font-bold text-4xl sm:text-5xl text-slate-900 dark:text-slate-100 tracking-tight tabular-nums">
                {dailyCompletedWords}
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Kelime Bugün Tamamlandı
                </p>
                <p className="text-[11px] text-slate-400">
                  Bugünkü tekrar seanslarında başarıyla tamamlanan sözcükler
                </p>
              </div>
            </div>

            {/* Today status bar */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                {dailyCompletedWords > 0 
                  ? `Bugün ${dailyCompletedWords} kelime tamamlandı!`
                  : 'Günün tekrarına başlayarak sayacı artırın'}
              </span>
              <button
                onClick={onStartReview}
                className="text-amber-700 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Tekrara Başla</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 3. CORE BENTO GRID: SPOTLIGHT WORD & 4 STAT METRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT: Günün Kelimesi Spotlight Card (Col 7) */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="font-serif font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                Günün Odak Kelimesi
              </h2>
            </div>
            <button
              onClick={onNavigateToReels}
              className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 transition cursor-pointer"
            >
              <span>Reels&apos;te İncele</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {spotlightWord ? (
            <div className="relative w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] p-6 shadow-xs transition space-y-4">
              
              {/* Metadata row */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-800 dark:text-amber-300">
                    {spotlightWord.language.toUpperCase()}
                  </span>
                  {spotlightWord.partOfSpeech && (
                    <span className="text-xs italic font-serif text-slate-400">
                      {spotlightWord.partOfSpeech}
                    </span>
                  )}
                  {spotlightWord.primaryAcademicContext && (
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" />
                      <span>{spotlightWord.primaryAcademicContext}</span>
                    </span>
                  )}
                </div>

                {spotlightWord.cefrLevel && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {spotlightWord.cefrLevel}
                  </span>
                )}
              </div>

              {/* Headword & Audio / AI Actions */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                    {spotlightWord.word}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onOpenAIChat && (
                    <button
                      onClick={() => onOpenAIChat(spotlightWord)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/25 text-xs font-semibold transition cursor-pointer"
                      title="AI ile Kelimeyi İncele & Cümle Kur"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>AI Analiz</span>
                    </button>
                  )}

                  <button
                    onClick={(e) => playAudio(spotlightWord, e)}
                    disabled={playingWordId === spotlightWord.id}
                    className={`p-2.5 rounded-xl transition cursor-pointer ${
                      playingWordId === spotlightWord.id
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                    title="Telaffuzu Dinle"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Turkish Meaning Box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/[0.04] space-y-1">
                <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                  Türkçe Anlamı
                </p>
                <p className="font-serif font-bold text-xl text-amber-950 dark:text-amber-200">
                  {spotlightWord.meanings[0]?.trMeaning || '—'}
                </p>
                {spotlightWord.meanings[0]?.secondaryTrMeanings && spotlightWord.meanings[0].secondaryTrMeanings.length > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                    Diğer: {spotlightWord.meanings[0].secondaryTrMeanings.join(', ')}
                  </p>
                )}
              </div>

              {/* Example sentence */}
              {spotlightWord.examples[0] && (
                <div className="p-3.5 rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-100 dark:border-white/[0.04] text-xs leading-relaxed font-serif italic text-slate-800 dark:text-slate-200">
                  &ldquo;{spotlightWord.examples[0].sentence}&rdquo;
                  {spotlightWord.examples[0].trTranslation && (
                    <p className="not-italic font-sans text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {spotlightWord.examples[0].trTranslation}
                    </p>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
                <span>Zorluk Derecesi: {spotlightWord.difficultyLabel || 'Orta'}</span>
                <button
                  onClick={() => onNavigateToDictionary(spotlightWord.primaryAcademicContext)}
                  className="text-amber-700 dark:text-amber-400 hover:underline font-medium cursor-pointer"
                >
                  Sözlükte Bul
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] text-center text-slate-400 text-sm">
              Henüz kayıtlı kelime bulunmuyor.
            </div>
          )}
        </div>

        {/* RIGHT: 4 STAT METRICS BENTO (Col 5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <h2 className="font-serif font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
              Kelime İstatistikleri
            </h2>
            <span className="text-xs font-mono text-slate-400">
              {totalWords} kayıtlı sözcük
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Card 1: Kelime Haznesi */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Hazne
                </span>
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="font-sans font-bold text-2xl sm:text-3xl text-slate-900 dark:text-slate-100">
                {totalWords}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {activeLanguage.toUpperCase()} kelime
              </p>
            </div>

            {/* Card 2: Ustalaşılan */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Ustalaşılan
                </span>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="font-sans font-bold text-2xl sm:text-3xl text-emerald-600 dark:text-emerald-400">
                {masteredWords}
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
                %{masteryPercentage} kalıcı
              </p>
            </div>

            {/* Card 3: Tekrar Bekleyen */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Tekrar Sırası
                </span>
                <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-400 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="font-sans font-bold text-2xl sm:text-3xl text-rose-600 dark:text-rose-400">
                {dueWords.length}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Zamanı gelenler
              </p>
            </div>

            {/* Card 4: Doğruluk Oranı */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Doğruluk
                </span>
                <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-700 dark:text-sky-400 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="font-sans font-bold text-2xl sm:text-3xl text-sky-600 dark:text-sky-400">
                %{accuracy}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {totalReviews} tekrar seansı
              </p>
            </div>
          </div>

          {/* Progress Bar Container */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Öğrenme Durum Dağılımı
              </span>
              <span className="font-mono text-slate-400">
                %{masteryPercentage} Ustalaşıldı
              </span>
            </div>

            {/* Segmented Bar */}
            <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden">
              <div 
                className="bg-emerald-500 h-full transition-all duration-300" 
                style={{ width: `${masteryPercentage}%` }}
                title={`Ustalaşıldı: ${masteredWords} kelime`}
              />
              <div 
                className="bg-amber-400 h-full transition-all duration-300" 
                style={{ width: `${learningPercentage}%` }}
                title={`Öğreniliyor: ${learningWords} kelime`}
              />
              <div 
                className="bg-rose-400 h-full transition-all duration-300" 
                style={{ width: `${difficultPercentage}%` }}
                title={`Zor: ${difficultWords.length} kelime`}
              />
            </div>

            {/* Micro legend */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Ustalaşıldı ({masteredWords})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Öğreniliyor ({learningWords})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>Zor ({difficultWords.length})</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. ÖĞRENME ANALİTİĞİ & GRAFİKLER SAYFASI PORTALI */}
      <section className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-md relative overflow-hidden border border-slate-700/50">
        {/* Subtle decorative glow */}
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-40 bottom-0 -mb-16 w-48 h-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                <BarChart3 className="w-4 h-4" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400">
                Ayrı Grafikler Sayfası
              </span>
            </div>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-white tracking-tight">
              Öğrenme Analitiği & Performans Grafikleri
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Zorlandığınız kritik kelimeler, Spaced Repetition (FSRS) hafıza kalıcılık eğrisi ve 7 günlük çalışma süresi sütun grafiği ayrı bir sayfa altında toplandı.
            </p>

            {/* Micro KPI highlights */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap pt-1 text-xs">
              <span className="px-3 py-1 rounded-xl bg-white/10 text-rose-300 border border-white/10 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>{difficultWords.length} Zor Kelime</span>
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/10 text-emerald-300 border border-white/10 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>%{masteryPercentage} Kalıcı Bellek</span>
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/10 text-sky-300 border border-white/10 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span>7 Günlük Süre Grafiği</span>
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            {onNavigateToAnalytics && (
              <button
                id="portal-analytics-btn"
                onClick={onNavigateToAnalytics}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-sky-400 to-amber-400 hover:from-sky-300 hover:to-amber-300 text-slate-950 font-bold text-sm transition active:scale-95 shadow-lg shadow-sky-500/20 cursor-pointer"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Grafikler Sayfasını Aç</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setShowQuickCarouselPreview(!showQuickCarouselPreview)}
              className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold border border-white/10 transition cursor-pointer"
            >
              <span>{showQuickCarouselPreview ? 'Önizlemeyi Gizle' : 'Anasayfada Önizle'}</span>
              {showQuickCarouselPreview ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Optional Expandable Preview Carousel */}
        {showQuickCarouselPreview && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <DashboardAnalyticsCarousel
              words={words}
              reviewLogs={reviewLogs}
              activeLanguage={activeLanguage}
              onSelectWord={onSelectWord}
              onOpenAIChat={onOpenAIChat}
              onStartReview={onStartReview}
              onNavigateToDictionary={onNavigateToDictionary}
            />
          </div>
        )}
      </section>

      {/* 4. DEDICATED GENERAL AI CHAT WINDOW (Professional Language Coach) */}
      <HomeAIChatWidget
        activeLanguage={activeLanguage}
        onExpand={() => onOpenAIChat?.()}
        words={words}
        reviewLogs={reviewLogs}
      />

      {/* 4. DISCIPLINE HUBS & RECENT WORDS DISCOVERY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: Academic & Daily Disciplines Hub (Col 5) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-serif font-bold text-base text-slate-900 dark:text-slate-100">
                Kelime Alanları & Konular
              </h3>
            </div>
            <button
              onClick={() => onNavigateToDictionary()}
              className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
            >
              Tümü
            </button>
          </div>

          <div className="space-y-2">
            {academicContexts.map(([ctx, count]) => (
              <button
                key={ctx}
                onClick={() => onNavigateToDictionary(ctx)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-white/[0.04] transition group text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition">
                    {ctx}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-medium text-slate-400">
                    {count}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: Son Eklenen Kelimeler Stream (Col 7) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-serif font-bold text-base text-slate-900 dark:text-slate-100">
                Son Eklenenler
              </h3>
            </div>
            <button
              onClick={() => onNavigateToDictionary()}
              className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Sözlüğe Git</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
            {recentWords.map((word) => {
              const isSpeaking = playingWordId === word.id;
              return (
                <div
                  key={word.id}
                  onClick={() => onSelectWord ? onSelectWord(word) : onNavigateToDictionary()}
                  className="py-2.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={(e) => playAudio(word, e)}
                      className={`p-2 rounded-lg transition shrink-0 cursor-pointer ${
                        isSpeaking
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-white'
                      }`}
                      title="Dinle"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="font-serif font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition">
                          {word.word}
                        </span>
                        {word.partOfSpeech && (
                          <span className="text-[11px] italic font-serif text-slate-400">
                            {word.partOfSpeech}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {word.meanings[0]?.trMeaning || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {onOpenAIChat && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAIChat(word);
                        }}
                        className="p-1 rounded-lg text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 transition cursor-pointer"
                        title="AI ile Kelimeyi İncele & Cümle Kur"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {word.primaryAcademicContext && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hidden sm:inline">
                        {word.primaryAcademicContext}
                      </span>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

function calculateStreak(logs: ReviewLog[]): number {
  if (logs.length === 0) return 0;
  
  const days = new Set<string>();
  logs.forEach((l) => {
    const d = new Date(l.timestamp).toISOString().split('T')[0];
    days.add(d);
  });

  const sortedDays = Array.from(days).sort().reverse();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (!sortedDays.includes(today) && !sortedDays.includes(yesterday)) {
    return 0;
  }

  return sortedDays.length;
}
