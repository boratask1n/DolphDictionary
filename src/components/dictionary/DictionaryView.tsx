import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  X, 
  Volume2, 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  Command, 
  List as ListIcon, 
  LayoutGrid, 
  ArrowUpDown, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { Word, LanguageCode, CEFRLevel, LearningStatus } from '../../types';
import { speakWord } from '../../services/pronunciation';
import { getAllCategories } from '../../services/categories';

interface DictionaryViewProps {
  words: Word[];
  activeLanguage: LanguageCode;
  onOpenAddModal: (initialWordText?: string) => void;
  onDeleteWord: (id: string) => void;
  onUpdateWord?: (word: Word) => void;
  initialContextFilter?: string | null;
  onOpenAIChat?: (word: Word) => void;
}

// Gentle text highlight helper
const HighlightText: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  if (!query || !query.trim() || !text) return <>{text}</>;
  const q = query.trim();
  const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark 
            key={i} 
            className="bg-amber-300/40 dark:bg-amber-400/25 text-amber-950 dark:text-amber-100 px-0.5 rounded-sm font-semibold not-italic"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

// Turkish & German character normalization helper
const normalizeSearchText = (str: string): string => {
  return (str || '')
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/ä/g, 'a')
    .replace(/ß/g, 'ss');
};

