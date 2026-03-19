import type { TranslationRequest } from './types';

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  fr: 'French',
  de: 'German',
  es: 'Spanish',
  pt: 'Portuguese',
  ru: 'Russian',
  ar: 'Arabic',
};

function languageName(code: string): string {
  return LANGUAGE_NAMES[code] ?? code;
}

export function buildTranslationPrompt(request: TranslationRequest): {
  systemPrompt: string;
  userPrompt: string;
} {
  const enabledFields = request.outputFields
    .filter((f) => f.enabled)
    .sort((a, b) => a.order - b.order);

  const targetLang = languageName(request.targetLanguage);
  const sourceLangHint = request.sourceLanguage
    ? ` The source language is ${request.sourceLanguage}.`
    : '';

  const fieldInstructions = enabledFields
    .map(
      (f) => `- <${f.id}>: ${f.promptInstruction} Wrap your answer in <${f.id}>...</${f.id}> tags.`,
    )
    .join('\n');

  const systemPrompt = `You are a literary translation assistant. Translate and explain text for a reader learning a foreign language.${sourceLangHint}

Always respond in ${targetLang}. For each request, provide the following fields, each wrapped in the specified XML tags:

${fieldInstructions}

Respond with ONLY the tagged fields. Do not add any preamble or extra commentary outside the tags.`;

  const ragSection = request.ragContext
    ? `\n\n<deeper_context>\n${request.ragContext}\n</deeper_context>`
    : '';

  const userPrompt = `<selected_text>${request.selectedText}</selected_text>

<recent_context>${request.recentContext}</recent_context>${ragSection}

Please translate and explain the selected text using the context provided.`;

  return { systemPrompt, userPrompt };
}
