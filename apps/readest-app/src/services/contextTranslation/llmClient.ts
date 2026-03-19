import { generateText } from 'ai';
import type { LanguageModel } from 'ai';

/**
 * Thin wrapper around the `ai` SDK for making single-turn LLM calls.
 * Accepts a pre-built system prompt and user prompt.
 *
 * In production, pass the `model` obtained from the AI provider settings.
 * In tests, this entire function is mocked.
 */
export async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  model: LanguageModel,
): Promise<string> {
  const { text } = await generateText({
    model,
    system: systemPrompt,
    prompt: userPrompt,
  });
  return text;
}
