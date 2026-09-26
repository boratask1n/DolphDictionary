export type LanguageCode = 'en' | 'de';

export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'phrase'
  | 'idiom'
  | 'prefix'
  | 'suffix';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type DomainCategory = 
  | 'Gündelik & Yaşam'
  | 'İş & Kariyer'
  | 'Kültür & Medya'
  | 'Akademik & Bilim'
  | 'Felsefe & Düşünce'
  | string;

export type AcademicContextCategory =
  | 'Gündelik / Günlük Yaşam'
  | 'Gündelik & Yaşam'
  | 'İş & Kariyer'
  | 'Kültür & Medya'
  | 'Akademik & Bilim'
  | 'Felsefe & Düşünce'
  | 'Astrophysics'
  | 'Astronomy'
  | 'Physics'
  | 'Mathematics'
  | 'Biology'
  | 'Chemistry'
  | 'Computer Science'
  | 'General Academic'
  | 'Scientific Writing'
  | 'İş & İletişim'
  | string;

export type LearningStatus =
  | 'new'
  | 'learning'
  | 'review'
  | 'mastered'
  | 'difficult';

export type DifficultyLabel = 'Easy' | 'Medium' | 'Hard' | 'Very Hard';

export type ReviewFeedback = 'forgot' | 'difficult' | 'remembered';

export type ReviewMode =
  | 'daily'
  | 'quick'
  | 'difficult'
  | 'recent'
  | 'all'
  | 'random';

export interface Meaning {
  id: string;
  trMeaning: string;
  secondaryTrMeanings: string[];
  definitionEn?: string;
  context?: string;
  notes?: string;
}

export interface ExampleSentence {
  id: string;
  sentence: string;
  trTranslation: string;
  sourceContext?: string;
}

export interface WordFamilyMember {
  id: string;
  word: string;
  partOfSpeech: PartOfSpeech;
  relation: string; // e.g. "noun derivative", "verb root", "adjective form"
}

export interface Word {
  id: string;
  userId?: string;
  word: string;
  language: LanguageCode;
  partOfSpeech: PartOfSpeech;
  phoneticIpa?: string;
  audioUrl?: string;
  
  // Meanings
  meanings: Meaning[];
  
  // Categorization & Levels
  cefrLevel?: CEFRLevel;
  domainCategory?: DomainCategory;

  // Academic & Sentences
  examples: ExampleSentence[];
  personalNote?: string;
  primaryAcademicContext: AcademicContextCategory;
  
  // Associations
  synonyms: string[];
  antonyms: string[];
  relatedWords: string[];
  wordFamily: WordFamilyMember[];
  tags: string[];
  
  // Spaced Repetition & Performance (FSRS / Adaptive)
  difficultyRating: number; // 1.0 (very easy) to 10.0 (very hard)
  difficultyLabel: DifficultyLabel;
  learningStatus: LearningStatus;
  
  dateAdded: string; // ISO
  lastReviewed?: string; // ISO
  nextReviewDate: string; // ISO
  
  reviewCount: number;
  correctCount: number;
  incorrectCount: number;
  
  stabilityDays: number; // Interval stability in days
  difficultyFactor: number; // Internal factor
  lapses: number; // Number of times forgotten
  streak: number;
}

export interface ReviewLog {
  id: string;
  userId?: string;
  wordId: string;
  wordText: string;
  timestamp: string;
  feedback: ReviewFeedback;
  previousIntervalDays: number;
  newIntervalDays: number;
  previousDifficulty: number;
  newDifficulty: number;
  mode: ReviewMode;
}

export interface UserSettings {
  userId?: string;
  nativeLanguage: 'tr';
  targetLanguages: LanguageCode[];
  activeLanguage: LanguageCode;
  dailyGoal: number;
  weeklyGoal?: number;
  theme: 'dark' | 'light' | 'system';
  pronunciationPreference: 'us' | 'uk' | 'de';
  autoPlayAudio: boolean;
  keyboardShortcutsEnabled: boolean;
  cloudSyncEnabled: boolean;
  customCategories?: string[];
}
