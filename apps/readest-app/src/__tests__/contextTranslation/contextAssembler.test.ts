import { describe, test, expect } from 'vitest';
import { assembleRecentContext } from '@/services/contextTranslation/contextAssembler';

describe('assembleRecentContext', () => {
  const pages = [
    { pageNumber: 1, text: 'Page one content with some words.' },
    { pageNumber: 2, text: 'Page two content with more words.' },
    { pageNumber: 3, text: 'Page three content with the selected word 知己.' },
    { pageNumber: 4, text: 'Page four content that comes after.' },
    { pageNumber: 5, text: 'Page five content way after.' },
  ];

  test('returns text from the last N pages up to current', () => {
    const result = assembleRecentContext(pages, 3, 3);
    expect(result).toContain('Page one content');
    expect(result).toContain('Page two content');
    expect(result).toContain('Page three content');
    expect(result).not.toContain('Page four content');
  });

  test('returns only pages up to and including currentPage', () => {
    const result = assembleRecentContext(pages, 2, 3);
    expect(result).toContain('Page two content');
    expect(result).toContain('Page three content');
    expect(result).not.toContain('Page one content');
  });

  test('handles fewer pages than requested window', () => {
    const result = assembleRecentContext(pages, 10, 2);
    expect(result).toContain('Page one content');
    expect(result).toContain('Page two content');
    expect(result).not.toContain('Page three content');
  });

  test('handles currentPage beyond available pages gracefully', () => {
    const result = assembleRecentContext(pages, 3, 99);
    // should return last 3 available pages
    expect(result).toContain('Page three content');
    expect(result).toContain('Page four content');
    expect(result).toContain('Page five content');
  });

  test('returns empty string for empty pages array', () => {
    const result = assembleRecentContext([], 3, 1);
    expect(result).toBe('');
  });

  test('joins pages with newline separator', () => {
    const result = assembleRecentContext(pages, 2, 2);
    expect(result).toContain('\n');
  });
});
