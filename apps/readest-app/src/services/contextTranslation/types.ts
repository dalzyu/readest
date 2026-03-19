/** A single configurable output field shown in the translation popup */
export interface TranslationOutputField {
  id: string;
  label: string;
  enabled: boolean;
  order: number;
  /** Injected into the LLM prompt to describe what this field should contain */
  promptInstruction: string;
}

/** The parsed result from the LLM, keyed by field id */
export type TranslationResult = Record<string, string>;

/** Input passed to the translation service for a single lookup */
export interface TranslationRequest {
  /** The selected text to translate */
  selectedText: string;
  /** Recent page text used as immediate context */
  recentContext: string;
  /** Chunks retrieved from RAG search for deeper context */
  ragContext?: string;
  /** Source language (e.g. "zh", "ja"). Auto-detected if omitted. */
  sourceLanguage?: string;
  /** Target language for translation (e.g. "en") */
  targetLanguage: string;
  /** Fields to populate in the response */
  outputFields: TranslationOutputField[];
}

/** A saved vocabulary lookup entry */
export interface VocabularyEntry {
  id: string;
  bookHash: string;
  term: string;
  context: string;
  result: TranslationResult;
  addedAt: number;
  reviewCount: number;
}

/** Settings for the context-aware translation feature */
export interface ContextTranslationSettings {
  enabled: boolean;
  targetLanguage: string;
  recentContextPages: number;
  outputFields: TranslationOutputField[];
  useRag: boolean;
}
