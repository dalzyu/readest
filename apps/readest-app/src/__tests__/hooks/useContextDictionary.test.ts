import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@/services/contextTranslation/popupRetrievalService', () => ({
  buildPopupContextBundle: vi.fn(),
}));

vi.mock('@/services/contextTranslation/translationService', () => ({
  streamTranslationWithContext: vi.fn(),
}));

vi.mock('@/services/contextTranslation/vocabularyService', () => ({
  saveVocabularyEntry: vi.fn(),
}));

vi.mock('@/store/settingsStore', () => ({
  useSettingsStore: vi.fn(() => ({ settings: null })),
}));

vi.mock('@/services/contextTranslation/contextLookupService', () => ({
  runContextLookup: vi.fn(),
}));

import { buildPopupContextBundle } from '@/services/contextTranslation/popupRetrievalService';
import { runContextLookup } from '@/services/contextTranslation/contextLookupService';
import { useContextDictionary } from '@/hooks/useContextDictionary';
import type { PopupContextBundle } from '@/services/contextTranslation/types';
import { DEFAULT_CONTEXT_TRANSLATION_SETTINGS } from '@/services/contextTranslation/defaults';

const popupContextBundle: PopupContextBundle = {
  localPastContext: 'context text',
  localFutureBuffer: '',
  sameBookChunks: [],
  priorVolumeChunks: [],
  retrievalStatus: 'local-only',
  retrievalHints: {
    currentVolumeIndexed: true,
    missingLocalIndex: false,
    missingPriorVolumes: [],
    missingSeriesAssignment: false,
  },
};

const defaultProps = {
  bookKey: 'book-1',
  bookHash: 'hash-1',
  selectedText: '知己',
  currentPage: 1,
  settings: DEFAULT_CONTEXT_TRANSLATION_SETTINGS,
};

beforeEach(() => {
  vi.mocked(buildPopupContextBundle).mockResolvedValue(popupContextBundle);
  vi.mocked(runContextLookup).mockResolvedValue({
    fields: { translation: 'simple definition' },
    validationDecision: 'accept',
    detectedLanguage: { language: 'zh', confidence: 0.9, mixed: false },
  });
});

describe('useContextDictionary', () => {
  test('dictionary hook requests source-language explanations through the shared lookup hook', async () => {
    renderHook(() => useContextDictionary(defaultProps));
    await waitFor(() =>
      expect(runContextLookup).toHaveBeenCalledWith(
        expect.objectContaining({ mode: 'dictionary' }),
      ),
    );
  });

  test('returns lookup result', async () => {
    const { result } = renderHook(() => useContextDictionary(defaultProps));
    await waitFor(() => expect(result.current.result).not.toBeNull());
    expect(result.current.result?.['translation']).toBe('simple definition');
  });
});
