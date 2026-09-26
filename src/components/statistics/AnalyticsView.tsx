import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  Flame, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCw, 
  TrendingUp, 
  Calendar,
  Clock,
  BookOpen,
  Volume2,
  Sparkles,
  ArrowRight,
  Filter,
  Layers,
  Award,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { Word, ReviewLog, LanguageCode } from '../../types';

interface AnalyticsViewProps {
  words: Word[];
  reviewLogs: ReviewLog[];
  activeLanguage: LanguageCode;
  onLanguageChange?: (lang: LanguageCode) => void;
  onStartReview: () => void;
  onNavigateToDictionary: (filterContext?: string) => void;
  onSelectWord?: (word: Word) => void;
  onOpenAIChat?: (word?: Word) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  words,
  reviewLogs,
  activeLanguage,
  onLanguageChange,
  onStartReview,
  onNavigateToDictionary,
  onSelectWord,
  onOpenAIChat,
}) => {
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState<'current' | 'all'>('current');
  const [activeChartTab, setActiveChartTab] = useState<'all' | 'struggled' | 'progress' | 'time'>('all');
  const [playingWordId, setPlayingWordId] = useState<string | null>(null);

  // Filter words based on selected scope
  const targetWords = useMemo(() => {
    if (selectedLanguageFilter === 'all') return words;
    return words.filter((w) => w.language === activeLanguage);
  }, [words, activeLanguage, selectedLanguageFilter]);

  const now = Date.now();
  const totalWords = targetWords.length;
  const masteredWords = targetWords.filter((w) => w.learningStatus === 'mastered').length;
  const learningWords = targetWords.filter((w) => w.learningStatus === 'learning').length;
  const reviewWords = targetWords.filter((w) => w.learningStatus === 'review').length;
  const difficultWords = targetWords.filter(
    (w) => w.learningStatus === 'difficult' || w.difficultyRating >= 6.0 || (w.lapses && w.lapses > 0)
  ).length;
  const newWords = targetWords.filter((w) => w.learningStatus === 'new' || (!w.learningStatus && !w.lastReviewed)).length;

  const totalReviews = reviewLogs.length;
  const rememberedLogs = reviewLogs.filter((l) => l.feedback === 'remembered').length;
  const difficultFeedbackLogs = reviewLogs.filter((l) => l.feedback === 'difficult').length;
  const forgotLogs = reviewLogs.filter((l) => l.feedback === 'forgot').length;

  const accuracy = totalReviews > 0 
    ? Math.round(((rememberedLogs + difficultFeedbackLogs * 0.5) / totalReviews) * 100) 
    : 100;

  // Audio pronunciation helper
  const handlePlayAudio = (word: Word, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (playingWordId) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word.word);
      utterance.lang = word.language === 'de' ? 'de-DE' : 'en-US';
      utterance.rate = 0.88;
      setPlayingWordId(word.id);
      utterance.onend = () => setPlayingWordId(null);
      utterance.onerror = () => setPlayingWordId(null);
      window.speechSynthesis.speak(utterance);
    }
  };

  // 1. DATA: Most Challenged / Struggled Words
  const mostStruggledWords = useMemo(() => {
    return [...targetWords]
      .filter((w) => {
        const hasLapses = (w.lapses && w.lapses > 0);
        const isDifficult = w.learningStatus === 'difficult' || w.difficultyRating >= 5.5;
        const hasMistakes = (w.incorrectCount && w.incorrectCount > 0);
        return hasLapses || isDifficult || hasMistakes;
      })
      .map((w) => {
        const lapseScore = (w.lapses || 0) * 15;
        const ratingScore = (w.difficultyRating || 5.0) * 8;
        const incorrectScore = (w.incorrectCount || 0) * 10;
        const totalReviewsCount = (w.correctCount || 0) + (w.incorrectCount || 0);
        const accuracyRate = totalReviewsCount > 0 ? Math.round(((w.correctCount || 0) / totalReviewsCount) * 100) : 60;
        const failureScore = Math.min(100, Math.round(lapseScore + ratingScore + incorrectScore));

        return {
          word: w,
          impactScore: failureScore,
          accuracyRate,
          lapses: w.lapses || 0,
          incorrectCount: w.incorrectCount || 0,
          difficultyRating: w.difficultyRating || 5.0,
        };
      })
      .sort((a, b) => b.impactScore - a.impactScore)
      .slice(0, 8);
  }, [targetWords]);

  // 2. DATA: Retention & CEFR Distribution
  const memoryRetentionRate = useMemo(() => {
    if (totalWords === 0) return 0;
    const reviewRetention = totalReviews > 0 ? Math.round((rememberedLogs / totalReviews) * 100) : 85;
    const wordStatusRetention = Math.round(((masteredWords * 1.0 + learningWords * 0.7 + reviewWords * 0.5) / totalWords) * 100);
    return Math.min(100, Math.max(10, Math.round((reviewRetention * 0.4) + (wordStatusRetention * 0.6))));
  }, [totalWords, totalReviews, rememberedLogs, masteredWords, learningWords, reviewWords]);

  const cefrLevels = useMemo(() => {
    const levels = ['B1', 'B2', 'C1', 'C2'] as const;
    return levels.map((lvl) => {
      const count = targetWords.filter((w) => w.cefrLevel === lvl).length;
      const percentage = totalWords > 0 ? Math.round((count / totalWords) * 100) : 0;
      return { level: lvl, count, percentage };
    });
  }, [targetWords, totalWords]);

  // 3. DATA: 7-Day Weekly Study Time
  const weeklyStudyStats = useMemo(() => {
    const daysList = [];
    const dayNamesTR = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const today = new Date();
    
    let totalMinutesWeek = 0;
    let totalReviewsWeek = 0;
    let maxMinutesDay = 0;
    let peakDayName = '';

    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(today.getDate() - i);
      const dateKey = targetDate.toISOString().split('T')[0];
      const dayIndex = targetDate.getDay();
      const dayLabel = dayNamesTR[dayIndex];
      const isToday = i === 0;

      const dayLogs = reviewLogs.filter((log) => {
        try {
          return new Date(log.timestamp).toISOString().split('T')[0] === dateKey;
        } catch {
          return false;
        }
      });

      const reviewCount = dayLogs.length;
      totalReviewsWeek += reviewCount;

      let minutes = reviewCount > 0 ? Math.round((reviewCount * 0.85) + 3) : 0;
      if (isToday && minutes === 0 && targetWords.some(w => w.lastReviewed && w.lastReviewed.startsWith(dateKey))) {
        minutes = 12;
      }

      totalMinutesWeek += minutes;
      if (minutes > maxMinutesDay) {
        maxMinutesDay = minutes;
        peakDayName = dayLabel;
      }

      daysList.push({
        dateKey,
        dayLabel,
        isToday,
        reviewCount,
        minutes,
        heightPercentage: 0,
      });
    }

    const chartCeiling = Math.max(30, maxMinutesDay * 1.25);
    daysList.forEach((d) => {
      d.heightPercentage = Math.min(100, Math.max(d.minutes > 0 ? 12 : 4, Math.round((d.minutes / chartCeiling) * 100)));
    });

    const averageDailyMinutes = Math.round(totalMinutesWeek / 7);
    const dailyTargetMinutes = 20;
    const targetAchievedDays = daysList.filter((d) => d.minutes >= dailyTargetMinutes).length;

    return {
      daysList,
      totalMinutesWeek,
      totalReviewsWeek,
      averageDailyMinutes,
      dailyTargetMinutes,
      targetAchievedDays,
      peakDayName: peakDayName || 'Bugün',
    };
  }, [reviewLogs, targetWords]);

  // Academic Context breakdown
  const academicContexts = useMemo(() => {
    const map = new Map<string, number>();
    targetWords.forEach((w) => {
      const ctx = w.primaryAcademicContext || 'General Academic';
      map.set(ctx, (map.get(ctx) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1]);
  }, [targetWords]);

  // Recent 10 Review Logs
  const recentLogs = useMemo(() => {
    return [...reviewLogs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }, [reviewLogs]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-7 pb-24">
      {/* Header & Controls */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <BarChart3 className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Öğrenme Analitiği & Raporlar
            </span>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 dark:text-slate-100 tracking-tight">
            Performans & İlerleme Grafikleri
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Zorlandığınız kelimeler, hafıza kalıcılık oranları ve haftalık çalışma sürelerinizin detaylı görsel analizi.
          </p>
        </div>

        {/* Filters and CTA */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Scope switch: Current language vs All */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-white/[0.06] text-xs font-semibold">
            <button
              onClick={() => setSelectedLanguageFilter('current')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                selectedLanguageFilter === 'current'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {activeLanguage === 'en' ? '🇬🇧 İngilizce' : '🇩🇪 Almanca'}
            </button>
            <button
              onClick={() => setSelectedLanguageFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                selectedLanguageFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Tüm Diller ({words.length})
            </button>
          </div>

          <button
            onClick={onStartReview}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-semibold text-xs transition cursor-pointer shadow-xs"
          >
            <RotateCw className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
            <span>Tekrara Başla</span>
          </button>
        </div>
      </section>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
            <span>Toplam Kelime</span>
            <BookOpen className="w-4 h-4 text-amber-500" />
          </div>
          <div className="font-sans font-bold text-2xl sm:text-3xl text-slate-900 dark:text-slate-100 tabular-nums">
            {totalWords}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {masteredWords} ustalaşıldı, {learningWords + reviewWords} aktif
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
            <span>Hafıza Kalıcılığı</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="font-sans font-bold text-2xl sm:text-3xl text-emerald-600 dark:text-emerald-400 tabular-nums">
            %{memoryRetentionRate}
          </div>
          <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1">
            FSRS aralıklı tekrar skoru
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
            <span>Haftalık Çalışma</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <div className="font-sans font-bold text-2xl sm:text-3xl text-sky-600 dark:text-sky-400 tabular-nums">
            {weeklyStudyStats.totalMinutesWeek} <span className="text-base font-sans font-medium text-slate-400">dk</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Ortalama {weeklyStudyStats.averageDailyMinutes} dk / gün
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
            <span>Kritik Zor Kelimeler</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="font-sans font-bold text-2xl sm:text-3xl text-rose-600 dark:text-rose-400 tabular-nums">
            {difficultWords}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Zorluk &ge; 6.0 veya unutulanlar
          </p>
        </div>
      </div>

      {/* Nav Tabs for Chart Focus */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/[0.08] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveChartTab('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
            activeChartTab === 'all'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Tüm Grafikler
        </button>
        <button
          onClick={() => setActiveChartTab('struggled')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
            activeChartTab === 'struggled'
              ? 'bg-rose-500 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Zor Kelimeler Grafiği ({mostStruggledWords.length})</span>
        </button>
        <button
          onClick={() => setActiveChartTab('progress')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
            activeChartTab === 'progress'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Öğrenme İlerlemesi Grafiği</span>
        </button>
        <button
          onClick={() => setActiveChartTab('time')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
            activeChartTab === 'time'
              ? 'bg-sky-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Haftalık Çalışma Süresi Grafiği</span>
        </button>
      </div>

      {/* SECTION 1: EN ÇOK ZORLANILAN KELİMELER GRAFİĞİ */}
      {(activeChartTab === 'all' || activeChartTab === 'struggled') && (
        <section className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                </span>
                <h2 className="font-serif font-bold text-xl text-slate-900 dark:text-slate-100">
                  En Çok Zorlanılan Kelimeler Grafiği
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Unutulma sıklığı, hata adedi ve algoritmik zorluk katsayısı yüksek kelimelerin görsel etki sıralaması.
              </p>
            </div>

            <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
              {mostStruggledWords.length} Kritik Kelime
            </span>
          </div>

          {mostStruggledWords.length === 0 ? (
            <div className="p-10 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/[0.04] text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="font-serif font-bold text-slate-800 dark:text-slate-200">
                Harika! Kritik seviyede zorlanılan kelime bulunmuyor.
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tekrar seanslarında kelimeler hatırlandıkça veya yeni kelimeler eklendikçe zorluk seviyeleri burada dinamik olarak grafiklenecektir.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {mostStruggledWords.map((item, index) => {
                const word = item.word;
                const isSpeaking = playingWordId === word.id;
                
                // Color mapping for failure score
                let barColor = 'from-amber-400 to-amber-500';
                if (item.impactScore >= 70) barColor = 'from-rose-500 to-red-600';
                else if (item.impactScore >= 50) barColor = 'from-orange-400 to-rose-500';

                return (
                  <div
                    key={word.id}
                    className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 hover:bg-slate-100/80 dark:bg-slate-800/40 dark:hover:bg-slate-800/70 border border-slate-200/50 dark:border-white/[0.04] transition group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
                      {/* Left: Word headword, audio, meaning */}
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>

                        <button
                          onClick={(e) => handlePlayAudio(word, e)}
                          disabled={isSpeaking}
                          className={`p-2 rounded-xl transition cursor-pointer shrink-0 ${
                            isSpeaking
                              ? 'bg-amber-500 text-white'
                              : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 shadow-2xs'
                          }`}
                          title="Telaffuzu Dinle"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span 
                              onClick={() => onSelectWord ? onSelectWord(word) : onNavigateToDictionary()}
                              className="font-serif font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer transition"
                            >
                              {word.word}
                            </span>
                            {word.partOfSpeech && (
                              <span className="text-[11px] italic font-serif text-slate-400">
                                {word.partOfSpeech}
                              </span>
                            )}
                            {word.primaryAcademicContext && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                {word.primaryAcademicContext}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {word.meanings[0]?.trMeaning || '—'}
                          </p>
                        </div>
                      </div>

                      {/* Right: Metrics & AI action */}
                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="text-xs font-semibold text-slate-500">Zorluk:</span>
                            <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                              {item.difficultyRating.toFixed(1)} / 10
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {item.lapses} unutma &bull; {item.incorrectCount} hata
                          </div>
                        </div>

                        {onOpenAIChat && (
                          <button
                            onClick={() => onOpenAIChat(word)}
                            className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/20 transition cursor-pointer"
                            title="AI ile Kelimeyi Pekiştir"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Impact Bar */}
                    <div className="space-y-1">
                      <div className="w-full h-2 rounded-full bg-slate-200/70 dark:bg-slate-700/60 overflow-hidden">
                        <div 
                          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`}
                          style={{ width: `${item.impactScore}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Zorluk Etki Endeksi: %{item.impactScore}</span>
                        <span>Doğruluk: %{item.accuracyRate}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* SECTION 2: ÖĞRENME İLERLEMESİ & BELLEK DAĞILIMI GRAFİĞİ */}
      {(activeChartTab === 'all' || activeChartTab === 'progress') && (
        <section className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </span>
                <h2 className="font-serif font-bold text-xl text-slate-900 dark:text-slate-100">
                  Öğrenme İlerlemesi & Bellek Dağılımı Grafikleri
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Kelimelerin kalıcılık aşamaları, CEFR seviye dağılımı ve Spaced Repetition (FSRS) kararlılık durumu.
              </p>
            </div>

            <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              %{memoryRetentionRate} Genel Kalıcılık
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Visual Donut / Status Ring Breakdown (Col 5) */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/[0.04] space-y-4">
              <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-slate-100">
                Kelime Durum Kademeleri
              </h3>

              {/* Segmented Visual Stack */}
              <div className="space-y-3">
                {/* 1. Mastered */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>Ustalaşıldı (Kalıcı Bellek)</span>
                    </span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {masteredWords} ({totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${totalWords > 0 ? (masteredWords / totalWords) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* 2. Learning */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span>Aktif Öğreniliyor</span>
                    </span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {learningWords} ({totalWords > 0 ? Math.round((learningWords / totalWords) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div 
                      className="bg-amber-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${totalWords > 0 ? (learningWords / totalWords) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* 3. In Review */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1.5 text-sky-700 dark:text-sky-400 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                      <span>Periyodik Tekrar Sırasında</span>
                    </span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {reviewWords} ({totalWords > 0 ? Math.round((reviewWords / totalWords) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div 
                      className="bg-sky-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${totalWords > 0 ? (reviewWords / totalWords) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* 4. Difficult */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span>Zor / Takılınan</span>
                    </span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {difficultWords} ({totalWords > 0 ? Math.round((difficultWords / totalWords) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div 
                      className="bg-rose-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${totalWords > 0 ? (difficultWords / totalWords) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* 5. New */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      <span>Henüz Başlanmamış Yeni</span>
                    </span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {newWords} ({totalWords > 0 ? Math.round((newWords / totalWords) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div 
                      className="bg-slate-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${totalWords > 0 ? (newWords / totalWords) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CEFR Level Breakdown & Context Distribution (Col 7) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/[0.04] space-y-3">
                <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center justify-between">
                  <span>CEFR Dil Seviyesi Dağılımı</span>
                  <span className="text-xs font-mono font-normal text-slate-400">B1 - C2</span>
                </h3>

                <div className="grid grid-cols-4 gap-2">
                  {cefrLevels.map((lvl) => (
                    <div 
                      key={lvl.level}
                      className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-white/[0.06] text-center"
                    >
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {lvl.level}
                      </span>
                      <div className="font-serif font-bold text-lg text-slate-900 dark:text-slate-100 mt-2">
                        {lvl.count}
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        %{lvl.percentage}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disciplinary context horizontal bars */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/[0.04] space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-serif font-bold text-slate-900 dark:text-slate-100">
                    Öğrenilen Alanlar & Bağlamlar
                  </span>
                  <span className="text-slate-400 font-mono">{academicContexts.length} kategori</span>
                </div>

                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {academicContexts.slice(0, 5).map(([ctx, count]) => {
                    const pct = totalWords > 0 ? Math.round((count / totalWords) * 100) : 0;
                    return (
                      <div key={ctx} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                            {ctx}
                          </span>
                          <span className="font-mono text-slate-400">
                            {count} kelime (%{pct})
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div 
                            className="bg-amber-500 h-full rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 3: HAFTALIK ÇALIŞMA SÜRESİ SÜTUN GRAFİĞİ */}
      {(activeChartTab === 'all' || activeChartTab === 'time') && (
        <section className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <Clock className="w-4 h-4" />
                </span>
                <h2 className="font-serif font-bold text-xl text-slate-900 dark:text-slate-100">
                  Haftalık Çalışma Süresi & Günlük Aktivite Grafiği
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Son 7 gün boyunca çalışılan süreler (dakika) ve günlük 20 dakika hedefine göre tamamlama performansı.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                Toplam {weeklyStudyStats.totalMinutesWeek} Dakika
              </span>
            </div>
          </div>

          {/* 7-Day Bar Chart */}
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/[0.04]">
            {/* Chart Area */}
            <div className="relative h-44 sm:h-52 w-full flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 px-1">
              
              {/* Daily Target 20m Reference Line */}
              <div 
                className="absolute inset-x-0 border-b border-dashed border-sky-400/60 dark:border-sky-400/40 z-0 pointer-events-none flex items-center justify-end"
                style={{ bottom: '48%' }}
              >
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-sky-100/90 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 -translate-y-3 mr-2 shadow-2xs">
                  20 dk Hedef Çizgisi
                </span>
              </div>

              {/* 7 Day Bars */}
              {weeklyStudyStats.daysList.map((day) => {
                const isTargetMet = day.minutes >= weeklyStudyStats.dailyTargetMinutes;
                return (
                  <div 
                    key={day.dateKey}
                    className="relative flex-1 flex flex-col items-center h-full justify-end group z-10"
                  >
                    {/* Hover Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-8 px-2 py-1 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-mono whitespace-nowrap transition-all shadow-md z-30">
                      {day.minutes} dk &bull; {day.reviewCount} kart
                    </div>

                    {/* Bar Pill */}
                    <div className="w-full max-w-[36px] sm:max-w-[48px] h-full flex items-end">
                      <div 
                        className={`w-full rounded-xl transition-all duration-500 flex flex-col justify-end p-1 ${
                          day.isToday
                            ? 'bg-gradient-to-t from-sky-600 to-amber-500 ring-2 ring-amber-400/40 ring-offset-2 ring-offset-white dark:ring-offset-slate-900'
                            : isTargetMet
                            ? 'bg-gradient-to-t from-sky-600 to-sky-400'
                            : day.minutes > 0
                            ? 'bg-sky-300 dark:bg-sky-800/80'
                            : 'bg-slate-200 dark:bg-slate-700/60'
                        }`}
                        style={{ height: `${day.heightPercentage}%` }}
                      >
                        {day.minutes > 0 && (
                          <span className="hidden sm:block text-[10px] font-mono font-bold text-center text-white truncate">
                            {day.minutes}m
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Day label */}
                    <div className="mt-2 text-center">
                      <p className={`text-xs font-semibold ${
                        day.isToday ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        {day.dayLabel}
                      </p>
                      {day.isToday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mx-auto block mt-0.5" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Micro Stats Bottom Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-3 border-t border-slate-200/60 dark:border-white/[0.06] text-xs">
              <div>
                <span className="text-slate-400">Günlük Ortalama:</span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {weeklyStudyStats.averageDailyMinutes} dakika / gün
                </p>
              </div>
              <div>
                <span className="text-slate-400">Hedefe Ulaşılan Gün:</span>
                <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {weeklyStudyStats.targetAchievedDays} / 7 Gün
                </p>
              </div>
              <div>
                <span className="text-slate-400">En Verimli Gün:</span>
                <p className="font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  {weeklyStudyStats.peakDayName}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Haftalık Tekrar Adedi:</span>
                <p className="font-mono font-bold text-sky-600 dark:text-sky-400 mt-0.5">
                  {weeklyStudyStats.totalReviewsWeek} kart tekrarlandı
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 4: REVIEW LOGS HISTORY */}
      <section className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-slate-100">
              Son Tekrar Geçmişi Günlüğü
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Spaced repetition oturumlarında kaydedilen son 10 kart incelemesi ve FSRS aralık değişimleri.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {reviewLogs.length} toplam kayıt
          </span>
        </div>

        {recentLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs italic bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
            Henüz tamamlanmış bir tekrar kaydı bulunmuyor.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 dark:border-white/[0.08] text-slate-400 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Kelime</th>
                  <th className="py-2.5 px-3">Geri Bildirim</th>
                  <th className="py-2.5 px-3">Yeni Aralık</th>
                  <th className="py-2.5 px-3">Zorluk Derecesi</th>
                  <th className="py-2.5 px-3">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] font-mono">
                {recentLogs.map((log) => {
                  const dateFormatted = new Date(log.timestamp).toLocaleString('tr-TR', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3 font-serif font-bold text-sm text-slate-900 dark:text-slate-100">
                        {log.wordText}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                          log.feedback === 'remembered'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                            : log.feedback === 'difficult'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                        }`}>
                          {log.feedback === 'remembered' ? 'Hatırlandı' : log.feedback === 'difficult' ? 'Zorlanıldı' : 'Unutuldu'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {log.newIntervalDays} gün
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {log.newDifficulty} / 10
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">
                        {dateFormatted}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
