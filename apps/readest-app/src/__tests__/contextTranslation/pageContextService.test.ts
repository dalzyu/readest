import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { TextChunk } from '@/services/ai/types';

vi.mock('@/services/ai/storage/aiStore', () => ({
  aiStore: {
    getChunks: vi.fn(),
  },
}));

import { aiStore } from '@/services/ai/storage/aiStore';
import { getRecentPageContext } from '@/services/contextTranslation/pageContextService';

const mockAiStore = vi.mocked(aiStore);

function makeChunk(pageNumber: number, text: string): TextChunk {
  return {
    id: `book-0-${pageNumber}`,
    bookHash: 'book-abc',
    sectionIndex: 0,
    chapterTitle: 'Chapter 1',
    text,
    pageNumber,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getRecentPageContext', () => {
  const chunks: TextChunk[] = [
    makeChunk(1, 'Text from page one.'),
    makeChunk(2, 'Text from page two.'),
    makeChunk(3, 'Text from page three with 知己.'),
    makeChunk(4, 'Text from page four.'),
    makeChunk(5, 'Text from page five.'),
  ];

  test('returns text from the last N pages up to currentPage', async () => {
    mockAiStore.getChunks.mockResolvedValueOnce(chunks);

    const result = await getRecentPageContext('book-abc', 3, 3);

    expect(result).toContain('page one');
    expect(result).toContain('page two');
    expect(result).toContain('page three');
    expect(result).not.toContain('page four');
  });

  test('does not include chunks beyond currentPage (spoiler protection)', async () => {
    mockAiStore.getChunks.mockResolvedValueOnce(chunks);

    const result = await getRecentPageContext('book-abc', 3, 2);

    expect(result).not.toContain('page four');
    expect(result).not.toContain('page five');
  });

  test('returns empty string when no chunks exist', async () => {
    mockAiStore.getChunks.mockResolvedValueOnce([]);

    const result = await getRecentPageContext('book-abc', 3, 5);

    expect(result).toBe('');
  });

  test('handles currentPage beyond available chunks', async () => {
    mockAiStore.getChunks.mockResolvedValueOnce(chunks);

    const result = await getRecentPageContext('book-abc', 99, 2);

    // should return last 2 available pages (4, 5)
    expect(result).toContain('page four');
    expect(result).toContain('page five');
  });

  test('joins multiple chunks on the same page into one text block', async () => {
    const multiChunks: TextChunk[] = [
      makeChunk(1, 'First chunk on page 1.'),
      makeChunk(1, 'Second chunk on page 1.'),
      makeChunk(2, 'Page 2 text.'),
    ];
    mockAiStore.getChunks.mockResolvedValueOnce(multiChunks);

    const result = await getRecentPageContext('book-abc', 2, 2);

    expect(result).toContain('First chunk on page 1.');
    expect(result).toContain('Second chunk on page 1.');
    expect(result).toContain('Page 2 text.');
  });
});
