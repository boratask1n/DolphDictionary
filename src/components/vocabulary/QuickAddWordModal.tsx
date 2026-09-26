import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Volume2, 
  BookOpen, 
  Layers,
  Plus,
  Loader2,
  Tag,
  FolderPlus
} from 'lucide-react';
import { 
  Word, 
  LanguageCode, 
  PartOfSpeech, 
  CEFRLevel, 
  DomainCategory, 
  Meaning, 
  ExampleSentence 
} from '../../types';
import { getAcademicSuggestion } from '../../services/academicDictionary';
import { speakWord, generateApproximateIPA } from '../../services/pronunciation';
import { generateWordDataWithAI } from '../../services/aiWordService';
import { 
  DEFAULT_CATEGORIES, 
  getCustomCategories, 
  addCustomCategory, 
  getAllCategories 
} from '../../services/categories';

interface QuickAddWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (word: Word) => void;
  initialWord?: Word | null;
  activeLanguage: LanguageCode;
}

const CEFR_LEVELS: { level: CEFRLevel; label: string; desc: string; color: string }[] = [
  { level: 'A1', label: 'A1', desc: 'Başlangıç', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
  { level: 'A2', label: 'A2', desc: 'Temel', color: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20' },
  { level: 'B1', label: 'B1', desc: 'Günlük & Pratik', color: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20' },
  { level: 'B2', label: 'B2', desc: 'Akıcı & Sosyal', color: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20' },
  { level: 'C1', label: 'C1', desc: 'İleri & Profesyonel', color: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20' },
  { level: 'C2', label: 'C2', desc: 'Usta & Akademik', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20' },
];

const PARTS_OF_SPEECH: { value: PartOfSpeech; label: string }[] = [
  { value: 'noun', label: 'İsim (noun)' },
  { value: 'verb', label: 'Fiil (verb)' },
  { value: 'adjective', label: 'Sıfat (adj)' },
  { value: 'adverb', label: 'Zarf (adv)' },
  { value: 'phrase', label: 'Kalıp / İfade' },
  { value: 'idiom', label: 'Deyim (idiom)' },
];

export const QuickAddWordModal: React.FC<QuickAddWordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialWord,
  activeLanguage,
}) => {
  // Core minimum fields
  const [wordText, setWordText] = useState('');
  const [language, setLanguage] = useState<LanguageCode>(activeLanguage);
  const [primaryMeaning, setPrimaryMeaning] = useState('');
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>('B2');
  const [domainCategory, setDomainCategory] = useState<string>('Gündelik & Yaşam');
  const [partOfSpeech, setPartOfSpeech] = useState<PartOfSpeech>('noun');

  // Audio speaking state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Progressive disclosure fields
  const [exampleSentence, setExampleSentence] = useState('');
  const [exampleTranslation, setExampleTranslation] = useState('');
  const [secondaryMeanings, setSecondaryMeanings] = useState<string[]>([]);
  const [secondaryInput, setSecondaryInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [personalNote, setPersonalNote] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  // Categories management
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // AI Generation States
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);

  // Instant Dictionary Suggestion
  const [suggestedData, setSuggestedData] = useState<ReturnType<typeof getAcademicSuggestion> | null>(null);

  // Initialize and load custom categories
  useEffect(() => {
    if (isOpen) {
      setCustomCategories(getCustomCategories());
      if (initialWord) {
        setWordText(initialWord.word || '');
        setLanguage(initialWord.language || activeLanguage);
        setPartOfSpeech(initialWord.partOfSpeech || 'noun');
        setCefrLevel(initialWord.cefrLevel || 'B2');
        setDomainCategory(initialWord.domainCategory || initialWord.primaryAcademicContext || 'Gündelik & Yaşam');
        setPrimaryMeaning(initialWord.meanings[0]?.trMeaning || '');
        setSecondaryMeanings(initialWord.meanings[0]?.secondaryTrMeanings || []);
        setExampleSentence(initialWord.examples[0]?.sentence || '');
        setExampleTranslation(initialWord.examples[0]?.trTranslation || '');
        setPersonalNote(initialWord.personalNote || '');
        setTagsInput(initialWord.tags?.join(', ') || '');
        setShowDetails(Boolean(initialWord.examples[0]?.sentence || initialWord.personalNote || (initialWord.meanings[0]?.secondaryTrMeanings && initialWord.meanings[0].secondaryTrMeanings.length > 0)));
      } else {
        resetForm();
      }
    }
  }, [initialWord, isOpen, activeLanguage]);

  const resetForm = () => {
    setWordText('');
    setLanguage(activeLanguage);
    setPartOfSpeech('noun');
    setPrimaryMeaning('');
    setCefrLevel('B2');
    setDomainCategory('Gündelik & Yaşam');
    setSecondaryMeanings([]);
    setSecondaryInput('');
    setExampleSentence('');
    setExampleTranslation('');
    setPersonalNote('');
    setTagsInput('');
    setShowDetails(false);
    setSuggestedData(null);
    setIsGeneratingAI(false);
    setAiFeedback(null);
    setIsCreatingCategory(false);
    setNewCategoryName('');
  };

  if (!isOpen) return null;

  // Instant Smart Autocomplete from dictionary knowledge base
  const handleAutoSuggest = (text: string) => {
    setWordText(text);
    setAiFeedback(null);
    if (text.trim().length >= 2) {
      const suggestion = getAcademicSuggestion(text, language);
      if (suggestion && suggestion.meanings[0]?.trMeaning) {
        setSuggestedData(suggestion);
      } else {
        setSuggestedData(null);
      }
    } else {
      setSuggestedData(null);
    }
  };

  const handleApplySuggestion = () => {
    if (!suggestedData) return;
    if (suggestedData.meanings[0]) {
      setPrimaryMeaning(suggestedData.meanings[0].trMeaning);
      setSecondaryMeanings(suggestedData.meanings[0].secondaryTrMeanings || []);
    }
    if (suggestedData.partOfSpeech) {
      setPartOfSpeech(suggestedData.partOfSpeech);
    }
    if (suggestedData.cefrLevel) {
      setCefrLevel(suggestedData.cefrLevel);
    }
    if (suggestedData.domainCategory) {
      setDomainCategory(suggestedData.domainCategory);
    }
    if (suggestedData.examples[0]) {
      setExampleSentence(suggestedData.examples[0].sentence);
      setExampleTranslation(suggestedData.examples[0].trTranslation);
      setShowDetails(true);
    }
    if (suggestedData.tags && suggestedData.tags.length > 0) {
      setTagsInput(suggestedData.tags.join(', '));
    }
    setSuggestedData(null);
  };

  // AI Generation Handler: analyzes word, fills meaning, determines CEFR level, part of speech, secondary meanings, example sentence & tags
  const handleGenerateWithAI = async (focusArea?: 'all' | 'examples_and_meanings') => {
    const wordToAnalyze = wordText.trim();
    if (!wordToAnalyze) {
      setAiFeedback('Lütfen önce bir kelime veya kalıp yazın.');
      return;
    }

    setIsGeneratingAI(true);
    setAiFeedback(null);

    try {
      const aiResult = await generateWordDataWithAI({
        word: wordToAnalyze,
        language,
        existingMeaning: primaryMeaning.trim() || undefined,
        category: domainCategory || undefined,
      });

      // 1. Primary Meaning & Word Info
      if (aiResult.meaning && (!primaryMeaning.trim() || focusArea !== 'examples_and_meanings')) {
        setPrimaryMeaning(aiResult.meaning);
      }
      if (aiResult.partOfSpeech) {
        setPartOfSpeech(aiResult.partOfSpeech);
      }

      // 2. CEFR Level (Determined automatically)
      if (aiResult.cefrLevel) {
        setCefrLevel(aiResult.cefrLevel);
      }

      // 3. Category / Domain
      if (aiResult.domainCategory) {
        setDomainCategory(aiResult.domainCategory);
      }

      // 4. Example Sentence & Turkish Translation
      if (aiResult.exampleSentence) {
        setExampleSentence(aiResult.exampleSentence);
      }
      if (aiResult.exampleTranslation) {
        setExampleTranslation(aiResult.exampleTranslation);
      }

      // 5. Additional Secondary Meanings
      if (Array.isArray(aiResult.secondaryMeanings) && aiResult.secondaryMeanings.length > 0) {
        // Merge without duplicate
        setSecondaryMeanings(prev => {
          const combined = [...prev];
          for (const m of aiResult.secondaryMeanings) {
            if (!combined.some(c => c.toLowerCase() === m.toLowerCase())) {
              combined.push(m);
            }
          }
          return combined;
        });
      }

      // 6. Tags
      if (Array.isArray(aiResult.tags) && aiResult.tags.length > 0) {
        const currentTags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
        const combinedTags = Array.from(new Set([...currentTags, ...aiResult.tags]));
        setTagsInput(combinedTags.join(', '));
      }

      // Expand details so the user sees generated sentence & secondary meanings
      setShowDetails(true);
      setSuggestedData(null);
      setAiFeedback(
        `✨ Yapay Zeka Hazırladı: ${aiResult.cefrLevel} seviyesi, ${aiResult.partOfSpeech === 'noun' ? 'isim' : aiResult.partOfSpeech === 'verb' ? 'fiil' : aiResult.partOfSpeech} türü, ek yan anlamlar ve örnek cümle eklendi!`
      );
    } catch (err: any) {
      console.error('AI generation error:', err);
      setAiFeedback(err?.message || 'Yapay zeka ile veri oluşturulurken bir hata oluştu.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Category creation handler
  const handleCreateNewCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    const updated = addCustomCategory(trimmed);
    setCustomCategories(updated);
    setDomainCategory(trimmed);
    setNewCategoryName('');
    setIsCreatingCategory(false);
  };

  // Pronounce audio right from the modal
  const handlePlayAudio = () => {
    if (!wordText.trim()) return;
    speakWord(
      wordText, 
      language, 
      () => setIsPlayingAudio(true), 
      () => setIsPlayingAudio(false)
    );
  };

  const handleAddSecondary = () => {
    const trimmed = secondaryInput.trim();
    if (trimmed && !secondaryMeanings.includes(trimmed)) {
      setSecondaryMeanings([...secondaryMeanings, trimmed]);
      setSecondaryInput('');
    }
  };

  const handleRemoveSecondary = (idx: number) => {
    setSecondaryMeanings(secondaryMeanings.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordText.trim() || !primaryMeaning.trim()) return;

    // IPA phonetic is calculated silently in background for audio compatibility; no longer shown in UI
    const finalIPA = generateApproximateIPA(wordText, language);

    const meanings: Meaning[] = [
      {
        id: initialWord?.meanings[0]?.id || `m-${Date.now()}-1`,
        trMeaning: primaryMeaning.trim(),
        secondaryTrMeanings: secondaryMeanings,
        context: domainCategory,
      },
    ];

    const examples: ExampleSentence[] = exampleSentence.trim()
      ? [
          {
            id: initialWord?.examples[0]?.id || `ex-${Date.now()}-1`,
            sentence: exampleSentence.trim(),
            trTranslation: exampleTranslation.trim(),
            sourceContext: domainCategory,
          },
        ]
      : [];

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    // If no tags, add domain & level as tags automatically
    if (tags.length === 0) {
      tags.push(domainCategory.toLowerCase(), cefrLevel.toLowerCase());
    }

    const wordToSave: Word = {
      id: initialWord?.id || `word-${Date.now()}`,
      word: wordText.trim(),
      language,
      partOfSpeech,
      phoneticIpa: finalIPA,
      cefrLevel,
      domainCategory,
      meanings,
      examples,
      personalNote: personalNote.trim() || undefined,
      primaryAcademicContext: domainCategory,
      synonyms: initialWord?.synonyms || [],
      antonyms: initialWord?.antonyms || [],
      relatedWords: initialWord?.relatedWords || [],
      wordFamily: initialWord?.wordFamily || [],
      tags,
      difficultyRating: cefrLevel === 'A1' ? 1.5 : cefrLevel === 'A2' ? 2.0 : cefrLevel === 'B1' ? 2.5 : cefrLevel === 'B2' ? 3.5 : cefrLevel === 'C1' ? 4.5 : 5.5,
      difficultyLabel: cefrLevel === 'A1' || cefrLevel === 'A2' || cefrLevel === 'B1' ? 'Easy' : cefrLevel === 'B2' ? 'Medium' : cefrLevel === 'C1' ? 'Hard' : 'Very Hard',
      learningStatus: initialWord?.learningStatus || 'learning',
      dateAdded: initialWord?.dateAdded || new Date().toISOString(),
      lastReviewed: initialWord?.lastReviewed,
      nextReviewDate: initialWord?.nextReviewDate || new Date().toISOString(),
      reviewCount: initialWord?.reviewCount || 0,
      correctCount: initialWord?.correctCount || 0,
      incorrectCount: initialWord?.incorrectCount || 0,
      stabilityDays: initialWord?.stabilityDays || 1.0,
      difficultyFactor: initialWord?.difficultyFactor || 3.0,
      lapses: initialWord?.lapses || 0,
      streak: initialWord?.streak || 0,
    };

    onSave(wordToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-2xl overflow-hidden transition-all text-slate-900 dark:text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold">
                {initialWord ? 'Kelimeyi Düzenle' : 'Yeni Kelime Ekle'}
              </h2>
              <p className="text-[11px] text-slate-500 font-sans">
                Yapay zeka ile anlam, seviye, ek yan anlamlar ve örnek cümleleri tek tıkla oluşturun.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-5">
          
          {/* Row 1: Word Input + AI Generate Button + Audio Preview + Language */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-sans font-bold text-slate-600 dark:text-slate-300">
                Hedef Kelime veya Kalıp <span className="text-rose-500">*</span>
              </label>
              
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] transition cursor-pointer ${
                    language === 'en'
                      ? 'bg-amber-500 text-white font-bold shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  🇬🇧 İngilizce
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('de')}
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] transition cursor-pointer ${
                    language === 'de'
                      ? 'bg-amber-500 text-white font-bold shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  🇩🇪 Almanca
                </button>
              </div>
            </div>

            <div className="relative flex items-center">
              <input
                type="text"
                required
                autoFocus
                placeholder={language === 'en' ? 'örn: resilience, tackle, serendipity...' : 'örn: Gemütlichkeit, Feierabend, schätzen...'}
                value={wordText}
                onChange={(e) => handleAutoSuggest(e.target.value)}
                className="w-full pl-4 pr-24 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/50 text-base sm:text-lg font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/40 outline-none transition"
              />

              {/* Automatic Pronunciation Audio Button */}
              {wordText.trim() && (
                <button
                  type="button"
                  onClick={handlePlayAudio}
                  title="Seslendir"
                  className={`absolute right-2 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    isPlayingAudio
                      ? 'bg-amber-500 text-white scale-105'
                      : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25'
                  }`}
                >
                  <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudio ? 'animate-bounce' : ''}`} />
                  <span>Dinle</span>
                </button>
              )}
            </div>

            {/* Smart Primary AI Auto-fill Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleGenerateWithAI('all')}
                disabled={isGeneratingAI || !wordText.trim()}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                  isGeneratingAI
                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 animate-pulse cursor-wait'
                    : wordText.trim()
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/20 active:scale-95'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
                title="Yapay zeka ile anlam, seviye, ek yan anlamlar ve örnek cümleyi otomatik doldur"
              >
                {isGeneratingAI ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Yapay Zeka Analiz Ediyor...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-200 fill-current" />
                    <span>✨ AI ile Tümünü Otomatik Doldur</span>
                  </>
                )}
              </button>

              <span className="text-[11px] text-slate-400 italic">
                Seviye, tür, yan anlamlar & cümle otomatik belirlenir
              </span>
            </div>

            {/* AI Feedback Banner */}
            {aiFeedback && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{aiFeedback}</span>
              </div>
            )}

            {/* Local Dictionary Suggestion Pill */}
            {suggestedData && !aiFeedback && (
              <div className="mt-2 p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <BookOpen className="w-4 h-4 text-sky-600 shrink-0" />
                  <span className="text-sky-900 dark:text-sky-200 truncate">
                    Sözlük Verisi: <b>{suggestedData.meanings[0]?.trMeaning}</b>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleApplySuggestion}
                  className="px-2.5 py-1 rounded-lg bg-sky-600 text-white font-semibold shrink-0 hover:bg-sky-700 transition cursor-pointer"
                >
                  Sözlükten Al
                </button>
              </div>
            )}
          </div>

          {/* Row 2: Meaning (Türkçe Anlam) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-sans font-bold text-slate-600 dark:text-slate-300">
                Kelime Anlamı (Türkçe Karşılığı) <span className="text-rose-500">*</span>
              </label>
              {primaryMeaning && (
                <span className="text-[10px] text-slate-400">
                  Temel anlam
                </span>
              )}
            </div>
            <input
              type="text"
              required
              placeholder="örn: psikolojik dayanıklılık, kendini toparlama gücü"
              value={primaryMeaning}
              onChange={(e) => setPrimaryMeaning(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/50 text-sm sm:text-base font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/40 outline-none transition"
            />
          </div>

          {/* Row 3: CEFR Level Selector (A1, A2, B1, B2, C1, C2) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-sans font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                <span>Dil Seviyesi (CEFR)</span>
              </label>
              <span className="text-[11px] text-slate-400">
                AI tarafından otomatik belirlenir veya seçebilirsiniz
              </span>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {CEFR_LEVELS.map((item) => {
                const isSelected = cefrLevel === item.level;
                return (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => setCefrLevel(item.level)}
                    className={`py-2 px-1 rounded-xl border text-center transition flex flex-col items-center justify-center cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : `${item.color} hover:opacity-90`
                    }`}
                  >
                    <span className="font-sans font-bold text-sm leading-none">
                      {item.label}
                    </span>
                    <span className={`text-[9px] mt-1 font-sans truncate max-w-full px-0.5 ${
                      isSelected ? 'text-white/90' : 'opacity-80'
                    }`}>
                      {item.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 4: Category / Domain Management & Part of Speech */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Category Selector with Custom Category Creation */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-sans font-bold text-slate-600 dark:text-slate-300">
                  Kategori
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                  className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <FolderPlus className="w-3 h-3" />
                  <span>{isCreatingCategory ? 'Kapat' : '+ Yeni Kategori'}</span>
                </button>
              </div>

              {/* Inline Custom Category Creator */}
              {isCreatingCategory ? (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <div className="text-[11px] font-semibold text-amber-900 dark:text-amber-200">
                    Yeni Kategori Oluştur:
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      autoFocus
                      placeholder="örn: Tıp & Sağlık, Hukuk, Seyahat..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateNewCategory();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-amber-300 dark:border-amber-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={handleCreateNewCategory}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition cursor-pointer shrink-0"
                    >
                      Ekle
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingCategory(false);
                        setNewCategoryName('');
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <select
                  value={domainCategory}
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') {
                      setIsCreatingCategory(true);
                    } else {
                      setDomainCategory(e.target.value);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/50 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/40 transition cursor-pointer"
                >
                  <optgroup label="Standart Kategoriler">
                    {DEFAULT_CATEGORIES.map((dom) => (
                      <option key={dom} value={dom}>{dom}</option>
                    ))}
                  </optgroup>
                  {customCategories.length > 0 && (
                    <optgroup label="⭐ Özel Kategorileriniz">
                      {customCategories.map((dom) => (
                        <option key={dom} value={dom}>⭐ {dom}</option>
                      ))}
                    </optgroup>
                  )}
                  {/* If current category is not in standard or custom, show it as selected */}
                  {!DEFAULT_CATEGORIES.includes(domainCategory) && !customCategories.includes(domainCategory) && domainCategory && (
                    <optgroup label="Bu Kelimenin Kategorisi">
                      <option value={domainCategory}>📌 {domainCategory}</option>
                    </optgroup>
                  )}
                  <option value="__NEW__">➕ + Yeni Kategori Oluştur...</option>
                </select>
              )}
            </div>

            {/* Part of Speech */}
            <div>
              <label className="text-xs font-sans font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Sözcük Türü
              </label>
              <select
                value={partOfSpeech}
                onChange={(e) => setPartOfSpeech(e.target.value as PartOfSpeech)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/50 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/40 transition cursor-pointer"
              >
                {PARTS_OF_SPEECH.map((pos) => (
                  <option key={pos.value} value={pos.value}>{pos.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Progressive Disclosure Toggle */}
          <div className="pt-1 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
            >
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span>{showDetails ? 'Örnek Cümle ve Detayları Gizle' : '+ Örnek Cümle, Ek Yan Anlamlar ve Notlar'}</span>
            </button>

            {/* Dedicated AI Button for Examples & Secondary Meanings */}
            <button
              type="button"
              onClick={() => handleGenerateWithAI('examples_and_meanings')}
              disabled={isGeneratingAI || !wordText.trim()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 transition cursor-pointer disabled:opacity-40"
              title="Yapay zekaya örnek cümle ve ek yan anlamları hazırlat"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>AI Cümle & Yan Anlam Üret</span>
            </button>
          </div>

          {/* Extended Details Section (Note: IPA Phonetic has been completely removed as requested) */}
          {showDetails && (
            <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
              
              {/* Example Sentence Section */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-sans font-bold text-slate-700 dark:text-slate-300 block">
                    Örnek Cümle & Türkçe Çevirisi
                  </label>
                  <button
                    type="button"
                    onClick={() => handleGenerateWithAI('examples_and_meanings')}
                    disabled={isGeneratingAI || !wordText.trim()}
                    className="text-[11px] text-amber-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Yapay Zekaya Yenilet</span>
                  </button>
                </div>
                
                <textarea
                  rows={2}
                  placeholder={language === 'en' ? 'Building daily resilience helps navigate stressful situations.' : 'Nach der Arbeit machen wir heute Feierabend.'}
                  value={exampleSentence}
                  onChange={(e) => setExampleSentence(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-serif italic outline-none focus:ring-2 focus:ring-amber-500/40"
                />

                <input
                  type="text"
                  placeholder="Cümlenin Türkçe Çevirisi (örn: Günlük psikolojik dayanıklılık geliştirmek zorlu durumları yönetmeye yardımcı olur)..."
                  value={exampleTranslation}
                  onChange={(e) => setExampleTranslation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              {/* Secondary Meanings Chips & AI generation */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-sans font-bold text-slate-700 dark:text-slate-300">
                    Ek / Yan Anlamlar (Farklı Kullanımlar)
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Yapay zeka otomatik ekler veya manuel yazabilirsiniz
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="örn: esneklik, toparlanma yetisi, direnç..."
                    value={secondaryInput}
                    onChange={(e) => setSecondaryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSecondary();
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                  <button
                    type="button"
                    onClick={handleAddSecondary}
                    className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition cursor-pointer"
                  >
                    Ekle
                  </button>
                </div>

                {secondaryMeanings.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {secondaryMeanings.map((sec, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-900 dark:text-amber-200 border border-amber-500/20 text-xs font-medium"
                      >
                        <span>{sec}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSecondary(idx)}
                          className="text-amber-700 dark:text-amber-400 hover:text-rose-500 transition cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Personal Notes & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                    Kişisel Not (İsteğe Bağlı)
                  </label>
                  <input
                    type="text"
                    placeholder="örn: Podcast'te duydum, sınavda çıktı..."
                    value={personalNote}
                    onChange={(e) => setPersonalNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-amber-500" />
                    <span>Etiketler (Virgülle Ayrılmış)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="iş, psikoloji, b2, collocation"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
            {/* Quick Helper */}
            <div className="text-[11px] text-slate-400 hidden sm:block">
              {cefrLevel} • {partOfSpeech} • {domainCategory}
            </div>

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={!wordText.trim() || !primaryMeaning.trim()}
                className="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white shadow-md shadow-amber-500/20 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>{initialWord ? 'Güncelle' : 'Kelimeyi Kaydet'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
