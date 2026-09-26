/**
 * Language pronunciation helper & phonetic IPA generator
 * Uses Web Speech API with language-specific voice prioritization
 * and provides approximate IPA transcriptions when missing.
 */
import { LanguageCode } from '../types';

/**
 * Approximate phonetic IPA generator for English and German words
 * when offline or without explicit dictionary entries.
 */
export function generateApproximateIPA(word: string, language: LanguageCode): string {
  const clean = word.trim().toLowerCase();
  if (!clean) return '';

  if (language === 'de') {
    // German phonetic approximation rules
    let ipa = clean
      .replace(/sch/g, 'ʃ')
      .replace(/ch/g, 'ç')
      .replace(/ei|ey/g, 'aɪ̯')
      .replace(/eu|äu/g, 'ɔɪ̯')
      .replace(/ie/g, 'iː')
      .replace(/au/g, 'aʊ̯')
      .replace(/qu/g, 'kv')
      .replace(/sp/g, 'ʃp')
      .replace(/st/g, 'ʃt')
      .replace(/v/g, 'f')
      .replace(/w/g, 'v')
      .replace(/z/g, 'ts')
      .replace(/ä/g, 'ɛː')
      .replace(/ö/g, 'øː')
      .replace(/ü/g, 'yː')
      .replace(/ß/g, 's');
    return `/${ipa}/`;
  }

  // English approximation
  let ipa = clean
    .replace(/tion/g, 'ʃən')
    .replace(/sion/g, 'ʒən')
    .replace(/ph/g, 'f')
    .replace(/igh/g, 'aɪ')
    .replace(/ee|ea/g, 'iː')
    .replace(/oo/g, 'uː')
    .replace(/th/g, 'θ')
    .replace(/ch/g, 'tʃ')
    .replace(/sh/g, 'ʃ');
  
  return `/${ipa}/`;
}

/**
 * Pronounces a word using browser SpeechSynthesis with optimal language voice selection
 */
export function speakWord(
  text: string, 
  language: LanguageCode, 
  onStart?: () => void, 
  onEnd?: () => void
): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set appropriate BCP-47 language tag
    utterance.lang = language === 'de' ? 'de-DE' : 'en-US';
    utterance.rate = 0.88; // Slightly deliberate for clear learner comprehension
    utterance.pitch = 1.0;

    // Try to pick a natural high-quality voice if available
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const preferredVoice = voices.find(v => 
        (language === 'de' ? v.lang.startsWith('de') : (v.lang.startsWith('en-US') || v.lang.startsWith('en-GB'))) &&
        (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Neural') || v.name.includes('Premium'))
      ) || voices.find(v => language === 'de' ? v.lang.startsWith('de') : v.lang.startsWith('en'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    }

    if (onStart) utterance.onstart = onStart;
    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.error('Speech synthesis error:', err);
    if (onEnd) onEnd();
    return false;
  }
}
