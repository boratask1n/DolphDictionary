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
import { ChatSessionsView } from './components/ai/ChatSessionsView';
import { 
  initializeDatabase, 
  getAllWords, 
  getSettings, 
  saveWord, 
  deleteWord as dbDeleteWord, 
  updateSettings as dbUpdateSettings,
  getAllReviewLogs,
  saveReviewLog,
  clearLocalUserData,
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
  subscribeToUserWords
} from './services/firestoreSync';
import { deleteUserDataFromFirestore } from './services/firestoreSync';
import { deleteCurrentUser, reauthenticateCurrentUser } from './services/firebase';
import {
  fetchUserChatSessionsFromFirestore,
  saveChatSessionToFirestore,
  deleteChatSessionFromFirestore,
} from './services/firestoreSync';
import { ChatMessage, ChatSession, MAX_ACTIVE_CHATS_PER_LANGUAGE } from './services/aiTutorService';
import { Word, UserSettings, LanguageCode, ReviewLog, ReviewFeedback, ReviewMode } from './types';
import { normalizeWordForComparison } from './utils/wordNormalization';

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
  const [dictionarySearchQuery, setDictionarySearchQuery] = useState('');
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [aiChatWord, setAiChatWord] = useState<Word | null>(null);
  const [chatSessions, setChatSessions] = useState<Record<LanguageCode, ChatSession[]>>(() => {
    return { en: [], de: [] };
  });
  const [activeChatIds, setActiveChatIds] = useState<Record<LanguageCode, string | null>>({ en: null, de: null });
  const [chatSyncReady, setChatSyncReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const previousChatSessionsRef = useRef<Record<LanguageCode, ChatSession[]>>({ en: [], de: [] });
  const authSyncGenerationRef = useRef(0);

  const createChatSession = useCallback((language: LanguageCode): ChatSession | null => {
    const existing = chatSessions[language];
    if (existing.length >= MAX_ACTIVE_CHATS_PER_LANGUAGE) return null;
    const session: ChatSession = {
      id: `${language}-${Date.now()}`,
      language,
      title: language === 'de' ? 'Almanca sohbeti' : 'İngilizce sohbeti',
      messages: [{
        id: `welcome-${Date.now()}`,
        role: 'model',
        content: `Merhaba! Ben LexiLab dil koçun. ${language === 'de' ? 'Almanca' : 'İngilizce'} kelimeler, cümleler ve pratik hakkında istediğini sorabilirsin.`,
        timestamp: new Date().toISOString(),
      }],
      updatedAt: new Date().toISOString(),
    };
    setChatSessions((prev) => ({ ...prev, [language]: [...prev[language], session] }));
    setActiveChatIds((prev) => ({ ...prev, [language]: session.id }));
    return session;
  }, [chatSessions]);

  useEffect(() => {
    if (currentUser && chatSyncReady) {
      localStorage.setItem(`lexilab-ai-chats:${currentUser.uid}`, JSON.stringify(chatSessions));
    }
    if (!currentUser || !chatSyncReady) {
      previousChatSessionsRef.current = chatSessions;
      return;
    }

    const previous = previousChatSessionsRef.current;
    for (const language of ['en', 'de'] as const) {
      const previousById = new Map(previous[language].map((chat) => [chat.id, chat]));
      const currentById = new Map(chatSessions[language].map((chat) => [chat.id, chat]));
      for (const chat of chatSessions[language]) {
        const oldChat = previousById.get(chat.id);
        if (!oldChat || oldChat.updatedAt !== chat.updatedAt) {
          void saveChatSessionToFirestore(currentUser.uid, chat);
        }
      }
      for (const oldChat of previous[language]) {
        if (!currentById.has(oldChat.id)) {
          void deleteChatSessionFromFirestore(currentUser.uid, oldChat.id);
        }
      }
    }
    previousChatSessionsRef.current = chatSessions;
  }, [chatSessions, currentUser, chatSyncReady]);

  useEffect(() => {
    if (!chatSyncReady) return;
    if (chatSessions[activeLanguage].length > 0 && (!activeChatIds[activeLanguage] || !chatSessions[activeLanguage].some((chat) => chat.id === activeChatIds[activeLanguage]))) {
      setActiveChatIds((prev) => ({ ...prev, [activeLanguage]: chatSessions[activeLanguage][0].id }));
    }
  }, [activeLanguage, chatSessions, activeChatIds, chatSyncReady]);

  const activeChat = chatSessions[activeLanguage].find((chat) => chat.id === activeChatIds[activeLanguage]) || chatSessions[activeLanguage][0];
  const updateActiveChatMessages = (messages: ChatMessage[]) => {
    if (!activeChat) return;
    setChatSessions((prev) => ({
      ...prev,
      [activeLanguage]: prev[activeLanguage].map((chat) => chat.id === activeChat.id
        ? { ...chat, messages, updatedAt: new Date().toISOString(), title: messages.find((message) => message.role === 'user')?.content.slice(0, 42) || chat.title }
        : chat),
    }));
  };
  const handleCreateChat = () => {
    const created = createChatSession(activeLanguage);
    if (created) {
      setActivePage('chats');
    }
  };
  const handleDeleteChat = (id: string) => {
    setChatSessions((prev) => ({ ...prev, [activeLanguage]: prev[activeLanguage].filter((chat) => chat.id !== id) }));
    if (activeChatIds[activeLanguage] === id) setActiveChatIds((prev) => ({ ...prev, [activeLanguage]: null }));
  };

  // Authentication & Cloud Sync State
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
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
      const syncGeneration = ++authSyncGenerationRef.current;
      const isCurrentAuthSync = () =>
        authSyncGenerationRef.current === syncGeneration &&
        auth.currentUser?.uid === user?.uid;

      setCurrentUser(user);
      setIsAuthResolved(true);
      previousChatSessionsRef.current = { en: [], de: [] };
      
      // Cleanup previous firestore subscription if any
      if (unsubscribeWordsRef.current) {
        unsubscribeWordsRef.current();
        unsubscribeWordsRef.current = null;
      }

      if (user) {
        setIsSyncing(true);
        setSyncError(null);
        setChatSyncReady(false);
        try {
          const previousUserId = localStorage.getItem('lexilab-active-user-id');
          if (previousUserId !== user.uid) {
            await clearLocalUserData();
            localStorage.removeItem('lexilab-ai-chats');
          }
          if (!isCurrentAuthSync()) return;
          localStorage.setItem('lexilab-active-user-id', user.uid);
          const storedChats = localStorage.getItem(`lexilab-ai-chats:${user.uid}`);
          setChatSessions(storedChats ? JSON.parse(storedChats) : { en: [], de: [] });
          setActiveChatIds({ en: null, de: null });
          setWords([]);
          setReviewLogs([]);

          // 1. Sync User profile doc in Firestore
          await syncUserProfile(user);
          if (!isCurrentAuthSync()) return;

          // 2. Merge local and cloud data so newly added words are not lost
          const remoteWords = await fetchUserWordsFromFirestore(user.uid);
          const remoteLogs = await fetchUserReviewLogsFromFirestore(user.uid);
          if (!isCurrentAuthSync()) return;
          const localWords = await getAllWords();
          const remoteWordsById = new Map(remoteWords.map((word) => [word.id, word]));
          const mergedWords = new Map(remoteWords.map((word) => [word.id, word]));

          for (const localWord of localWords) {
            const remoteWord = remoteWordsById.get(localWord.id);
            const localTimestamp = Date.parse(localWord.lastReviewed || localWord.dateAdded || '');
            const remoteTimestamp = Date.parse(remoteWord?.lastReviewed || remoteWord?.dateAdded || '');
            if (!remoteWord || localTimestamp >= remoteTimestamp) {
              mergedWords.set(localWord.id, localWord);
              await saveWordToFirestore(user.uid, localWord);
              if (!isCurrentAuthSync()) return;
            }
          }

          const mergedWordList = [...mergedWords.values()];
          setWords(mergedWordList);
          for (const word of mergedWordList) {
            await saveWord(word);
          }

          const remoteLogsById = new Map(remoteLogs.map((log) => [log.id, log]));
          const localLogs = await getAllReviewLogs();
          const mergedLogs = new Map(remoteLogs.map((log) => [log.id, log]));
          for (const localLog of localLogs) {
            if (!remoteLogsById.has(localLog.id)) {
              mergedLogs.set(localLog.id, localLog);
              await saveReviewLogToFirestore(user.uid, localLog);
            }
          }
          const mergedLogList = [...mergedLogs.values()];
          setReviewLogs(mergedLogList);
          for (const log of mergedLogList) {
            await saveReviewLog(log);
          }

          const remoteChats = await fetchUserChatSessionsFromFirestore(user.uid);
          if (!isCurrentAuthSync()) return;
          if (remoteChats.length > 0) {
            const byLanguage = {
              en: remoteChats.filter((chat) => chat.language === 'en'),
              de: remoteChats.filter((chat) => chat.language === 'de'),
            };
            setChatSessions(byLanguage);
            setActiveChatIds({
              en: byLanguage.en[0]?.id || null,
              de: byLanguage.de[0]?.id || null,
            });
          }
          setChatSyncReady(true);

          // 3. Listen to realtime words updates for the user
          unsubscribeWordsRef.current = subscribeToUserWords(
            user.uid,
            (updatedList) => {
              if (!isCurrentAuthSync()) return;
              setWords(updatedList);
              void Promise.all(updatedList.map((word) => saveWord(word)));
            },
            (err) => console.warn('Realtime words sync warning:', err)
          );
        } catch (err) {
          if (!isCurrentAuthSync()) return;
          console.error('Error during user sign-in sync:', err);
          setSyncError(`Bulut kayıtları yüklenemedi: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
          if (isCurrentAuthSync()) setIsSyncing(false);
        }
      } else {
        // Keep the signed-out state empty; vocabulary belongs to the
        // authenticated user's Firestore account.
        await clearLocalUserData();
        localStorage.removeItem('lexilab-active-user-id');
        setWords([]);
        setReviewLogs([]);
        setChatSessions({ en: [], de: [] });
        setActiveChatIds({ en: null, de: null });
        localStorage.removeItem('lexilab-ai-chats');
        setChatSyncReady(false);
        setIsSyncing(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeWordsRef.current) {
        unsubscribeWordsRef.current();
      }
    };
  }, []);

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
    setAiChatWord(null);
    setIsAIChatOpen(false);
    dbUpdateSettings({ activeLanguage: lang });
  };

  // Add / update word handler (Saves both locally and in Firestore)
  const handleSaveWord = async (wordToSave: Word) => {
    const accountWord = currentUser ? { ...wordToSave, userId: currentUser.uid } : wordToSave;
    await saveWord(accountWord);

    if (currentUser) {
      try {
        await saveWordToFirestore(currentUser.uid, accountWord);
        setSyncError(null);
      } catch (err) {
        console.error('Failed to sync word to Firestore:', err);
        setSyncError(`Kelime bu cihazda kaydedildi ancak buluta gönderilemedi: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    const updatedWords = await getAllWords();
    setWords(updatedWords.map((word) => currentUser ? { ...word, userId: currentUser.uid } : word));
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

  const handleDuplicateWord = (word: Word) => {
    setDictionarySearchQuery(normalizeWordForComparison(word.word));
    setContextFilter(null);
    setActivePage('dictionary');
    setIsQuickAddOpen(false);
  };

  // Review completed callback
  const handleCompleteReview = async (updatedWord: Word, feedback: ReviewFeedback, mode: ReviewMode) => {
    const accountWord = currentUser ? { ...updatedWord, userId: currentUser.uid } : updatedWord;
    await saveWord(accountWord);
    const log: ReviewLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: currentUser?.uid,
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
        await saveWordToFirestore(currentUser.uid, accountWord);
        await saveReviewLogToFirestore(currentUser.uid, { ...log, userId: currentUser.uid });
        setSyncError(null);
      } catch (err) {
        console.error('Failed to sync review log to Firestore:', err);
        setSyncError('Tekrar kaydı bu cihazda tutuldu ancak buluta gönderilemedi.');
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

  const handleDeleteAccount = async (password?: string) => {
    if (!currentUser) return;
    await reauthenticateCurrentUser(password);
    await deleteUserDataFromFirestore(currentUser.uid);
    await deleteCurrentUser();
  };

  // Navigate to dictionary with optional category filter
  const handleNavigateToDictionary = (cat?: string) => {
    setContextFilter(cat || null);
    setActivePage('dictionary');
  };

  // Open AI Language Coach Drawer (optionally focused on a word)
  const handleOpenAIChat = (wordToInspect?: Word) => {
    if (!activeChat) {
      createChatSession(activeLanguage);
    }
    setAiChatWord(wordToInspect || null);
    setIsAIChatOpen(true);
  };

  // Update weekly goal handler
  const handleUpdateWeeklyGoal = (goal: number) => {
    setSettings((prev) => ({ ...prev, weeklyGoal: goal }));
    dbUpdateSettings({ weeklyGoal: goal });
  };

  if (isLoading || !isAuthResolved) {
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

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#fcfbf9] dark:bg-[#090b0e]">
        <AuthModal
          isOpen
          isRequired
          onClose={() => undefined}
          currentUser={null}
          totalWordsCount={0}
        />
      </div>
    );
  }

  const currentLangWordsCount = words.filter(w => w.language === activeLanguage).length;

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden relative text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      {/* Eye-Friendly Calming Clean Background */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[#faf8f5] dark:bg-[#0e1217] transition-colors duration-300" />
      {syncError && (
        <div className="fixed top-20 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800 shadow-lg dark:border-rose-900/60 dark:bg-rose-950/80 dark:text-rose-200">
          <div className="flex items-start justify-between gap-3">
            <span>{syncError}</span>
            <button
              type="button"
              onClick={() => setSyncError(null)}
              className="shrink-0 text-rose-500 hover:text-rose-700 dark:hover:text-rose-100"
              aria-label="Senkronizasyon bildirimini kapat"
            >
              ×
            </button>
          </div>
        </div>
      )}

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
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
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
                  initialSearchQuery={dictionarySearchQuery}
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
            {activePage === 'chats' && (
              <ChatSessionsView
                sessions={chatSessions[activeLanguage]}
                activeLanguage={activeLanguage}
                activeSessionId={activeChat?.id || ''}
                canCreate={chatSessions[activeLanguage].length < MAX_ACTIVE_CHATS_PER_LANGUAGE}
                onSelect={(id) => setActiveChatIds((prev) => ({ ...prev, [activeLanguage]: id }))}
                onCreate={handleCreateChat}
                onDelete={handleDeleteChat}
                onOpen={() => setIsAIChatOpen(true)}
              />
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
        existingWords={words}
        onDuplicateWord={handleDuplicateWord}
      />

      {/* Dedicated AI Language Coach Chat & Word Deep-Dive Drawer with user words & analytics */}
      <AIChatDrawer
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        word={aiChatWord}
        activeLanguage={activeLanguage}
        allWords={words}
        reviewLogs={reviewLogs}
        messages={activeChat?.messages || []}
        onMessagesChange={updateActiveChatMessages}
        onNewChat={handleCreateChat}
        chatCount={chatSessions[activeLanguage].length}
      />

      {/* Google Auth & Firestore Cloud Sync Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onDeleteAccount={handleDeleteAccount}
        totalWordsCount={words.length}
      />
    </div>
  );
}
