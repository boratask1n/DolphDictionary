import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  Volume2, 
  Plus, 
  BookOpen, 
  Clock, 
  Sparkles,
  ArrowUpDown,
  Tag
} from 'lucide-react';
import { Word, LanguageCode, LearningStatus, DifficultyLabel } from '../../types';
import { speechService } from '../../services/speech';

interface VocabularyBrowserProps {
  words: Word[];
  onSelectWord: (word: Word) => void;
  onAddNew: () => void;
  activeLanguage: LanguageCode;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const VocabularyBrowser: React.FC<VocabularyBrowserProps> = ({
  words,
  onSelectWord,
  onAddNew,
  activeLanguage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [selectedContext, setSelectedContext] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'alpha-asc' | 'alpha-desc' | 'recent' | 'next-review' | 'difficulty'>('alpha-asc');
  const [showFilters, setShowFilters] = useState(false);

  // Extract unique academic contexts from current words
  const availableContexts = useMemo(() => {
    const set = new Set<string>();
    words.forEach((w) => {
      if (w.primaryAcademicContext) set.add(w.primaryAcademicContext);
    });
    return Array.from(set).sort();
  }, [words]);

  // Full-text search across word, Turkish meanings, secondary meanings, notes, sentences, tags, context
  const filteredWords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return words.filter((item) => {
      // Letter filter
      if (selectedLetter) {
        if (!item.word.toUpperCase().startsWith(selectedLetter)) {
          return false;
        }
      }

      // Context filter
      if (selectedContext !== 'all' && item.primaryAcademicContext !== selectedContext) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && item.learningStatus !== selectedStatus) {
        return false;
      }

      // Difficulty filter
      if (selectedDifficulty !== 'all' && item.difficultyLabel !== selectedDifficulty) {
        return false;
      }

      // Search query filter
      if (q) {
        const wordMatch = item.word.toLowerCase().includes(q);
        const meaningMatch = item.meanings.some((m) => 
          m.trMeaning.toLowerCase().includes(q) ||
          m.secondaryTrMeanings?.some((sec) => sec.toLowerCase().includes(q)) ||
          m.definitionEn?.toLowerCase().includes(q)
        );
        const noteMatch = item.personalNote?.toLowerCase().includes(q);
        const exampleMatch = item.examples?.some((e) => 
          e.sentence.toLowerCase().includes(q) || e.trTranslation.toLowerCase().includes(q)
        );
        const tagMatch = item.tags?.some((t) => t.toLowerCase().includes(q));
        const contextMatch = item.primaryAcademicContext?.toLowerCase().includes(q);

        if (!wordMatch && !meaningMatch && !noteMatch && !exampleMatch && !tagMatch && !contextMatch) {
          return false;
        }
      }

      return true;
    });
  }, [words, searchQuery, selectedLetter, selectedContext, selectedStatus, selectedDifficulty]);

  // Sorting
  const sortedWords = useMemo(() => {
    const list = [...filteredWords];
    list.sort((a, b) => {
      switch (sortBy) {
        case 'alpha-asc':
          return a.word.localeCompare(b.word);
        case 'alpha-desc':
          return b.word.localeCompare(a.word);
        case 'recent':
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
        case 'next-review':
          return new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime();
        case 'difficulty':
          return b.difficultyRating - a.difficultyRating;
        default:
          return 0;
      }
    });
    return list;
  }, [filteredWords, sortBy]);

  // Group by first letter if in alphabetical mode and no letter is isolated
  const groupedByLetter = useMemo(() => {
    if (sortBy !== 'alpha-asc' && sortBy !== 'alpha-desc') return null;

    const groups: Record<string, Word[]> = {};
    sortedWords.forEach((w) => {
      const letter = w.word[0].toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(w);
    });
    return groups;
  }, [sortedWords, sortBy]);

  const activeFilterCount = 
    (selectedContext !== 'all' ? 1 : 0) +
    (selectedStatus !== 'all' ? 1 : 0) +
    (selectedDifficulty !== 'all' ? 1 : 0) +
    (selectedLetter ? 1 : 0);

  return (
    <div className="space-y-5">
      {/* Header with Search & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Kelime Bankası (Vocabulary)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {words.length} akademik kelime kayıtlı • {filteredWords.length} kelime listeleniyor
          </p>
        </div>

        <button
          onClick={onAddNew}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Kelime Ekle</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Kelime, Türkçe anlam, ikincil anlam, örnek cümle veya etiket ara (örn: 'maruz', 'accretion', 'optics')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-sky-500 outline-none text-slate-900 dark:text-slate-100"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Temizle
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition ${
              activeFilterCount > 0 || showFilters
                ? 'border-sky-500 text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filtreler</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-sky-500 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="alpha-asc">Sırala: A → Z</option>
              <option value="alpha-desc">Sırala: Z → A</option>
              <option value="recent">En Son Eklenenler</option>
              <option value="next-review">Tekrar Tarihi (En Yakın)</option>
              <option value="difficulty">Zorluk Derecesi (En Zor)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alphabetical Jump Selector Bar (A-Z) */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          onClick={() => setSelectedLetter(null)}
          className={`px-2.5 py-1 rounded-md font-semibold transition shrink-0 ${
            selectedLetter === null
              ? 'bg-slate-900 dark:bg-sky-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          TÜMÜ
        </button>
        {ALPHABET.map((letter) => {
          const count = words.filter((w) => w.word.toUpperCase().startsWith(letter)).length;
          const isSelected = selectedLetter === letter;
          return (
            <button
              key={letter}
              disabled={count === 0}
              onClick={() => setSelectedLetter(isSelected ? null : letter)}
              className={`w-7 h-7 rounded-md font-mono text-xs flex items-center justify-center transition shrink-0 ${
                isSelected
                  ? 'bg-sky-600 text-white font-bold'
                  : count > 0
                  ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 font-medium'
                  : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
              }`}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* Collapsible Filter Panel */}
      {showFilters && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
              Akademik Bağlam
            </label>
            <select
              value={selectedContext}
              onChange={(e) => setSelectedContext(e.target.value)}
              className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">Tüm Alanlar</option>
              {availableContexts.map((ctx) => (
                <option key={ctx} value={ctx}>{ctx}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
              Öğrenme Durumu
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="review">Tekrar Havuzunda</option>
              <option value="learning">Öğrenilmekte Olan</option>
              <option value="difficult">Zor Kelimeler</option>
              <option value="mastered">Öğrenildi / Usta</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
              Zorluk Seviyesi
            </label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">Tüm Zorluklar</option>
              <option value="Easy">Easy (Kolay)</option>
              <option value="Medium">Medium (Orta)</option>
              <option value="Hard">Hard (Zor)</option>
              <option value="Very Hard">Very Hard (Çok Zor)</option>
            </select>
          </div>

          {activeFilterCount > 0 && (
            <div className="sm:col-span-3 flex justify-end">
              <button
                onClick={() => {
                  setSelectedContext('all');
                  setSelectedStatus('all');
                  setSelectedDifficulty('all');
                  setSelectedLetter(null);
                }}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-medium"
              >
                Tüm Filtreleri Sıfırla
              </button>
            </div>
          )}
        </div>
      )}

      {/* Vocabulary Cards Display */}
      {sortedWords.length === 0 ? (
        <div className="py-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-6">
          <BookOpen className="w-10 h-10 mx-auto text-slate-400 mb-3" />
          <h3 className="font-serif text-base font-semibold text-slate-800 dark:text-slate-200">
            Aramaya uygun kelime bulunamadı
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Farklı bir arama kriteri deneyin veya yeni bir akademik kelime kaydedin.
          </p>
          <button
            onClick={onAddNew}
            className="mt-4 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-500"
          >
            Hızlı Kelime Ekle
          </button>
        </div>
      ) : groupedByLetter && !selectedLetter ? (
        // Alphabetical Grouped Sections
        <div className="space-y-6">
          {Object.keys(groupedByLetter).map((letter) => (
            <div key={letter} className="space-y-2.5">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
                <span className="font-serif font-bold text-xl text-sky-600 dark:text-sky-400">
                  {letter}
                </span>
                <span className="text-xs text-slate-400">
                  ({groupedByLetter[letter].length} kelime)
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {groupedByLetter[letter].map((word) => (
                  <WordSummaryCard 
                    key={word.id} 
                    word={word} 
                    onClick={() => onSelectWord(word)} 
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Flat Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedWords.map((word) => (
            <WordSummaryCard 
              key={word.id} 
              word={word} 
              onClick={() => onSelectWord(word)} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface WordSummaryCardProps {
  word: Word;
  onClick: () => void;
}

const WordSummaryCard: React.FC<WordSummaryCardProps> = ({ word, onClick }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(true);
    speechService.speak(word.word, word.language).finally(() => setIsPlaying(false));
  };

  const isDue = new Date(word.nextReviewDate).getTime() <= Date.now();

  return (
    <div
      onClick={onClick}
      className="group relative p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/80 hover:border-sky-500/50 dark:hover:border-sky-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top badges */}
        <div className="flex items-center justify-between gap-1 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {word.partOfSpeech}
            </span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
              {word.primaryAcademicContext}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {isDue && (
              <span className="w-2 h-2 rounded-full bg-rose-500" title="Tekrar bekliyor" />
            )}
            <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
              word.difficultyRating >= 7
                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                : word.difficultyRating >= 4
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
            }`}>
              {word.difficultyLabel}
            </span>
          </div>
        </div>

        {/* Word and Audio */}
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition">
            {word.word}
          </h3>
          <button
            onClick={handleAudio}
            className="p-1 rounded-full text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition"
            title="Telaffuz"
          >
            <Volume2 className={`w-4 h-4 ${isPlaying ? 'animate-pulse text-sky-500' : ''}`} />
          </button>
        </div>

        {/* Turkish Meaning */}
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
          {word.meanings[0]?.trMeaning || 'Anlam belirtilmedi'}
        </p>

        {/* Secondary Meanings snippet */}
        {word.meanings[0]?.secondaryTrMeanings && word.meanings[0].secondaryTrMeanings.length > 0 && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
            {word.meanings[0].secondaryTrMeanings.join(', ')}
          </p>
        )}
      </div>

      {/* Footer info: tags & stability */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span className="truncate max-w-[140px]">
          {word.tags.length > 0 ? `#${word.tags[0]}` : word.primaryAcademicContext}
        </span>
        <span className="font-mono">
          {word.reviewCount > 0 ? `${word.stabilityDays}g aralık` : 'Yeni'}
        </span>
      </div>
    </div>
  );
};
