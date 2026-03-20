import { detectLanguage, inferLangFromScript, isCJKStr } from '@/utils/lang';

export type DetectedLanguageInfo = {
  language: string;
  confidence: number;
  mixed: boolean;
};

/**
 * Builds a locale fallback chain for plugin resolution.
 * e.g. 'zh-Hans-CN' → ['zh-Hans-CN', 'zh-Hans', 'zh', 'fallback']
 */
export function resolvePluginLanguage(locale: string): string[] {
  const parts = locale.split('-');
  const chain: string[] = [];

  for (let i = parts.length; i > 0; i--) {
    chain.push(parts.slice(0, i).join('-'));
  }

  chain.push('fallback');
  return chain;
}

/**
 * Detects the primary language of a text snippet, plus whether it
 * contains a significant mix of scripts (e.g. Latin + CJK).
 */
export function detectLookupLanguage(text: string): DetectedLanguageInfo {
  const hasCJK = isCJKStr(text);
  const hasLatin = /[a-zA-Z]{2,}/.test(text);
  const mixed = hasCJK && hasLatin;

  const rawLang = detectLanguage(text);
  // For very short strings franc may return 'en' even for CJK — defer to script detection.
  const language = inferLangFromScript(text, rawLang);

  // franc doesn't expose per-result confidence; use a heuristic:
  // short or mixed text is lower confidence.
  const lengthFactor = Math.min(text.length / 20, 1);
  const confidence = mixed ? 0.5 * lengthFactor : 0.9 * lengthFactor;

  return { language, confidence, mixed };
}
