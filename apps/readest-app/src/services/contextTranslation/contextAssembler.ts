export interface PageContent {
  pageNumber: number;
  text: string;
}

/**
 * Assembles a context string from the last `windowSize` pages up to and
 * including `currentPage`. Pages beyond `currentPage` are excluded to avoid
 * spoilers.
 */
export function assembleRecentContext(
  pages: PageContent[],
  windowSize: number,
  currentPage: number,
): string {
  if (pages.length === 0) return '';

  const eligible = pages.filter((p) => p.pageNumber <= currentPage);
  const window = eligible.slice(-windowSize);
  return window.map((p) => p.text).join('\n');
}
