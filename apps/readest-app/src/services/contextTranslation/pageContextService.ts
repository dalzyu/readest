import { aiStore } from '@/services/ai/storage/aiStore';

/**
 * Retrieves recent page text for a book by pulling indexed chunks from aiStore
 * and filtering to the window [currentPage - windowSize + 1, currentPage].
 *
 * Reuses the existing RAG infrastructure instead of maintaining a separate cache.
 */
export async function getRecentPageContext(
  bookHash: string,
  currentPage: number,
  windowSize: number,
): Promise<string> {
  const chunks = await aiStore.getChunks(bookHash);
  if (chunks.length === 0) return '';

  const eligible = chunks.filter((c) => c.pageNumber <= currentPage);
  if (eligible.length === 0) return '';

  // find the highest page number available (≤ currentPage)
  const maxAvailablePage = Math.max(...eligible.map((c) => c.pageNumber));
  const minPage = maxAvailablePage - windowSize + 1;

  const window = eligible.filter((c) => c.pageNumber >= minPage);
  return window.map((c) => c.text).join('\n');
}
