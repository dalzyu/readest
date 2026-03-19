import type { VocabularyEntry, TranslationResult } from './types';
import { vocabularyStore } from './vocabularyStore';

type NewEntry = Omit<VocabularyEntry, 'id' | 'addedAt' | 'reviewCount'> &
  Partial<Pick<VocabularyEntry, 'id' | 'addedAt' | 'reviewCount'>>;

export async function saveVocabularyEntry(input: NewEntry): Promise<VocabularyEntry> {
  const entry: VocabularyEntry = {
    id: input.id ?? crypto.randomUUID(),
    bookHash: input.bookHash,
    term: input.term,
    context: input.context,
    result: input.result as TranslationResult,
    addedAt: input.addedAt ?? Date.now(),
    reviewCount: input.reviewCount ?? 0,
  };
  await vocabularyStore.save(entry);
  return entry;
}

export async function getVocabularyForBook(bookHash: string): Promise<VocabularyEntry[]> {
  return vocabularyStore.getByBook(bookHash);
}

export async function getAllVocabulary(): Promise<VocabularyEntry[]> {
  return vocabularyStore.getAll();
}

export async function deleteVocabularyEntry(id: string): Promise<void> {
  return vocabularyStore.delete(id);
}

export async function searchVocabulary(query: string): Promise<VocabularyEntry[]> {
  return vocabularyStore.search(query);
}
