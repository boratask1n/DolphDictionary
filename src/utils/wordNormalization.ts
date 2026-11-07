import { LanguageCode } from '../types';

export function normalizeWordForComparison(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('en-US')
    .normalize('NFKC')
    .replace(/[’']/g, '')
    .replace(/\s+/g, ' ');
}

function englishRootCandidates(value: string): string[] {
  if (value.includes(' ') || !/^[a-z]+$/i.test(value)) return [];

  const lower = value.toLocaleLowerCase('en-US');
  const candidates: string[] = [];
  if (lower.endsWith('ies') && lower.length > 4) candidates.push(`${lower.slice(0, -3)}y`);
  if (lower.endsWith('es') && lower.length > 4 && /(?:s|x|z|ch|sh|o)es$/.test(lower)) {
    candidates.push(lower.slice(0, -2));
  } else if (lower.endsWith('s') && lower.length > 3) {
    candidates.push(lower.slice(0, -1));
  }
  if (lower.endsWith('ied') && lower.length > 5) candidates.push(`${lower.slice(0, -3)}y`);
  if (lower.endsWith('ed') && lower.length > 4) {
    const stem = lower.slice(0, -2);
    candidates.push(stem.endsWith(stem.at(-1)?.repeat(2) || '') ? stem.slice(0, -1) : stem);
  }
  if (lower.endsWith('ing') && lower.length > 5) {
    const stem = lower.slice(0, -3);
    candidates.push(stem.length > 2 && stem.at(-1) === stem.at(-2) ? stem.slice(0, -1) : stem);
  }
  return candidates.filter((candidate) => candidate.length >= 3);
}

export function getWordComparisonKeys(value: string, language: LanguageCode): string[] {
  const normalized = normalizeWordForComparison(value);
  if (!normalized) return [];
  const keys = [normalized];
  if (language === 'en') {
    for (const candidate of englishRootCandidates(normalized)) {
      if (!keys.includes(candidate)) keys.push(candidate);
    }
  }
  return keys;
}

export function getCanonicalWord(value: string, language: LanguageCode): string {
  const normalized = normalizeWordForComparison(value);
  if (language !== 'en' || normalized.includes(' ')) return value.trim();
  const roots = englishRootCandidates(normalized);
  return roots.length > 0 ? roots[0] : value.trim();
}
