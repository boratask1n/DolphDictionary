import { LanguageCode } from '../types';

class SpeechService {
  private voices: SpeechSynthesisVoice[] = [];
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.initVoices();
      };
    }
  }

  private initVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.voices = window.speechSynthesis.getVoices();
      this.isInitialized = this.voices.length > 0;
    }
  }

  public speak(
    text: string,
    language: LanguageCode,
    accent: 'us' | 'uk' | 'de' = 'us'
  ): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel(); // Stop any pending speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.88; // Slightly measured academic pace for clarity
      utterance.pitch = 1.0;

      let langTag = 'en-US';
      if (language === 'de') {
        langTag = 'de-DE';
      } else if (accent === 'uk') {
        langTag = 'en-GB';
      } else {
        langTag = 'en-US';
      }

      utterance.lang = langTag;

      if (!this.isInitialized) {
        this.initVoices();
      }

      // Try to find the best voice matching language
      const matchingVoice = this.voices.find(
        (v) => v.lang.toLowerCase().startsWith(langTag.toLowerCase()) || v.lang.replace('_', '-').toLowerCase() === langTag.toLowerCase()
      );

      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  }
}

export const speechService = new SpeechService();
