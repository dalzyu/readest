import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContextDictionaryPopup from '@/app/reader/components/annotator/ContextDictionaryPopup';
import type {
  ContextDictionarySettings,
  ContextTranslationSettings,
} from '@/services/contextTranslation/types';
import {
  DEFAULT_CONTEXT_DICTIONARY_SETTINGS,
  DEFAULT_CONTEXT_TRANSLATION_SETTINGS,
} from '@/services/contextTranslation/defaults';

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

const translationSettings: ContextTranslationSettings = DEFAULT_CONTEXT_TRANSLATION_SETTINGS;
const dictionarySettings: ContextDictionarySettings = DEFAULT_CONTEXT_DICTIONARY_SETTINGS;

const defaultProps = {
  bookKey: 'book-1',
  bookHash: 'hash-1',
  selectedText: '知己',
  currentPage: 1,
  translationSettings,
  dictionarySettings,
  position: { point: { x: 0, y: 0 } },
  trianglePosition: { point: { x: 0, y: 0 } },
  popupWidth: 400,
  popupHeight: 260,
};

describe('ContextDictionaryPopup', () => {
  test('dictionary popup renders simplified source-language explanation fields', () => {
    mockUseContextDictionary.mockReturnValue({
      result: { simpleDefinition: 'simple definition', contextualMeaning: 'clear explanation' },
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
    expect(screen.getByText('clear explanation')).toBeTruthy();
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
