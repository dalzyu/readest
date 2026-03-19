import type { TranslationOutputField, TranslationResult } from './types';

/**
 * Parses an LLM response that uses XML-style tags per output field.
 * Falls back to using the full response as the `translation` field value
 * when no tags are found.
 */
export function parseTranslationResponse(
  response: string,
  fields: TranslationOutputField[],
): TranslationResult {
  const result: TranslationResult = {};
  const enabledFields = fields.filter((f) => f.enabled);

  let anyTagFound = false;

  for (const field of enabledFields) {
    const regex = new RegExp(`<${field.id}>([\\s\\S]*?)<\\/${field.id}>`, 'm');
    const match = regex.exec(response);
    if (match) {
      anyTagFound = true;
      result[field.id] = match[1]!.trim();
    }
  }

  if (!anyTagFound) {
    // No tags — treat entire response as the translation field
    const translationField = enabledFields.find((f) => f.id === 'translation');
    if (translationField) {
      result['translation'] = response.trim();
    }
  }

  return result;
}
