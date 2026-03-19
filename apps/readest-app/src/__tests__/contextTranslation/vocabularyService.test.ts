import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { VocabularyEntry } from '@/services/contextTranslation/types';

// Mock the store so tests don't touch IndexedDB
vi.mock('@/services/contextTranslation/vocabularyStore', () => ({
  vocabularyStore: {
    save: vi.fn(),
    getByBook: vi.fn(),
    getAll: vi.fn(),
    delete: vi.fn(),
    search: vi.fn(),
  },
}));

import { vocabularyStore } from '@/services/contextTranslation/vocabularyStore';
import {
  saveVocabularyEntry,
  getVocabularyForBook,
  getAllVocabulary,
  deleteVocabularyEntry,
  searchVocabulary,
} from '@/services/contextTranslation/vocabularyService';

const mockStore = vi.mocked(vocabularyStore);

const sampleEntry: VocabularyEntry = {
  id: 'abc-123',
  bookHash: 'book-xyz',
  term: '知己',
  context: 'He finally found a true 知己 among his companions.',
  result: { translation: 'close friend', contextualMeaning: 'A soulmate who understands you.' },
  addedAt: 1700000000000,
  reviewCount: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('saveVocabularyEntry', () => {
  test('generates an id and timestamp if not provided, then saves', async () => {
    mockStore.save.mockResolvedValueOnce(undefined);

    const saved = await saveVocabularyEntry({
      bookHash: 'book-xyz',
      term: '知己',
      context: 'some context',
      result: { translation: 'close friend' },
    });

    expect(mockStore.save).toHaveBeenCalledOnce();
    const arg = mockStore.save.mock.calls[0]![0] as VocabularyEntry;
    expect(arg.id).toBeTruthy();
    expect(arg.addedAt).toBeGreaterThan(0);
    expect(arg.reviewCount).toBe(0);
    expect(arg.term).toBe('知己');
    expect(saved.id).toBe(arg.id);
  });

  test('saves with provided id and timestamp when given', async () => {
    mockStore.save.mockResolvedValueOnce(undefined);

    await saveVocabularyEntry(sampleEntry);

    const arg = mockStore.save.mock.calls[0]![0] as VocabularyEntry;
    expect(arg.id).toBe('abc-123');
    expect(arg.addedAt).toBe(1700000000000);
  });
});

describe('getVocabularyForBook', () => {
  test('returns entries for the given book hash', async () => {
    mockStore.getByBook.mockResolvedValueOnce([sampleEntry]);

    const result = await getVocabularyForBook('book-xyz');

    expect(mockStore.getByBook).toHaveBeenCalledWith('book-xyz');
    expect(result).toHaveLength(1);
    expect(result[0]!.term).toBe('知己');
  });

  test('returns empty array when book has no entries', async () => {
    mockStore.getByBook.mockResolvedValueOnce([]);
    const result = await getVocabularyForBook('unknown-book');
    expect(result).toEqual([]);
  });
});

describe('getAllVocabulary', () => {
  test('returns all entries across books', async () => {
    const entries = [sampleEntry, { ...sampleEntry, id: 'def-456', bookHash: 'other-book' }];
    mockStore.getAll.mockResolvedValueOnce(entries);

    const result = await getAllVocabulary();
    expect(result).toHaveLength(2);
  });
});

describe('deleteVocabularyEntry', () => {
  test('delegates deletion to the store', async () => {
    mockStore.delete.mockResolvedValueOnce(undefined);
    await deleteVocabularyEntry('abc-123');
    expect(mockStore.delete).toHaveBeenCalledWith('abc-123');
  });
});

describe('searchVocabulary', () => {
  test('returns entries whose term contains the query (case-insensitive)', async () => {
    mockStore.search.mockResolvedValueOnce([sampleEntry]);

    const result = await searchVocabulary('知己');
    expect(mockStore.search).toHaveBeenCalledWith('知己');
    expect(result[0]!.term).toBe('知己');
  });
});
