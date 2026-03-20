export type LookupAnnotations = {
  // e.g. pinyin for zh source, stress marks for en
  phonetic?: string;
  // keyed by exampleId
  examples?: Record<string, { phonetic?: string }>;
};

export type LookupAnnotationSlots = {
  source?: LookupAnnotations;
  target?: LookupAnnotations;
};

export interface LookupPlugin {
  /** The normalized language this plugin handles (e.g. 'zh', 'en', 'fallback') */
  language: string;
  /** Enriches the result with source-language annotations */
  enrichSourceAnnotations?: (
    fields: Record<string, string>,
    selectedText: string,
  ) => LookupAnnotations | undefined;
  /** Enriches the result with target-language annotations */
  enrichTargetAnnotations?: (
    fields: Record<string, string>,
    selectedText: string,
  ) => LookupAnnotations | undefined;
}
