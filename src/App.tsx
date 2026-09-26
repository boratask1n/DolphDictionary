import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Sparkles } from 'lucide-react';
import { Navbar, ActivePage } from './components/layout/Navbar';
import { DashboardView } from './components/dashboard/DashboardView';
import { DictionaryView } from './components/dictionary/DictionaryView';
import { StickyNoteReels } from './components/reels/StickyNoteReels';
import { AnalyticsView } from './components/statistics/AnalyticsView';
import { ReviewSession } from './components/review/ReviewSession';
import { QuickAddWordModal } from './components/vocabulary/QuickAddWordModal';
import { AIChatDrawer } from './components/ai/AIChatDrawer';
import { AuthModal } from './components/auth/AuthModal';
import { 
  initializeDatabase, 
  getAllWords, 
  getSettings, 
  saveWord, 
  deleteWord as dbDeleteWord, 
  updateSettings as dbUpdateSettings,
  getAllReviewLogs,
  saveReviewLog,
  DEFAULT_SETTINGS
} from './services/db';
import { 
  auth, 
  onAuthStateChanged, 
  FirebaseUser 
} from './services/firebase';
import {
  syncUserProfile,
  fetchUserWordsFromFirestore,
  saveWordToFirestore,
  deleteWordFromFirestore,
  saveReviewLogToFirestore,
  fetchUserReviewLogsFromFirestore,
  syncLocalWordsToFirestore,
  subscribeToUserWords
} from './services/firestoreSync';
import { Word, UserSettings, LanguageCode, ReviewLog, ReviewFeedback, ReviewMode } from './types';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [activeLanguage, setActiveLanguage] = useState<LanguageCode>('en');
  const [words, setWords] = useState<Word[]>([]);
  const [reviewLogs, setReviewLogs] = useState<ReviewLog[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddInitialWord, setQuickAddInitialWord] = useState<Word | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [contextFilter, setContextFilter] = useState<string | null>(null);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [aiChatWord, setAiChatWord] = useState<Word | null>(null);

  // Authentication & Cloud Sync State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const unsubscribeWordsRef = useRef<(() => void) | null>(null);

  // Load database content on mount
  const loadData = useCallback(async () => {
    try {
      await initializeDatabase();
      const loadedSettings = await getSettings();
      setSettings(loadedSettings);
      setActiveLanguage(loadedSettings.activeLanguage || 'en');
      
      const [loadedWords, loadedLogs] = await Promise.all([
        getAllWords(),
        getAllReviewLogs(),
      ]);
      setWords(loadedWords);
      setReviewLogs(loadedLogs);
      
      // Theme initialization
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialDark = loadedSettings.theme === 'dark' || (loadedSettings.theme === 'system' && prefersDark);
      setIsDarkMode(initialDark);
      if (initialDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (err) {
      console.error('Failed to initialize database:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Synchronize dark class on document element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Firebase Auth state listener & Firestore sync
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      // Cleanup previous firestore subscription if any
      if (unsubscribeWordsRef.current) {
        unsubscribeWordsRef.current();
        unsubscribeWordsRef.current = null;
      }

      if (user) {
        setIsSyncing(true);
        try {
          // 1. Sync User profile doc in Firestore
          await syncUserProfile(user);

          // 2. Fetch user words from Firestore
          const remoteWords = await fetchUserWordsFromFirestore(user.uid);
          const remoteLogs = await fetchUserReviewLogsFromFirestore(user.uid);

          if (remoteWords.length > 0) {
            // Firestore has existing data for this user
            setWords(remoteWords);
            // Cache locally
            for (const w of remoteWords) {
              await saveWord(w);
            }
          } else {
            // New user or empty Firestore: migrate local words to cloud
            const localWords = await getAllWords();
            if (localWords.length > 0) {
              await syncLocalWordsToFirestore(user.uid, localWords);
              const refreshed = await fetchUserWordsFromFirestore(user.uid);
              if (refreshed.length > 0) {
                setWords(refreshed);
              }
            }
          }

          if (remoteLogs.length > 0) {
            setReviewLogs(remoteLogs);
          }

          // 3. Listen to realtime words updates for the user
          unsubscribeWordsRef.current = subscribeToUserWords(
            user.uid,
            (updatedList) => {
              if (updatedList.length > 0) {
                setWords(updatedList);
              }
            },
            (err) => console.warn('Realtime words sync warning:', err)
          );
        } catch (err) {
          console.error('Error during user sign-in sync:', err);
        } finally {
          setIsSyncing(false);
        }
      } else {
        // User logged out: reload local Dexie words
        const localWords = await getAllWords();
        setWords(localWords);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeWordsRef.current) {
        unsubscribeWordsRef.current();
      }
    };
  }, []);

  // Manual sync local words to Firestore
  const handleSyncLocalWords = async (): Promise<number> => {
    if (!currentUser) return 0;
    setIsSyncing(true);
    try {
      const localWords = await getAllWords();
      const count = await syncLocalWordsToFirestore(currentUser.uid, localWords);
      const remoteWords = await fetchUserWordsFromFirestore(currentUser.uid);
      setWords(remoteWords);
      return count;
    } finally {
      setIsSyncing(false);
    }
  };

  // Dark mode handler
  const handleToggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    dbUpdateSettings({ theme: nextMode ? 'dark' : 'light' });
  };

  // Language switch handler (EN / DE)
  const handleLanguageChange = (lang: LanguageCode) => {
    setActiveLanguage(lang);
    dbUpdateSettings({ activeLanguage: lang });
  };

  // Add / update word handler (Saves both locally and in Firestore)
  const handleSaveWord = async (wordToSave: Word) => {
    await saveWord(wordToSave);

    if (currentUser) {
      try {
        await saveWordToFirestore(currentUser.uid, wordToSave);
      } catch (err) {
        console.error('Failed to sync word to Firestore:', err);
      }
    }

    const updatedWords = await getAllWords();
    setWords(updatedWords);
    setIsQuickAddOpen(false);
    setQuickAddInitialWord(null);
  };

  // Open Add modal with optional prefilled word
  const handleOpenAddModal = (initialTerm?: string) => {
    if (initialTerm && typeof initialTerm === 'string') {
      setQuickAddInitialWord({
        id: '',
        word: initialTerm.trim(),
        language: activeLanguage,
        partOfSpeech: 'noun',
        meanings: [],
        examples: [],
        primaryAcademicContext: 'Gündelik & Yaşam',
        synonyms: [],
        antonyms: [],
        relatedWords: [],
        wordFamily: [],
        tags: [],
        dateAdded: new Date().toISOString(),
        nextReviewDate: new Date().toISOString(),
        reviewCount: 0,
        correctCount: 0,
        incorrectCount: 0,
        stabilityDays: 1,
        difficultyFactor: 3,
        lapses: 0,
        streak: 0,
        difficultyRating: 3.5,
        difficultyLabel: 'Medium',
        learningStatus: 'new',
      });
    } else {
      setQuickAddInitialWord(null);
    }
    setIsQuickAddOpen(true);
  };

  // Review completed callback
  const handleCompleteReview = async (updatedWord: Word, feedback: ReviewFeedback, mode: ReviewMode) => {
    await saveWord(updatedWord);
    const log: ReviewLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      wordId: updatedWord.id,
      wordText: updatedWord.word,
      timestamp: new Date().toISOString(),
      feedback,
      previousIntervalDays: updatedWord.stabilityDays || 1,
      newIntervalDays: updatedWord.stabilityDays || 1,
      previousDifficulty: updatedWord.difficultyRating || 5,
      newDifficulty: updatedWord.difficultyRating || 5,
      mode,
    };
    await saveReviewLog(log);

    if (currentUser) {
      try {
        await saveWordToFirestore(currentUser.uid, updatedWord);
        await saveReviewLogToFirestore(currentUser.uid, log);
      } catch (err) {
        console.error('Failed to sync review log to Firestore:', err);
      }
    }

    const [updatedWords, updatedLogs] = await Promise.all([
      getAllWords(),
      getAllReviewLogs(),
    ]);
    setWords(updatedWords);
    setReviewLogs(updatedLogs);
  };

  // Delete word handler (Deletes both locally and from Firestore)
  const handleDeleteWord = async (id: string) => {
    await dbDeleteWord(id);

    if (currentUser) {
      try {
        await deleteWordFromFirestore(currentUser.uid, id);
      } catch (err) {
        console.error('Failed to delete word from Firestore:', err);
      }
    }

    const updatedWords = await getAllWords();
    setWords(updatedWords);
  };

  // Navigate to dictionary with optional category filter
  const handleNavigateToDictionary = (cat?: string) => {
    setContextFilter(cat || null);
    setActivePage('dictionary');
  };

  // Open AI Language Coach Drawer (optionally focused on a word)
  const handleOpenAIChat = (wordToInspect?: Word) => {
    setAiChatWord(wordToInspect || null);
    setIsAIChatOpen(true);
  };

  // Update weekly goal handler
  const handleUpdateWeeklyGoal = (goal: number) => {
    setSettings((prev) => ({ ...prev, weeklyGoal: goal }));
    dbUpdateSettings({ weeklyGoal: goal });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fcfbf9] dark:bg-[#090b0e] flex flex-col items-center justify-center text-slate-500 font-medium">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-serif font-black text-2xl animate-pulse shadow-lg shadow-amber-500/20">
            L
          </div>
        </div>
        <p className="text-sm font-serif mt-4 text-slate-600 dark:text-slate-400 tracking-wide">
          LexiLab hazırlanıyor...
        </p>
      </div>
    );
  }

  const currentLangWordsCount = words.filter(w => w.language === activeLanguage).length;

  return (
    <div className="min-h-screen relative text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      {/* Eye-Friendly Calming Clean Background */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[#faf8f5] dark:bg-[#0e1217] transition-colors duration-300" />

      {/* Modern Global Navbar with EN / DE Switcher & Account/Cloud Button */}
      <Navbar
        activePage={activePage}
        onPageChange={(page) => {
          setIsReviewOpen(false);
          setActivePage(page);
        }}
        activeLanguage={activeLanguage}
        onLanguageChange={handleLanguageChange}
        onOpenAddModal={() => setIsQuickAddOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        wordCount={currentLangWordsCount}
        onOpenAIChat={() => handleOpenAIChat()}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {isReviewOpen ? (
          <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8">
            <ReviewSession
              allWords={words.filter(w => w.language === activeLanguage)}
              onCompleteReview={handleCompleteReview}
              onExit={() => setIsReviewOpen(false)}
            />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activePage === 'home' && (
              <motion.div
                key="page-home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22 }}
                className="flex-1"
              >
                <DashboardView
                  words={words}
                  reviewLogs={reviewLogs}
                  activeLanguage={activeLanguage}
                  onStartReview={() => setIsReviewOpen(true)}
                  onNavigateToReels={() => setActivePage('reels')}
                  onNavigateToDictionary={handleNavigateToDictionary}
                  onNavigateToAnalytics={() => setActivePage('analytics')}
                  onAddNew={() => setIsQuickAddOpen(true)}
                  onSelectWord={(word) => {
                    setContextFilter(word.primaryAcademicContext || null);
                    setActivePage('dictionary');
                  }}
                  onOpenAIChat={handleOpenAIChat}
                  userWeeklyGoal={settings.weeklyGoal}
                  onUpdateWeeklyGoal={handleUpdateWeeklyGoal}
                />
              </motion.div>
            )}

            {activePage === 'analytics' && (
              <motion.div
                key="page-analytics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22 }}
                className="flex-1"
              >
                <AnalyticsView
                  words={words}
                  reviewLogs={reviewLogs}
                  activeLanguage={activeLanguage}
                  onLanguageChange={handleLanguageChange}
                  onStartReview={() => setIsReviewOpen(true)}
                  onNavigateToDictionary={handleNavigateToDictionary}
                  onSelectWord={(word) => {
                    setContextFilter(word.primaryAcademicContext || null);
                    setActivePage('dictionary');
                  }}
                  onOpenAIChat={handleOpenAIChat}
                />
              </motion.div>
            )}

            {activePage === 'dictionary' && (
              <motion.div
                key="page-dictionary"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22 }}
                className="flex-1"
              >
                <DictionaryView
                  words={words}
                  activeLanguage={activeLanguage}
                  onOpenAddModal={() => setIsQuickAddOpen(true)}
                  onDeleteWord={handleDeleteWord}
                  initialContextFilter={contextFilter}
                  onOpenAIChat={handleOpenAIChat}
                />
              </motion.div>
            )}

            {activePage === 'reels' && (
              <motion.div
                key="page-reels"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.22 }}
                className="flex-1"
              >
                <StickyNoteReels
                  words={words}
                  activeLanguage={activeLanguage}
                  onUpdateWord={handleSaveWord}
                  onOpenAIChat={handleOpenAIChat}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Floating AI Coach Button (Quick Accessible Anywhere) */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          id="floating-ai-coach-btn"
          onClick={() => handleOpenAIChat()}
          className="group flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-sans font-semibold text-xs sm:text-sm shadow-xl shadow-amber-500/25 transition-all duration-200 active:scale-95 cursor-pointer hover:shadow-2xl hover:scale-105"
          title="AI Dil Koçunu Aç"
        >
          <div className="w-5 h-5 flex items-center justify-center">
            <Bot className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          </div>
          <span className="tracking-wide">AI Dil Koçu</span>
        </button>
      </div>

      {/* Quick Add Word Modal */}
      <QuickAddWordModal
        isOpen={isQuickAddOpen}
        onClose={() => {
          setIsQuickAddOpen(false);
          setQuickAddInitialWord(null);
        }}
        onSave={handleSaveWord}
        initialWord={quickAddInitialWord}
        activeLanguage={activeLanguage}
      />

      {/* Dedicated AI Language Coach Chat & Word Deep-Dive Drawer with user words & analytics */}
      <AIChatDrawer
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        word={aiChatWord}
        activeLanguage={activeLanguage}
        allWords={words}
        reviewLogs={reviewLogs}
      />

      {/* Google Auth & Firestore Cloud Sync Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onSyncLocalWords={handleSyncLocalWords}
        isSyncing={isSyncing}
        totalWordsCount={words.length}
      />
    </div>
  );
}

