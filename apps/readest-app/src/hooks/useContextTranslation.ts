import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  ContextTranslationSettings,
  TranslationResult,
} from '@/services/contextTranslation/types';
import { getRecentPageContext } from '@/services/contextTranslation/pageContextService';
import { translateWithContext } from '@/services/contextTranslation/translationService';
import { saveVocabularyEntry } from '@/services/contextTranslation/vocabularyService';

interface UseContextTranslationOptions {
  bookKey: string;
  bookHash: string;
  selectedText: string;
  currentPage: number;
  settings: ContextTranslationSettings;
}

interface UseContextTranslationResult {
  result: TranslationResult | null;
  loading: boolean;
  error: string | null;
  saveToVocabulary: () => Promise<void>;
}

export function useContextTranslation({
  bookHash,
  selectedText,
  currentPage,
  settings,
}: UseContextTranslationOptions): UseContextTranslationResult {
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contextRef = useRef<string>('');

  useEffect(() => {
    if (!selectedText.trim()) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setResult(null);

    const run = async () => {
      try {
        const recentContext = await getRecentPageContext(
          bookHash,
          currentPage,
          settings.recentContextPages,
        );
        contextRef.current = recentContext;

        if (cancelled) return;

        const translated = await translateWithContext({
          selectedText,
          recentContext,
          targetLanguage: settings.targetLanguage,
          outputFields: settings.outputFields,
        });

        if (!cancelled) {
          setResult(translated);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [
    selectedText,
    bookHash,
    currentPage,
    settings.recentContextPages,
    settings.targetLanguage,
    settings.outputFields,
  ]);

  const saveToVocabulary = useCallback(async () => {
    if (!result) return;
    await saveVocabularyEntry({
      bookHash,
      term: selectedText,
      context: contextRef.current,
      result,
    });
  }, [bookHash, selectedText, result]);

  return { result, loading, error, saveToVocabulary };
}
