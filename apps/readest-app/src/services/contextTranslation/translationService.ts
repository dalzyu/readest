import type { LanguageModel } from 'ai';
import type { TranslationRequest, TranslationResult } from './types';
import { buildTranslationPrompt } from './promptBuilder';
import { parseTranslationResponse } from './responseParser';
import { callLLM } from './llmClient';

/**
 * Orchestrates context-aware translation:
 * 1. Builds system + user prompts from the request
 * 2. Calls the LLM
 * 3. Parses the structured response
 */
export async function translateWithContext(
  request: TranslationRequest,
  model?: LanguageModel,
): Promise<TranslationResult> {
  const { systemPrompt, userPrompt } = buildTranslationPrompt(request);
  const response = await callLLM(systemPrompt, userPrompt, model!);
  return parseTranslationResponse(response, request.outputFields);
}
