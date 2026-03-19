import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type {
  ContextTranslationSettings,
  TranslationOutputField,
} from '@/services/contextTranslation/types';

vi.mock('@/services/contextTranslation/pageContextService', () => ({
  getRecentPageContext: vi.fn(),
}));
vi.mock('@/services/contextTranslation/translationService', () => ({
  translateWithContext: vi.fn(),
}));
vi.mock('@/services/contextTranslation/vocabularyService', () => ({
  saveVocabularyEntry: vi.fn(),
}));
vi.mock('@/services/ai/storage/aiStore', () => ({
  aiStore: { getChunks: vi.fn() },
}));

import { getRecentPageContext } from '@/services/contextTranslation/pageContextService';
import { translateWithContext } from '@/services/contextTranslation/translationService';
import { saveVocabularyEntry } from '@/services/contextTranslation/vocabularyService';
import { useContextTranslation } from '@/hooks/useContextTranslation';

const fields: TranslationOutputField[] = [
  {
    id: 'translation',
    label: 'Translation',
    enabled: true,
    order: 0,
    promptInstruction: 'Provide a direct translation.',
  },
  {
    id: 'contextualMeaning',
    label: 'Contextual Meaning',
    enabled: true,
    order: 1,
    promptInstruction: 'Explain contextual meaning.',
  },
];

const settings: ContextTranslationSettings = {
  enabled: true,
  targetLanguage: 'en',
  recentContextPages: 3,
  outputFields: fields,
  useRag: false,
};

const defaultProps = {
  bookKey: 'book-key-1',
  bookHash: 'hash-abc',
  selectedText: '知己',
  currentPage: 5,
  settings,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getRecentPageContext).mockResolvedValue('He found a true 知己 among companions.');
  vi.mocked(translateWithContext).mockResolvedValue({
    translation: 'close friend',
    contextualMeaning: 'A soulmate who truly understands you.',
  });
  vi.mocked(saveVocabularyEntry).mockResolvedValue({
    id: 'saved-id',
    bookHash: 'hash-abc',
    term: '知己',
    context: 'He found a true 知己 among companions.',
    result: { translation: 'close friend' },
    addedAt: Date.now(),
    reviewCount: 0,
  });
});

describe('useContextTranslation', () => {
  test('starts in loading state and resolves with translation result', async () => {
    const { result } = renderHook(() => useContextTranslation(defaultProps));

    expect(result.current.loading).toBe(true);
    expect(result.current.result).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.result).toEqual({
      translation: 'close friend',
      contextualMeaning: 'A soulmate who truly understands you.',
    });
    expect(result.current.error).toBeNull();
  });

  test('fetches recent page context with correct args before translating', async () => {
    renderHook(() => useContextTranslation(defaultProps));

    await waitFor(() =>
      expect(vi.mocked(getRecentPageContext).mock.calls.length).toBeGreaterThan(0),
    );

    expect(getRecentPageContext).toHaveBeenCalledWith('hash-abc', 5, 3);
  });

  test('passes assembled context into translateWithContext', async () => {
    renderHook(() => useContextTranslation(defaultProps));

    await waitFor(() =>
      expect(vi.mocked(translateWithContext).mock.calls.length).toBeGreaterThan(0),
    );

    const callArg = vi.mocked(translateWithContext).mock.calls[0]![0];
    expect(callArg.selectedText).toBe('知己');
    expect(callArg.recentContext).toBe('He found a true 知己 among companions.');
    expect(callArg.targetLanguage).toBe('en');
  });

  test('sets error when translation fails', async () => {
    vi.mocked(translateWithContext).mockRejectedValueOnce(new Error('LLM unavailable'));

    const { result } = renderHook(() => useContextTranslation(defaultProps));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toContain('LLM unavailable');
    expect(result.current.result).toBeNull();
  });

  test('saveToVocabulary persists result with correct fields', async () => {
    const { result } = renderHook(() => useContextTranslation(defaultProps));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.saveToVocabulary();
    });

    expect(saveVocabularyEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        bookHash: 'hash-abc',
        term: '知己',
        result: {
          translation: 'close friend',
          contextualMeaning: 'A soulmate who truly understands you.',
        },
      }),
    );
  });

  test('re-fetches when selectedText changes', async () => {
    const { result, rerender } = renderHook(
      (props: typeof defaultProps) => useContextTranslation(props),
      { initialProps: defaultProps },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(vi.mocked(translateWithContext)).toHaveBeenCalledTimes(1);

    rerender({ ...defaultProps, selectedText: '朋友' });

    await waitFor(() => expect(vi.mocked(translateWithContext)).toHaveBeenCalledTimes(2));
    const secondCall = vi.mocked(translateWithContext).mock.calls[1]![0];
    expect(secondCall.selectedText).toBe('朋友');
  });

  test('does not translate when selectedText is empty', async () => {
    renderHook(() => useContextTranslation({ ...defaultProps, selectedText: '' }));

    // give it a tick
    await new Promise((r) => setTimeout(r, 50));

    expect(translateWithContext).not.toHaveBeenCalled();
  });
});
