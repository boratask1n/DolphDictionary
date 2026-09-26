import { LanguageCode } from '../types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  contextWord?: string;
}

export interface WordExplanationResponse {
  success: boolean;
  word: string;
  language: LanguageCode;
  explanation: string;
  error?: string;
}

export interface ChatResponse {
  success: boolean;
  reply: string;
  error?: string;
}

/**
 * Request detailed word breakdown & pedagogical examples from Gemini
 */
export async function explainWordWithAI(
  word: string,
  language: LanguageCode,
  currentMeaning?: string,
  context?: string
): Promise<WordExplanationResponse> {
  try {
    const res = await fetch('/api/gemini/word-explain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        word,
        language,
        currentMeaning,
        context,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Kelime analizi alınamadı.');
    }

    return {
      success: true,
      word,
      language,
      explanation: data.explanation,
    };
  } catch (error: any) {
    console.error('explainWordWithAI failed:', error);
    return {
      success: false,
      word,
      language,
      explanation: '',
      error: error?.message || 'Yapay zeka servisine erişilemedi.',
    };
  }
}

export interface UserVocabContext {
  activeLanguage: LanguageCode;
  totalWords: number;
  masteredWords: string[];
  learningWords: string[];
  difficultWords: string[];
  recentWords: string[];
  accuracyRate?: number;
  streak?: number;
}

/**
 * Send a chat message to the Language Coach (supports multi-turn history & user vocab analytics)
 */
export async function sendChatMessageToAI(
  message: string,
  history: ChatMessage[],
  language: LanguageCode,
  contextWord?: string,
  userContext?: UserVocabContext
): Promise<ChatResponse> {
  try {
    // Format history for server
    const serverHistory = history.map((msg) => ({
      role: msg.role === 'model' ? 'model' : 'user',
      content: msg.content,
    }));

    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        history: serverHistory,
        language,
        contextWord,
        userContext,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Yanıt alınamadı.');
    }

    return {
      success: true,
      reply: data.reply,
    };
  } catch (error: any) {
    console.error('sendChatMessageToAI failed:', error);
    return {
      success: false,
      reply: '',
      error: error?.message || 'Yapay zeka ile bağlantı kurulamadı.',
    };
  }
}
