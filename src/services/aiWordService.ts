import { LanguageCode, PartOfSpeech, CEFRLevel } from '../types';

export interface AIGeneratedWordData {
  word: string;
  meaning: string;
  partOfSpeech: PartOfSpeech;
  cefrLevel: CEFRLevel;
  domainCategory: string;
  secondaryMeanings: string[];
  exampleSentence: string;
  exampleTranslation: string;
  tags: string[];
}

export async function generateWordDataWithAI(params: {
  word: string;
  language: LanguageCode;
  existingMeaning?: string;
  category?: string;
}): Promise<AIGeneratedWordData> {
  const response = await fetch('/api/gemini/generate-word-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.details || `AI sunucu hatası (${response.status})`);
  }

  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Yapay zeka yanıtı alınamadı.');
  }

  return result.data as AIGeneratedWordData;
}
