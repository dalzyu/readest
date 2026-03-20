import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContextDictionaryPopup from '@/app/reader/components/annotator/ContextDictionaryPopup';
import type { ContextTranslationSettings } from '@/services/contextTranslation/types';
import { DEFAULT_CONTEXT_TRANSLATION_SETTINGS } from '@/services/contextTranslation/defaults';

vi.mock('@/components/Popup', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => (value: string) => value,
}));

const mockUseContextDictionary = vi.fn();
vi.mock('@/hooks/useContextDictionary', () => ({
  useContextDictionary: (...args: unknown[]) => mockUseContextDictionary(...args),
}));

const settings: ContextTranslationSettings = DEFAULT_CONTEXT_TRANSLATION_SETTINGS;

const defaultProps = {
  bookKey: 'book-1',
  bookHash: 'hash-1',
  selectedText: '知己',
  currentPage: 1,
  settings,
  position: { point: { x: 0, y: 0 } },
  trianglePosition: { point: { x: 0, y: 0 } },
  popupWidth: 400,
  popupHeight: 260,
};

describe('ContextDictionaryPopup', () => {
  test('dictionary popup renders simplified source-language explanation fields', () => {
    mockUseContextDictionary.mockReturnValue({
      result: { translation: 'simple definition' },
      partialResult: null,
      loading: false,
      streaming: false,
      activeFieldId: null,
      error: null,
      validationDecision: 'accept',
      retrievalStatus: 'local-only',
      retrievalHints: {
        currentVolumeIndexed: true,
        missingLocalIndex: false,
        missingPriorVolumes: [],
        missingSeriesAssignment: false,
      },
      popupContext: null,
      saveToVocabulary: vi.fn(),
    });

    render(<ContextDictionaryPopup {...defaultProps} />);
    expect(screen.getByText('simple definition')).toBeTruthy();
  });

  test('shows loading state', () => {
    mockUseContextDictionary.mockReturnValue({
      result: null,
      partialResult: null,
      loading: true,
      streaming: false,
      activeFieldId: null,
      error: null,
      validationDecision: null,
      retrievalStatus: 'local-only',
      retrievalHints: {
        currentVolumeIndexed: false,
        missingLocalIndex: false,
        missingPriorVolumes: [],
        missingSeriesAssignment: false,
      },
      popupContext: null,
      saveToVocabulary: vi.fn(),
    });

    render(<ContextDictionaryPopup {...defaultProps} />);
    expect(screen.getByText('Looking up...')).toBeTruthy();
  });
});
