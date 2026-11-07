import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, FirebaseUser } from './firebase';
import { Word, ReviewLog, UserSettings, LanguageCode } from '../types';
import { ChatSession } from './aiTutorService';

function removeUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => removeUndefined(item)) as T;
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, removeUndefined(item)])
    ) as T;
  }
  return value;
}

/**
 * Ensure user document exists in Firestore
 */
export async function syncUserProfile(user: FirebaseUser): Promise<void> {
  const path = `users/${user.uid}`;
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const existing = await getDoc(userDocRef);
    const now = new Date().toISOString();

    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'Kullanıcı',
      photoURL: user.photoURL || '',
      ...(existing.exists() ? {} : { createdAt: now }),
      lastLoginAt: now,
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetch all words for a user from Firestore
 */
export async function fetchUserWordsFromFirestore(userId: string): Promise<Word[]> {
  const path = `users/${userId}/words`;
  try {
    const wordsCol = collection(db, 'users', userId, 'words');
    const snapshot = await getDocs(wordsCol);
    const words: Word[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      words.push(data as Word);
    });
    return words;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Save or update a single word in Firestore
 */
export async function saveWordToFirestore(userId: string, word: Word): Promise<void> {
  const wordId = word.id || `w-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const path = `users/${userId}/words/${wordId}`;
  try {
    const wordRef = doc(db, 'users', userId, 'words', wordId);
    const sanitizedWord: Word = {
      ...word,
      id: wordId,
      userId: userId,
      word: word.word.trim(),
      language: word.language,
      partOfSpeech: word.partOfSpeech || 'noun',
      meanings: word.meanings || [],
      examples: word.examples || [],
      synonyms: word.synonyms || [],
      antonyms: word.antonyms || [],
      relatedWords: word.relatedWords || [],
      wordFamily: word.wordFamily || [],
      tags: word.tags || [],
      dateAdded: word.dateAdded || new Date().toISOString(),
      nextReviewDate: word.nextReviewDate || new Date().toISOString(),
      difficultyRating: Number(word.difficultyRating || 3.5),
      stabilityDays: Number(word.stabilityDays || 1),
      difficultyFactor: Number(word.difficultyFactor || 3),
      reviewCount: Number(word.reviewCount || 0),
      correctCount: Number(word.correctCount || 0),
      incorrectCount: Number(word.incorrectCount || 0),
      lapses: Number(word.lapses || 0),
      streak: Number(word.streak || 0),
    };

    await setDoc(wordRef, removeUndefined(sanitizedWord), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete a word from Firestore
 */
export async function deleteWordFromFirestore(userId: string, wordId: string): Promise<void> {
  const path = `users/${userId}/words/${wordId}`;
  try {
    const wordRef = doc(db, 'users', userId, 'words', wordId);
    await deleteDoc(wordRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Save a review log to Firestore
 */
export async function saveReviewLogToFirestore(userId: string, log: ReviewLog): Promise<void> {
  const logId = log.id || `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const path = `users/${userId}/reviewLogs/${logId}`;
  try {
    const logRef = doc(db, 'users', userId, 'reviewLogs', logId);
    const payload = {
      ...log,
      id: logId,
      userId,
    };
    await setDoc(logRef, removeUndefined(payload));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Fetch all review logs for a user from Firestore
 */
export async function fetchUserReviewLogsFromFirestore(userId: string): Promise<ReviewLog[]> {
  const path = `users/${userId}/reviewLogs`;
  try {
    const logsCol = collection(db, 'users', userId, 'reviewLogs');
    const snapshot = await getDocs(logsCol);
    const logs: ReviewLog[] = [];
    snapshot.forEach((docSnap) => {
      logs.push(docSnap.data() as ReviewLog);
    });
    return logs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function fetchUserChatSessionsFromFirestore(userId: string): Promise<ChatSession[]> {
    const path = `users/${userId}/chatSessions`;
    try {
      const snapshot = await getDocs(collection(db, 'users', userId, 'chatSessions'));
      return snapshot.docs
        .map((item) => item.data() as ChatSession)
        .filter((chat) => chat.language === 'en' || chat.language === 'de')
        .map((chat) => ({
          ...chat,
          messages: Array.isArray(chat.messages) ? chat.messages.slice(-50) : [],
        }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
  }
}

export async function saveChatSessionToFirestore(userId: string, chat: ChatSession): Promise<void> {
    const chatId = chat.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const path = `users/${userId}/chatSessions/${chatId}`;
    try {
      const chatRef = doc(db, 'users', userId, 'chatSessions', chatId);
      await setDoc(chatRef, removeUndefined({
        id: chatId,
        userId,
        language: chat.language,
        title: chat.title.slice(0, 120),
        messages: chat.messages.slice(-50),
        updatedAt: chat.updatedAt,
      }), { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
}

export async function deleteChatSessionFromFirestore(userId: string, chatId: string): Promise<void> {
    const safeId = chatId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const path = `users/${userId}/chatSessions/${safeId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'chatSessions', safeId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
}

export async function deleteUserDataFromFirestore(userId: string): Promise<void> {
      const subcollections = ['words', 'reviewLogs', 'chatSessions', 'settings'];
      for (const subcollection of subcollections) {
        const snapshot = await getDocs(collection(db, 'users', userId, subcollection));
        if (snapshot.empty) continue;
        const batch = writeBatch(db);
        snapshot.docs.forEach((item) => batch.delete(item.ref));
        await batch.commit();
      }
      await deleteDoc(doc(db, 'users', userId));
}

/**
 * Batch upload / sync local words into user's Firestore (e.g. on first login)
 */
export async function syncLocalWordsToFirestore(userId: string, localWords: Word[]): Promise<number> {
  if (localWords.length === 0) return 0;
  let count = 0;
  
  // Firestore batch limit is 500
  const chunks: Word[][] = [];
  for (let i = 0; i < localWords.length; i += 400) {
    chunks.push(localWords.slice(i, i + 400));
  }

  for (const chunk of chunks) {
    const batch = writeBatch(db);
    for (const w of chunk) {
      const wId = w.id.replace(/[^a-zA-Z0-9_\-]/g, '_');
      const wRef = doc(db, 'users', userId, 'words', wId);
      const payload: Word = {
        ...w,
        id: wId,
        userId,
        dateAdded: w.dateAdded || new Date().toISOString(),
        nextReviewDate: w.nextReviewDate || new Date().toISOString(),
      };
      batch.set(wRef, removeUndefined(payload), { merge: true });
      count++;
    }
    await batch.commit();
  }
  return count;
}

/**
 * Subscribe to realtime updates of user words
 */
export function subscribeToUserWords(
  userId: string,
  onUpdate: (words: Word[]) => void,
  onError: (err: unknown) => void
) {
  const path = `users/${userId}/words`;
  const wordsCol = collection(db, 'users', userId, 'words');

  return onSnapshot(
    wordsCol,
    (snapshot) => {
      const words: Word[] = [];
      snapshot.forEach((docSnap) => {
        words.push(docSnap.data() as Word);
      });
      onUpdate(words);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      onError(error);
    }
  );
}