export const DictionaryView: React.FC<DictionaryViewProps> = ({
  words,
  activeLanguage,
  onOpenAddModal,
  onDeleteWord,
  onUpdateWord,
  initialContextFilter = null,
  onOpenAIChat,
}) => {
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [selectedContext, setSelectedContext] = useState<string | null>(initialContextFilter);
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<LearningStatus | 'all'>('all');
  
  // UI Display States
  const [viewMode, setViewMode] = useState<'cards' | 'compact'>('cards');
  const [sortBy, setSortBy] = useState<'alpha-asc' | 'alpha-desc' | 'date-newest' | 'difficulty-asc' | 'difficulty-desc'>('alpha-asc');
  const [expandedWordId, setExpandedWordId] = useState<string | null>(null);
  const [speakingWordId, setSpeakingWordId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Keyboard shortcut: Cmd/Ctrl+K or '/' focuses the search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (
        e.key === '/' && 
        document.activeElement?.tagName !== 'INPUT' && 
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === 'Escape') {
        if (searchQuery) setSearchQuery('');
        else if (selectedLetter) setSelectedLetter(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery, selectedLetter]);

  useEffect(() => {
    if (initialContextFilter !== undefined) {
      setSelectedContext(initialContextFilter);
    }
  }, [initialContextFilter]);

  // Words for current language
  const languageWords = useMemo(() => {
    return words.filter(w => w.language === activeLanguage);
  }, [words, activeLanguage]);

  // Learning stats summary
  const stats = useMemo(() => {
    const total = languageWords.length;
    const mastered = languageWords.filter(w => w.learningStatus === 'mastered').length;
    const learning = languageWords.filter(w => w.learningStatus === 'learning' || w.learningStatus === 'review').length;
    const isNew = languageWords.filter(w => w.learningStatus === 'new' || !w.learningStatus).length;
    return { total, mastered, learning, isNew };
  }, [languageWords]);

  // Available contexts / domains (including user-created custom categories)
  const availableContexts = useMemo(() => {
    return getAllCategories(languageWords).sort();
  }, [languageWords]);

  // Distinct initial letters available
  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    languageWords.forEach(w => {
      if (w.word && w.word.length > 0) {
        letters.add(w.word.charAt(0).toUpperCase());
      }
    });
    return letters;
  }, [languageWords]);

  // Full alphabet for active language
  const alphabet = useMemo(() => {
    return activeLanguage === 'de'
      ? ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','Ä','Ö','Ü']
      : ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
  }, [activeLanguage]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedLevel !== 'all') count++;
    if (selectedContext) count++;
    if (selectedStatus !== 'all') count++;
    if (selectedLetter) count++;
    return count;
  }, [selectedLevel, selectedContext, selectedStatus, selectedLetter]);

  // Filter & Sort Logic
  const filteredWords = useMemo(() => {
    let result = [...languageWords];

    // Search query filter
    if (searchQuery.trim()) {
      const rawQ = searchQuery.toLowerCase().trim();
      const normQ = normalizeSearchText(searchQuery);

      result = result.filter(w => {
        const wordRaw = w.word.toLowerCase();
        const wordNorm = normalizeSearchText(w.word);
        const matchesWord = wordRaw.includes(rawQ) || wordNorm.includes(normQ);

        const matchesMeaning = w.meanings.some(m => {
          const trRaw = m.trMeaning.toLowerCase();
          const trNorm = normalizeSearchText(m.trMeaning);
          const secMatch = m.secondaryTrMeanings.some(s => 
            s.toLowerCase().includes(rawQ) || normalizeSearchText(s).includes(normQ)
          );
          const defMatch = m.definitionEn ? m.definitionEn.toLowerCase().includes(rawQ) : false;
          return trRaw.includes(rawQ) || trNorm.includes(normQ) || secMatch || defMatch;
        });

        const matchesExamples = w.examples?.some(e => {
          const sentMatch = e.sentence.toLowerCase().includes(rawQ);
          const trSentMatch = e.trTranslation ? (
            e.trTranslation.toLowerCase().includes(rawQ) || normalizeSearchText(e.trTranslation).includes(normQ)
          ) : false;
          return sentMatch || trSentMatch;
        });

        const matchesTags = w.tags?.some(t => 
          t.toLowerCase().includes(rawQ) || normalizeSearchText(t).includes(normQ)
        );

        const matchesContext = (w.primaryAcademicContext && (
          w.primaryAcademicContext.toLowerCase().includes(rawQ) || 
          normalizeSearchText(w.primaryAcademicContext).includes(normQ)
        )) || (w.domainCategory && (
          w.domainCategory.toLowerCase().includes(rawQ) || 
          normalizeSearchText(w.domainCategory).includes(normQ)
        ));

        const matchesNote = w.personalNote ? (
          w.personalNote.toLowerCase().includes(rawQ) || normalizeSearchText(w.personalNote).includes(normQ)
        ) : false;

        return matchesWord || matchesMeaning || matchesExamples || matchesTags || matchesContext || matchesNote;
      });
    }

    // Letter Filter
    if (selectedLetter) {
      result = result.filter(w => w.word.toUpperCase().startsWith(selectedLetter));
    }

    // Level Filter
    if (selectedLevel !== 'all') {
      result = result.filter(w => w.cefrLevel === selectedLevel);
    }

    // Context / Domain Filter
    if (selectedContext) {
      result = result.filter(w => 
        w.primaryAcademicContext === selectedContext || w.domainCategory === selectedContext
      );
    }

    // Status Filter
    if (selectedStatus !== 'all') {
      result = result.filter(w => (w.learningStatus || 'new') === selectedStatus);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'alpha-asc') {
        return a.word.localeCompare(b.word, activeLanguage === 'de' ? 'de-DE' : 'en-US', { sensitivity: 'base' });
      }
      if (sortBy === 'alpha-desc') {
        return b.word.localeCompare(a.word, activeLanguage === 'de' ? 'de-DE' : 'en-US', { sensitivity: 'base' });
      }
      if (sortBy === 'date-newest') {
        return new Date(b.dateAdded || 0).getTime() - new Date(a.dateAdded || 0).getTime();
      }
      if (sortBy === 'difficulty-asc') {
        return (a.difficultyRating || 3) - (b.difficultyRating || 3);
      }
      if (sortBy === 'difficulty-desc') {
        return (b.difficultyRating || 3) - (a.difficultyRating || 3);
      }
      return 0;
    });

    return result;
  }, [languageWords, searchQuery, selectedLetter, selectedLevel, selectedContext, selectedStatus, sortBy, activeLanguage]);

  // Audio Pronunciation
  const handlePlayAudio = (word: Word, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSpeakingWordId(word.id);
    speakWord(word.word, activeLanguage, undefined, () => setSpeakingWordId(null));
  };

  // Copy Word & Meaning
  const handleCopyWord = (word: Word, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const meaning = word.meanings[0]?.trMeaning || '';
    const example = word.examples[0]?.sentence ? `\n"${word.examples[0].sentence}"` : '';
    const textToCopy = `${word.word} - ${meaning}${example}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(word.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Cycle Learning Status (Instant productivity for learner)
  const handleCycleStatus = (word: Word, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!onUpdateWord) return;

    const current = word.learningStatus || 'new';
    let next: LearningStatus = 'learning';
    if (current === 'new') next = 'learning';
    else if (current === 'learning') next = 'mastered';
    else if (current === 'mastered') next = 'review';
    else next = 'learning';

    const updated: Word = {
      ...word,
      learningStatus: next,
    };
    onUpdateWord(updated);
  };

  // Clear all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedLetter(null);
    setSelectedLevel('all');
    setSelectedContext(null);
    setSelectedStatus('all');
  };

  const getStatusBadge = (status?: LearningStatus) => {
    switch (status) {
      case 'mastered':
        return { 
          label: 'Ustalaşıldı', 
          bg: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40' 
        };
      case 'learning':
        return { 
          label: 'Öğreniliyor', 
          bg: 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/40' 
        };
      case 'review':
        return { 
          label: 'Tekrar', 
          bg: 'bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800/40' 
        };
      default:
        return { 
          label: 'Yeni', 
          bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 border-slate-200 dark:border-slate-700/50' 
        };
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-5">
      
      {/* 1. TOP HEADER & METRICS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-serif font-black text-2xl sm:text-3xl text-slate-900 dark:text-slate-100 tracking-tight">
              Sözlük
            </h1>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs font-mono font-bold tracking-wide uppercase px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-800 dark:text-amber-300">
              {activeLanguage === 'en' ? 'İngilizce' : 'Almanca'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Toplam <strong>{stats.total}</strong> kelime</span>
            <span>·</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">{stats.mastered} ustalaşıldı</span>
            <span>·</span>
            <span className="text-amber-700 dark:text-amber-400 font-medium">{stats.learning} öğreniliyor</span>
          </div>
        </div>

        {/* View Switcher & Add Word */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* View Mode Switcher */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/[0.08]">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                viewMode === 'cards' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Geniş Kart Görünümü"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Kartlar</span>
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                viewMode === 'compact' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Kompakt Liste Görünümü"
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Liste</span>
            </button>
          </div>

          {/* Add Word Button */}
          <button
            onClick={() => onOpenAddModal(searchQuery.trim() || undefined)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-950 text-xs sm:text-sm font-semibold transition active:scale-95 cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Yeni Kelime</span>
          </button>
        </div>
      </div>

      {/* 2. CALM & POWERFUL SEARCH BAR */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-600 dark:group-focus-within:text-amber-400 transition-colors">
          <Search className="w-4 h-4" />
        </div>

        <input
          ref={searchInputRef}
          id="dictionary-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            activeLanguage === 'en'
              ? "Kelime, Türkçe anlam veya örnek cümle ara... (örn: resilient, dayanıklı)"
              : "Wort, Bedeutung oder Beispielsatz suchen... (örn: Sehnsucht, hasret)"
          }
          className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-white/[0.08] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 dark:focus:ring-amber-400/30 transition shadow-2xs font-sans"
        />

        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1.5">
          {searchQuery ? (
            <button
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
              title="Aramayı Temizle (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd 
              onClick={() => searchInputRef.current?.focus()}
              className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-white/10 cursor-pointer select-none"
              title="Hızlı Odaklan (/ veya ⌘K)"
            >
              <Command className="w-2.5 h-2.5" />
              <span>K</span>
            </kbd>
          )}
        </div>
      </div>

      {/* 3. STREAMLINED, EYE-FRIENDLY FILTER STRIP */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Left Filter Pills: CEFR & Status */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
          {/* Level Filter Pills */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-white/[0.06]">
            <button
              onClick={() => setSelectedLevel('all')}
              className={`px-2 py-1 rounded-md font-semibold transition cursor-pointer ${
                selectedLevel === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Tüm Seviyeler
            </button>
            {(['B1', 'B2', 'C1', 'C2'] as CEFRLevel[]).map(lvl => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(selectedLevel === lvl ? 'all' : lvl)}
                className={`px-2 py-1 rounded-md font-mono font-bold transition cursor-pointer ${
                  selectedLevel === lvl
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-white/[0.06]">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-2 py-1 rounded-md font-semibold transition cursor-pointer ${
                selectedStatus === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Tüm Durumlar
            </button>
            <button
              onClick={() => setSelectedStatus(selectedStatus === 'learning' ? 'all' : 'learning')}
              className={`px-2 py-1 rounded-md font-semibold transition cursor-pointer ${
                selectedStatus === 'learning'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Öğreniliyor
            </button>
            <button
              onClick={() => setSelectedStatus(selectedStatus === 'mastered' ? 'all' : 'mastered')}
              className={`px-2 py-1 rounded-md font-semibold transition cursor-pointer ${
                selectedStatus === 'mastered'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Ustalaşıldı
            </button>
          </div>

          {/* Topic / Academic Context dropdown if available */}
          {availableContexts.length > 0 && (
            <div className="relative">
              <select
                value={selectedContext || ''}
                onChange={(e) => setSelectedContext(e.target.value || null)}
                className="appearance-none bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-white/[0.06] rounded-lg pl-2.5 pr-7 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-hidden"
              >
                <option value="">Tüm Konular</option>
                {availableContexts.map(ctx => (
                  <option key={ctx} value={ctx}>{ctx}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {/* Reset Filters Quick Button */}
          {activeFilterCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 font-semibold transition cursor-pointer"
              title="Filtreleri Temizle"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Sıfırla</span>
            </button>
          )}
        </div>

        {/* Right Sort Selector */}
        <div className="relative shrink-0 ml-auto">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="appearance-none bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-lg pl-2.5 pr-7 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-amber-500/40"
          >
            <option value="alpha-asc">A → Z</option>
            <option value="alpha-desc">Z → A</option>
            <option value="date-newest">En Yeni</option>
            <option value="difficulty-asc">Kolaydan Zora</option>
            <option value="difficulty-desc">Zordan Kolaya</option>
          </select>
          <ArrowUpDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* 4. CLEAN, COMPACT ALPHABET JUMP BAR */}
      <div className="flex items-center gap-1 overflow-x-auto py-1.5 scrollbar-none text-xs select-none border-b border-slate-200/50 dark:border-white/[0.04]">
        <button
          onClick={() => setSelectedLetter(null)}
          className={`px-2 py-0.5 rounded-md font-mono font-bold transition cursor-pointer shrink-0 ${
            selectedLetter === null
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
              : 'text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          TÜMÜ
        </button>

        {alphabet.map(letter => {
          const hasWords = availableLetters.has(letter);
          const isSelected = selectedLetter === letter;

          return (
            <button
              key={letter}
              onClick={() => hasWords && setSelectedLetter(isSelected ? null : letter)}
              disabled={!hasWords}
              className={`w-6 h-6 rounded-md flex items-center justify-center font-mono font-semibold transition shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-amber-500 text-white font-bold shadow-2xs'
                  : hasWords
                  ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  : 'text-slate-300 dark:text-slate-700 cursor-default opacity-30'
              }`}
              title={hasWords ? `${letter} ile başlayan kelimeler` : 'Kayıtlı kelime yok'}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* Filter Status Summary */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-0.5">
        <span>
          {filteredWords.length} kelime listeleniyor
          {searchQuery && ` · "${searchQuery}"`}
          {selectedLetter && ` · Harf: ${selectedLetter}`}
          {selectedLevel !== 'all' && ` · Seviye: ${selectedLevel}`}
          {selectedContext && ` · ${selectedContext}`}
        </span>
      </div>

      {/* 5. WORD LISTINGS */}
      {filteredWords.length > 0 ? (
        <>
          {/* A. CARDS VIEW (Clean, Editorial, High Comfort) */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredWords.map((word) => {
                const meaning = word.meanings[0]?.trMeaning || '—';
                const statusBadge = getStatusBadge(word.learningStatus);
                const isSpeaking = speakingWordId === word.id;
                const isExpanded = expandedWordId === word.id;

                return (
                  <div
                    key={word.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-white/[0.07] shadow-2xs hover:shadow-xs transition flex flex-col justify-between space-y-3.5 group"
                  >
                    <div>
                      {/* Top Header: Word, Part of speech, Audio, Level */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <h3 className="font-serif font-bold text-xl text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                              <HighlightText text={word.word} query={searchQuery} />
                            </h3>
                            {word.partOfSpeech && (
                              <span className="text-xs italic font-serif text-slate-400">
                                {word.partOfSpeech}
                              </span>
                            )}
                          </div>
                          
                          {/* Context / Domain Category pill */}
                          {word.primaryAcademicContext && (
                            <span className="inline-block text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                              {word.primaryAcademicContext}
                            </span>
                          )}
                        </div>

                        {/* Top Right Badges: AI Coach, Pronunciation & CEFR */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {onOpenAIChat && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenAIChat(word);
                              }}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-amber-900 dark:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 transition cursor-pointer"
                              title="AI ile Kelimeyi İncele & Cümle Kur"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              <span className="text-[11px]">AI Analiz</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => handlePlayAudio(word, e)}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              isSpeaking
                                ? 'bg-amber-500 text-white scale-105'
                                : 'text-slate-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                            title="Telaffuzu Dinle"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>

                          {word.cefrLevel && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-white/[0.05]">
                              {word.cefrLevel}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Primary Translation (Eye-Comfortable Typography) */}
                      <div className="mt-1">
                        <p className="font-serif font-bold text-base text-amber-950 dark:text-amber-200">
                          <HighlightText text={meaning} query={searchQuery} />
                        </p>
                        {word.meanings[0]?.secondaryTrMeanings && word.meanings[0].secondaryTrMeanings.length > 0 && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {word.meanings[0].secondaryTrMeanings.join(', ')}
                          </p>
                        )}
                      </div>

                      {/* Example Sentence (Calm Indented Block) */}
                      {word.examples[0] && (
                        <div className="mt-3 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-white/[0.04] text-xs">
                          <p className="font-serif italic text-slate-800 dark:text-slate-200 leading-relaxed">
                            &ldquo;<HighlightText text={word.examples[0].sentence} query={searchQuery} />&rdquo;
                          </p>
                          {word.examples[0].trTranslation && (
                            <p className="font-sans text-slate-500 dark:text-slate-400 mt-1">
                              <HighlightText text={word.examples[0].trTranslation} query={searchQuery} />
                            </p>
                          )}
                        </div>
                      )}

                      {/* Additional meanings if expanded */}
                      {isExpanded && word.meanings.length > 1 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/[0.04] space-y-1.5 text-xs">
                          <p className="font-semibold text-slate-600 dark:text-slate-300">Ek Anlamlar:</p>
                          {word.meanings.slice(1).map((m, idx) => (
                            <div key={idx} className="text-slate-600 dark:text-slate-400">
                              • <HighlightText text={m.trMeaning} query={searchQuery} />
                              {m.definitionEn && <span className="italic opacity-80"> — {m.definitionEn}</span>}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Personal Note */}
                      {word.personalNote && (
                        <p className="text-xs text-amber-900/80 dark:text-amber-300/80 italic mt-2">
                          Not: {word.personalNote}
                        </p>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-3 border-t border-slate-100 dark:border-white/[0.05] flex items-center justify-between text-xs">
                      {/* One-click Interactive Status Badge */}
                      <button
                        type="button"
                        onClick={(e) => handleCycleStatus(word, e)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition cursor-pointer select-none ${statusBadge.bg}`}
                        title="Tıkla: Öğrenme durumunu değiştir"
                      >
                        {statusBadge.label}
                      </button>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 text-slate-400">
                        {onOpenAIChat && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenAIChat(word);
                            }}
                            className="p-1 hover:text-amber-600 dark:hover:text-amber-400 transition cursor-pointer"
                            title="AI ile Kelimeyi İncele & Sohbet Et"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          </button>
                        )}

                        {word.meanings.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setExpandedWordId(isExpanded ? null : word.id)}
                            className="p-1 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                            title={isExpanded ? "Daralt" : "Diğer Anlamları Göster"}
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => handleCopyWord(word, e)}
                          className="hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer p-1"
                          title="Kopyala"
                        >
                          {copiedId === word.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        {confirmDeleteId === word.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                onDeleteWord(word.id);
                                setConfirmDeleteId(null);
                              }}
                              className="text-rose-600 font-bold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-[11px]"
                            >
                              Sil
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-slate-400 hover:text-slate-600 px-1 text-[11px]"
                            >
                              İptal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(word.id)}
                            className="hover:text-rose-500 transition cursor-pointer p-1"
                            title="Kelimeyi Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* B. COMPACT LIST VIEW (High-Density Scanning) */}
          {viewMode === 'compact' && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] divide-y divide-slate-100 dark:divide-white/[0.05] overflow-hidden">
              {filteredWords.map((word) => {
                const meaning = word.meanings[0]?.trMeaning || '—';
                const statusBadge = getStatusBadge(word.learningStatus);
                const isSpeaking = speakingWordId === word.id;
                const isExpanded = expandedWordId === word.id;

                return (
                  <div key={word.id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <div 
                      onClick={() => setExpandedWordId(isExpanded ? null : word.id)}
                      className="p-3 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                    >
                      {/* Left: Audio + AI + Word */}
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => handlePlayAudio(word, e)}
                          className={`p-1.5 rounded-lg transition cursor-pointer shrink-0 ${
                            isSpeaking
                              ? 'bg-amber-500 text-white'
                              : 'text-slate-400 hover:text-amber-700 dark:hover:text-amber-300'
                          }`}
                          title="Telaffuzu Dinle"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>

                        {onOpenAIChat && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenAIChat(word);
                            }}
                            className="p-1.5 rounded-lg text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 transition cursor-pointer shrink-0"
                            title="AI ile Kelimeyi İncele & Cümle Kur"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="font-serif font-bold text-base text-slate-900 dark:text-slate-100 truncate">
                              <HighlightText text={word.word} query={searchQuery} />
                            </span>
                            {word.partOfSpeech && (
                              <span className="text-[11px] italic font-serif text-slate-400 shrink-0">
                                {word.partOfSpeech}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Meaning + CEFR + Status */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-sans font-medium text-xs sm:text-sm text-slate-700 dark:text-slate-300 max-w-[150px] sm:max-w-xs truncate text-right">
                          <HighlightText text={meaning} query={searchQuery} />
                        </span>

                        {word.cefrLevel && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hidden sm:inline">
                            {word.cefrLevel}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => handleCycleStatus(word, e)}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition cursor-pointer ${statusBadge.bg}`}
                          title="Öğrenme Durumunu Değiştir"
                        >
                          {statusBadge.label}
                        </button>

                        <div className="text-slate-400">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Expanded details in compact view */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-white/[0.03] space-y-2 text-xs">
                        {word.examples[0] && (
                          <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-white/[0.06]">
                            <p className="font-serif italic text-slate-800 dark:text-slate-200">
                              &ldquo;<HighlightText text={word.examples[0].sentence} query={searchQuery} />&rdquo;
                            </p>
                            {word.examples[0].trTranslation && (
                              <p className="font-sans text-slate-500 dark:text-slate-400 mt-1">
                                <HighlightText text={word.examples[0].trTranslation} query={searchQuery} />
                              </p>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                          <span>{word.primaryAcademicContext || word.domainCategory || 'Genel'}</span>
                          <div className="flex items-center gap-2">
                            {onOpenAIChat && (
                              <button
                                onClick={() => onOpenAIChat(word)}
                                className="text-amber-700 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1 font-medium"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>AI ile İncele</span>
                              </button>
                            )}
                            {onOpenAIChat && <span aria-hidden="true">·</span>}
                            <button
                              onClick={(e) => handleCopyWord(word, e)}
                              className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer flex items-center gap-1"
                            >
                              {copiedId === word.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedId === word.id ? 'Kopyalandı' : 'Kopyala'}</span>
                            </button>
                            <span aria-hidden="true">·</span>
                            <button
                              onClick={() => onDeleteWord(word.id)}
                              className="text-rose-500/80 hover:text-rose-600 cursor-pointer"
                            >
                              Sil
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* 6. SMART USER-CENTRIC EMPTY STATE (10x Productivity) */
        <div className="py-12 px-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-slate-100">
              {searchQuery ? `"${searchQuery}" sözlükte henüz kayıtlı değil` : 'Kriterlere uygun kelime bulunamadı'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {searchQuery 
                ? 'Bu kelimeyi hemen tek tıkla sözlüğünüze ekleyebilirsiniz. Anlam ve örnek cümleler otomatik getirilecektir.'
                : 'Filtreleri sıfırlayarak tüm kelimelerinizi tekrar listeleyebilirsiniz.'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            {searchQuery ? (
              <button
                onClick={() => onOpenAddModal(searchQuery.trim())}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs sm:text-sm shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>&ldquo;{searchQuery.trim()}&rdquo; Kelimesini Ekle</span>
              </button>
            ) : null}

            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm transition cursor-pointer"
            >
              Filtreleri Sıfırla
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
