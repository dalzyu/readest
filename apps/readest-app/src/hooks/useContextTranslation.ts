import type {
  LookupAnnotationSlots,
  LookupExample,
  ContextTranslationSettings,
  PopupContextBundle,
  PopupRetrievalHints,
  RetrievalStatus,
  TranslationResult,
} from '@/services/contextTranslation/types';
import { useContextLookup } from './useContextLookup';

interface UseContextTranslationOptions {
  bookKey: string;
  bookHash: string;
  selectedText: string;
  currentPage: number;
  settings: ContextTranslationSettings;
}

interface UseContextTranslationResult {
  result: TranslationResult | null;
  partialResult: TranslationResult | null;
  loading: boolean;
  streaming: boolean;
  activeFieldId: string | null;
  error: string | null;
  retrievalStatus: RetrievalStatus;
  retrievalHints: PopupRetrievalHints;
  popupContext: PopupContextBundle | null;
  examples: LookupExample[];
  annotations: LookupAnnotationSlots | null;
  saveToVocabulary: () => Promise<void>;
}

export function useContextTranslation({
  bookKey,
  bookHash,
  selectedText,
  currentPage,
  settings,
}: UseContextTranslationOptions): UseContextTranslationResult {
  const {
    result,
    partialResult,
    loading,
    streaming,
    activeFieldId,
    error,
    retrievalStatus,
    retrievalHints,
    popupContext,
    examples,
    annotations,
    saveToVocabulary,
  } = useContextLookup({
    mode: 'translation',
    bookKey,
    bookHash,
    selectedText,
    currentPage,
    settings,
  });

  return {
    result,
    partialResult,
    loading,
    streaming,
    activeFieldId,
    error,
    retrievalStatus,
    retrievalHints,
    popupContext,
    examples,
    annotations,
    saveToVocabulary,
  };
}
