import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { 
  Volume2, 
  ChevronUp, 
  ChevronDown, 
  Shuffle, 
  Eye, 
  EyeOff, 
  BookMarked, 
  CheckCircle2, 
  Sparkles, 
  Copy,
  Check,
  Tag,
  Lightbulb,
  GraduationCap
} from 'lucide-react';
import { Word, LanguageCode } from '../../types';

interface StickyNoteReelsProps {
  words: Word[];
  activeLanguage: LanguageCode;
  onUpdateWord?: (word: Word) => void;
  onOpenAIChat?: (word: Word) => void;
}

// Organic, designer-grade pastel sticky note palettes with rich contrast & ambiance
const STICKY_THEMES = [
  {
    name: 'Warm Chamomile',
    bg: 'bg-[#fff9e6] dark:bg-[#201a09]',
    border: 'border-[#f2e1a6] dark:border-[#524116]',
    tape: 'bg-amber-300/60 dark:bg-amber-500/30',
    glow: 'rgba(245, 158, 11, 0.15)',
    accentText: 'text-[#422e03] dark:text-[#fef3c7]',
    subText: 'text-[#6b4a08] dark:text-[#fde68a]',
    badge: 'bg-[#fae8b2] dark:bg-[#3d2e0b] text-[#5c3e03] dark:text-[#fef08a]',
    highlight: 'bg-[#faebb9] dark:bg-[#2d220a] text-[#3d2a02] dark:text-[#fef9c3]',
    quoteBorder: 'border-[#ebd288] dark:border-[#524116]',
  },
  {
    name: 'Nordic Sage',
    bg: 'bg-[#eafaf1] dark:bg-[#0c1f17]',
    border: 'border-[#b7ebd1] dark:border-[#1d4a36]',
    tape: 'bg-emerald-300/60 dark:bg-emerald-500/30',
    glow: 'rgba(16, 185, 129, 0.15)',
    accentText: 'text-[#063b25] dark:text-[#d1fae5]',
    subText: 'text-[#0d5939] dark:text-[#a7f3d0]',
    badge: 'bg-[#cbf5df] dark:bg-[#133827] text-[#063b25] dark:text-[#6ee7b7]',
    highlight: 'bg-[#c3f0d8] dark:bg-[#112e20] text-[#042d1c] dark:text-[#ecfdf5]',
    quoteBorder: 'border-[#9ce3c0] dark:border-[#1d4a36]',
  },
  {
    name: 'Sakura Blush',
    bg: 'bg-[#fff0f3] dark:bg-[#260f15]',
    border: 'border-[#fcccd5] dark:border-[#571e2c]',
    tape: 'bg-rose-300/60 dark:bg-rose-500/30',
    glow: 'rgba(244, 63, 94, 0.15)',
    accentText: 'text-[#4c0d1b] dark:text-[#ffe4e6]',
    subText: 'text-[#78192e] dark:text-[#fecdd3]',
    badge: 'bg-[#fad5dc] dark:bg-[#40121d] text-[#4c0d1b] dark:text-[#fda4af]',
    highlight: 'bg-[#f8c9d3] dark:bg-[#330f17] text-[#3b0814] dark:text-[#fff1f2]',
    quoteBorder: 'border-[#f7b0be] dark:border-[#571e2c]',
  },
  {
    name: 'Glacier Sky',
    bg: 'bg-[#eef8ff] dark:bg-[#0a1829]',
    border: 'border-[#bee3ff] dark:border-[#18395e]',
    tape: 'bg-sky-300/60 dark:bg-sky-500/30',
    glow: 'rgba(14, 165, 233, 0.15)',
    accentText: 'text-[#0c395c] dark:text-[#e0f2fe]',
    subText: 'text-[#125385] dark:text-[#bae6fd]',
    badge: 'bg-[#d0ecff] dark:bg-[#102b47] text-[#0c395c] dark:text-[#7dd3fc]',
    highlight: 'bg-[#c3e5fc] dark:bg-[#0c2238] text-[#072a45] dark:text-[#f0f9ff]',
    quoteBorder: 'border-[#a5d8fc] dark:border-[#18395e]',
  },
  {
    name: 'Misty Lavender',
    bg: 'bg-[#f7f2ff] dark:bg-[#1a0f2e]',
    border: 'border-[#dec9fc] dark:border-[#3c2069]',
    tape: 'bg-purple-300/60 dark:bg-purple-500/30',
    glow: 'rgba(168, 85, 247, 0.15)',
    accentText: 'text-[#35155d] dark:text-[#f3e8ff]',
    subText: 'text-[#4e2285] dark:text-[#e9d5ff]',
    badge: 'bg-[#ecd8ff] dark:bg-[#2d154d] text-[#35155d] dark:text-[#d8b4fe]',
    highlight: 'bg-[#e5caff] dark:bg-[#230f3d] text-[#280c4a] dark:text-[#faf5ff]',
    quoteBorder: 'border-[#d2b1fa] dark:border-[#3c2069]',
  },
  {
    name: 'Tuscan Apricot',
    bg: 'bg-[#fff4ed] dark:bg-[#291408]',
    border: 'border-[#ffd4ba] dark:border-[#5c2a0d]',
    tape: 'bg-orange-300/60 dark:bg-orange-500/30',
    glow: 'rgba(249, 115, 22, 0.15)',
    accentText: 'text-[#4f2005] dark:text-[#ffedd5]',
    subText: 'text-[#7d360f] dark:text-[#fed7aa]',
    badge: 'bg-[#fedfc9] dark:bg-[#421b08] text-[#4f2005] dark:text-[#fdba74]',
    highlight: 'bg-[#ffd3b5] dark:bg-[#331405] text-[#3d1602] dark:text-[#fff7ed]',
    quoteBorder: 'border-[#fcc097] dark:border-[#5c2a0d]',
  },
];

