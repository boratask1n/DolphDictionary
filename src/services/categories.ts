import { Word } from '../types';

export const DEFAULT_CATEGORIES: string[] = [
  'Gündelik & Yaşam',
  'İş & Kariyer',
  'Kültür & Medya',
  'Akademik & Bilim',
  'Felsefe & Düşünce',
];

const STORAGE_KEY = 'lexilab_custom_categories';

export function getCustomCategories(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomCategories(categories: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    window.dispatchEvent(new CustomEvent('lexilab:categories-updated', { detail: categories }));
  } catch (err) {
    console.error('Failed to save custom categories:', err);
  }
}

export function addCustomCategory(newCategoryName: string): string[] {
  const trimmed = newCategoryName.trim();
  if (!trimmed) return getCustomCategories();

  const current = getCustomCategories();
  // Don't re-add if already exists in defaults or custom
  if (DEFAULT_CATEGORIES.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
    return current;
  }
  if (!current.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
    const updated = [...current, trimmed];
    saveCustomCategories(updated);
    return updated;
  }
  return current;
}

export function deleteCustomCategory(categoryNameToDelete: string): string[] {
  const current = getCustomCategories();
  const updated = current.filter(c => c.toLowerCase() !== categoryNameToDelete.trim().toLowerCase());
  saveCustomCategories(updated);
  return updated;
}

export function getAllCategories(existingWords: Word[] = []): string[] {
  const set = new Set<string>(DEFAULT_CATEGORIES);

  // Add custom categories
  const custom = getCustomCategories();
  custom.forEach(c => {
    if (c.trim()) set.add(c.trim());
  });

  // Add any categories present in current words
  existingWords.forEach(w => {
    if (w.domainCategory && w.domainCategory.trim()) {
      set.add(w.domainCategory.trim());
    }
    if (w.primaryAcademicContext && w.primaryAcademicContext.trim()) {
      set.add(w.primaryAcademicContext.trim());
    }
  });

  return Array.from(set);
}