export const StickyNoteReels: React.FC<StickyNoteReelsProps> = ({
  words,
  activeLanguage,
  onUpdateWord,
  onOpenAIChat,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [hideMeaning, setHideMeaning] = useState(false);
  const [isPronouncing, setIsPronouncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [markedLearned, setMarkedLearned] = useState<Record<string, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const wheelLock = useRef(false);

  // Filter words by active language
  const filteredWords = words.filter(w => w.language === activeLanguage);

  // Keep index within bounds when language changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeLanguage]);

  const currentWord = filteredWords[currentIndex] || filteredWords[0];
  const theme = STICKY_THEMES[currentIndex % STICKY_THEMES.length];

  // Natural subtle rotation for sticky note realism (-1.4deg to +1.4deg)
  const rotationDegrees = ((currentIndex % 5) - 2) * 0.7;

  // Next / Previous navigation with direction animation
  const goToNext = () => {
    if (filteredWords.length === 0) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % filteredWords.length);
  };

  const goToPrev = () => {
    if (filteredWords.length === 0) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + filteredWords.length) % filteredWords.length);
  };

  const shuffleWord = () => {
    if (filteredWords.length <= 1) return;
    let nextIdx = Math.floor(Math.random() * filteredWords.length);
    if (nextIdx === currentIndex) {
      nextIdx = (nextIdx + 1) % filteredWords.length;
    }
    setDirection(1);
    setCurrentIndex(nextIdx);
  };

  // Keyboard navigation for reels (ArrowDown, ArrowUp, Space, Enter, H, P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement).tagName.toLowerCase())) {
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'j') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'k') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === ' ' || e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setHideMeaning((prev) => !prev);
      } else if (e.key === 'p' || e.key === 'P') {
        playPronunciation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredWords.length, currentIndex]);

  // Mouse wheel scroll reels trigger
  const handleWheel = (e: React.WheelEvent) => {
    if (wheelLock.current) return;
    if (Math.abs(e.deltaY) > 35) {
      wheelLock.current = true;
      if (e.deltaY > 0) {
        goToNext();
      } else {
        goToPrev();
      }
      setTimeout(() => {
        wheelLock.current = false;
      }, 420);
    }
  };

  // Web Speech API for authentic pronunciation
  const playPronunciation = () => {
    if (!currentWord || isPronouncing) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentWord.word);
      utterance.lang = activeLanguage === 'de' ? 'de-DE' : 'en-US';
      utterance.rate = 0.88;
      setIsPronouncing(true);
      utterance.onend = () => setIsPronouncing(false);
      utterance.onerror = () => setIsPronouncing(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Copy word to clipboard
  const copyToClipboard = () => {
    if (!currentWord) return;
    const textToCopy = `${currentWord.word} — ${currentWord.meanings[0]?.trMeaning || ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleLearned = () => {
    if (!currentWord) return;
    setMarkedLearned(prev => ({
      ...prev,
      [currentWord.id]: !prev[currentWord.id],
    }));
  };

  if (!currentWord || filteredWords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] text-center px-4">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 shadow-inner">
          <BookMarked className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mb-2">
          {activeLanguage === 'en' ? 'İngilizce' : 'Almanca'} kelime listeniz boş
        </h3>
        <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
          Üst barda yer alan &quot;+ Ekle&quot; düğmesine basarak sözlüğünüze ilk kelimenizi ekleyebilir ya da diğer dile geçebilirsiniz.
        </p>
      </div>
    );
  }

  // Animation variants for buttery-smooth spring sliding reels
  const variants = {
    enter: (dir: number) => ({
      y: dir > 0 ? 110 : -110,
      opacity: 0,
      scale: 0.92,
      rotateX: dir > 0 ? 12 : -12,
    }),
    center: {
      y: 0,
      opacity: 1,
      scale: 1,
      rotateX: 0,
      transition: {
        y: { type: 'spring' as const, stiffness: 350, damping: 30 },
        opacity: { duration: 0.25 },
        scale: { duration: 0.25 },
        rotateX: { duration: 0.25 },
      },
    },
    exit: (dir: number) => ({
      y: dir > 0 ? -110 : 110,
      opacity: 0,
      scale: 0.92,
      rotateX: dir > 0 ? -12 : 12,
      transition: {
        y: { type: 'spring' as const, stiffness: 350, damping: 30 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 },
        rotateX: { duration: 0.2 },
      },
    }),
  };

  const primaryMeaning = currentWord.meanings[0];
  const primaryExample = currentWord.examples[0];
  const isLearned = !!markedLearned[currentWord.id];

  return (
    <div 
      ref={containerRef}
      onWheel={handleWheel}
      className="relative w-full max-w-5xl mx-auto min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center py-6 sm:py-10 px-4 select-none perspective-[1000px]"
    >
      {/* Subtle ambient colored aura behind the current sticky note */}
      <div 
        className="absolute w-[360px] sm:w-[520px] h-[360px] sm:h-[520px] rounded-full blur-3xl opacity-40 pointer-events-none transition-all duration-700 -z-10"
        style={{ backgroundColor: theme.glow }}
      />

      {/* Top Floating Helper Ribbon */}
      <div className="flex items-center gap-3 sm:gap-4 mb-5 text-[11px] sm:text-xs font-mono font-medium text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl px-4 py-1.5 rounded-full border border-slate-200/60 dark:border-white/[0.06] shadow-xs">
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300">↑ / ↓</kbd>
          <span className="hidden sm:inline">Kaydır</span>
        </span>
        <span className="opacity-30">•</span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300">Space / H</kbd>
          <span>Gizle / Göster</span>
        </span>
        <span className="opacity-30">•</span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300">P</kbd>
          <span>Dinle</span>
        </span>
      </div>

      {/* Main Reels Display Area with 3D Sticky Note */}
      <div className="relative w-full max-w-lg flex items-center justify-center">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`${currentWord.id}-${currentIndex}`}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.25}
            onDragEnd={(_, info) => {
              if (info.offset.y < -50 || info.velocity.y < -300) {
                goToNext();
              } else if (info.offset.y > 50 || info.velocity.y > 300) {
                goToPrev();
              }
            }}
            style={{ rotate: `${rotationDegrees}deg` }}
            className={`w-full rounded-[28px] sm:rounded-[36px] p-6 sm:p-9 border shadow-sticky relative transition-colors duration-300 cursor-grab active:cursor-grabbing ${theme.bg} ${theme.border}`}
          >
            {/* Ultra-realistic semi-transparent washi tape with angled texture */}
            <div 
              className={`washi-tape absolute -top-3.5 left-1/2 -translate-x-1/2 w-32 sm:w-36 h-8 rounded-xs shadow-xs backdrop-blur-xs border border-white/20 -rotate-1 ${theme.tape}`} 
            />

            {/* Top Header of the Sticky Note */}
            <div className="flex items-center justify-between gap-3 mb-6 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-[11px] font-mono font-black tracking-widest uppercase shadow-2xs ${theme.badge}`}>
                  {currentWord.language.toUpperCase()}
                </span>

                {currentWord.cefrLevel && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-sans font-black tracking-wider bg-black/10 dark:bg-white/10 shadow-2xs">
                    {currentWord.cefrLevel}
                  </span>
                )}
                
                {currentWord.partOfSpeech && (
                  <span className="text-xs italic font-serif opacity-75">
                    {currentWord.partOfSpeech}
                  </span>
                )}

                {currentWord.primaryAcademicContext && (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-black/5 dark:bg-white/10 opacity-90 font-mono font-medium flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>{currentWord.primaryAcademicContext}</span>
                  </span>
                )}
              </div>

              {/* Progress counter pill */}
              <div className="flex items-center gap-1 text-xs font-mono font-bold opacity-60 bg-black/5 dark:bg-white/5 px-2.5 py-0.5 rounded-full">
                <span>{currentIndex + 1}</span>
                <span className="opacity-40">/</span>
                <span>{filteredWords.length}</span>
              </div>
            </div>

            {/* Word Display & Interactive Audio Wave */}
            <div className="mb-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className={`font-serif font-bold text-3xl sm:text-4xl md:text-[2.5rem] tracking-tight leading-[1.15] break-words ${theme.accentText}`}>
                    {currentWord.word}
                  </h2>
                </div>

                {/* Animated Audio Button */}
                <button
                  id="reels-listen-btn"
                  onClick={playPronunciation}
                  disabled={isPronouncing}
                  className={`shrink-0 p-3.5 rounded-2xl transition-all duration-200 active:scale-90 shadow-md ${
                    isPronouncing 
                      ? 'scale-110 bg-amber-500 text-white shadow-amber-500/30' 
                      : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20'
                  }`}
                  title="Sesli Dinle (P tuşu)"
                >
                  {isPronouncing ? (
                    <div className="flex items-center gap-0.5 h-5 px-0.5">
                      <div className="w-1 bg-white rounded-full animate-wave-1" />
                      <div className="w-1 bg-white rounded-full animate-wave-2" />
                      <div className="w-1 bg-white rounded-full animate-wave-3" />
                      <div className="w-1 bg-white rounded-full animate-wave-4" />
                    </div>
                  ) : (
                    <Volume2 className="w-5 h-5 opacity-80" />
                  )}
                </button>
              </div>
            </div>

            {/* Meanings & Flashcard Recall Area */}
            <div className="space-y-3 mb-6">
              {hideMeaning ? (
                <button
                  onClick={() => setHideMeaning(false)}
                  className="w-full py-7 rounded-2xl border-2 border-dashed border-black/20 dark:border-white/20 flex flex-col items-center justify-center gap-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition-all group"
                >
                  <Eye className="w-6 h-6 opacity-60 group-hover:scale-110 transition-transform text-amber-600 dark:text-amber-400" />
                  <div className="text-center">
                    <p className="text-xs font-bold opacity-80 font-sans">
                      Türkçe Anlamı Görmek İçin Dokun
                    </p>
                    <p className="text-[10px] opacity-50 font-mono mt-0.5">
                      (veya Space tuşuna bas)
                    </p>
                  </div>
                </button>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2.5"
                >
                  {/* Primary Meaning Highlight Block */}
                  <div className={`p-4 sm:p-5 rounded-2xl ${theme.highlight} shadow-xs transition-colors`}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">
                        Türkçe Anlamı
                      </p>
                      <button 
                        onClick={() => setHideMeaning(true)}
                        className="text-[10px] font-mono opacity-50 hover:opacity-100 transition hover:underline"
                        title="Gizle (Quiz Modu)"
                      >
                        Gizle
                      </button>
                    </div>

                    <p className="text-xl sm:text-2xl font-serif font-bold leading-tight">
                      {primaryMeaning?.trMeaning || 'Anlam belirtilmedi'}
                    </p>
                    
                    {primaryMeaning?.secondaryTrMeanings && primaryMeaning.secondaryTrMeanings.length > 0 && (
                      <p className="text-xs opacity-75 mt-1.5 font-medium font-sans">
                        Diğer: {primaryMeaning.secondaryTrMeanings.join(', ')}
                      </p>
                    )}

                    {primaryMeaning?.definitionEn && (
                      <p className="text-xs italic opacity-85 mt-2.5 pt-2.5 border-t border-black/10 dark:border-white/10 font-serif">
                        &ldquo;{primaryMeaning.definitionEn}&rdquo;
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Academic Example Sentence */}
            {primaryExample && !hideMeaning && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-4 rounded-2xl bg-black/5 dark:bg-white/5 border ${theme.quoteBorder} mb-4 relative overflow-hidden`}
              >
                <div className="text-2xl font-serif leading-none opacity-20 absolute top-2 left-3 select-none">
                  &ldquo;
                </div>
                <p className="text-xs sm:text-sm italic font-serif leading-relaxed opacity-95 pl-3">
                  {primaryExample.sentence}
                </p>
                {primaryExample.trTranslation && (
                  <p className="text-xs mt-2 opacity-75 font-sans leading-normal pl-3">
                    {primaryExample.trTranslation}
                  </p>
                )}
                {primaryExample.sourceContext && (
                  <div className="mt-2.5 pl-3 flex items-center gap-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 opacity-70">
                      Kaynak: {primaryExample.sourceContext}
                    </span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Personal Note */}
            {currentWord.personalNote && !hideMeaning && (
              <div className="text-xs opacity-80 flex items-start gap-2 px-1 mb-3">
                <Lightbulb className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <span className="italic">{currentWord.personalNote}</span>
              </div>
            )}

            {/* Synonyms Tag Cloud */}
            {currentWord.synonyms && currentWord.synonyms.length > 0 && !hideMeaning && (
              <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-black/10 dark:border-white/10">
                <span className="text-[10px] font-mono font-bold uppercase opacity-60 mr-1">Eş Anlamlılar:</span>
                {currentWord.synonyms.slice(0, 4).map((syn, idx) => (
                  <span 
                    key={idx}
                    className="text-[11px] px-2.5 py-0.5 rounded-lg bg-black/5 dark:bg-white/10 font-medium tracking-tight"
                  >
                    {syn}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Floating Side Action Dock (Ultra Modern Glassmorphic) */}
        <div className="absolute -right-3.5 sm:-right-18 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2.5 z-20">
          <button
            id="reels-up-btn"
            onClick={goToPrev}
            className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white shadow-lg border border-slate-200/80 dark:border-white/10 transition-all duration-200 active:scale-90 hover:scale-105"
            title="Önceki Not (Yukarı Ok)"
          >
            <ChevronUp className="w-5 h-5" />
          </button>

          <button
            id="reels-eye-btn"
            onClick={() => setHideMeaning(prev => !prev)}
            className={`p-3.5 rounded-2xl shadow-lg border transition-all duration-200 active:scale-90 hover:scale-105 ${
              hideMeaning 
                ? 'bg-amber-500 text-white border-amber-600 shadow-amber-500/30' 
                : 'bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/10'
            }`}
            title={hideMeaning ? 'Anlamı Göster (Space)' : 'Anlamı Gizle (Quiz Modu)'}
          >
            {hideMeaning ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>

          {onOpenAIChat && currentWord && (
            <button
              id="reels-ai-btn"
              onClick={() => onOpenAIChat(currentWord)}
              className="p-3.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 shadow-lg border border-amber-500/30 transition-all duration-200 active:scale-90 hover:scale-105"
              title="AI ile Kelimeyi Derinlemesine İncele & Cümle Kur"
            >
              <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </button>
          )}

          <button
            id="reels-shuffle-btn"
            onClick={shuffleWord}
            className="group p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white shadow-lg border border-slate-200/80 dark:border-white/10 transition-all duration-200 active:scale-90 hover:scale-105"
            title="Rastgele Kelime Getir"
          >
            <Shuffle className="w-5 h-5 transition-transform duration-500 group-hover:rotate-180" />
          </button>

          <button
            id="reels-copy-btn"
            onClick={copyToClipboard}
            className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white shadow-lg border border-slate-200/80 dark:border-white/10 transition-all duration-200 active:scale-90 hover:scale-105"
            title="Kelimeyi ve Anlamını Kopyala"
          >
            {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
          </button>

          <button
            id="reels-learned-btn"
            onClick={toggleLearned}
            className={`p-3.5 rounded-2xl shadow-lg border transition-all duration-200 active:scale-90 hover:scale-105 ${
              isLearned
                ? 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/30'
                : 'bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/10'
            }`}
            title={isLearned ? 'Öğrenildi' : 'Öğrendim olarak işaretle'}
          >
            <CheckCircle2 className="w-5 h-5" />
          </button>

          <button
            id="reels-down-btn"
            onClick={goToNext}
            className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white shadow-lg border border-slate-200/80 dark:border-white/10 transition-all duration-200 active:scale-90 hover:scale-105"
            title="Sonraki Not (Aşağı Ok)"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Progress Bar & Navigation Indicator */}
      <div className="w-full max-w-lg mt-8 flex flex-col items-center gap-3">
        {/* Dynamic Progress Bar */}
        <div className="w-full bg-slate-200/80 dark:bg-white/[0.08] h-2 rounded-full overflow-hidden p-0.5 backdrop-blur-xs">
          <motion.div 
            className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 rounded-full"
            animate={{ width: `${((currentIndex + 1) / filteredWords.length) * 100}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>

        <div className="flex items-center justify-between w-full text-xs text-slate-500 dark:text-slate-400 font-mono font-medium px-1">
          <span>{currentIndex + 1} / {filteredWords.length} not incelendi</span>
          
          <button 
            onClick={goToNext}
            className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition"
          >
            <span>Sonraki Not</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
