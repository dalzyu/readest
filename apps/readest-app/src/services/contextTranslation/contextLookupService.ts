import type { LanguageModel } from 'ai';
import type { ContextLookupMode } from './modes';
import type { TranslationOutputField, PopupContextBundle } from './types';
import type { NormalizedLookupResult } from './normalizer';
import type { DetectedLanguageInfo } from './languagePolicy';
import type { ValidationDecision } from './validator';
import { captureEvent } from '@/utils/telemetry';
import { detectLookupLanguage } from './languagePolicy';
import { resolveLookupPlugins } from './plugins/registry';
import { buildLookupPrompt } from './promptBuilder';
import { buildRepairPrompt } from './repairPromptBuilder';
import { callLLM } from './llmClient';
import { normalizeLookupResponse } from './normalizer';
import { validateLookupResult } from './validator';

export interface ContextLookupRequest {
  mode: ContextLookupMode;
  selectedText: string;
  popupContext: PopupContextBundle;
  targetLanguage: string;
  sourceLanguage?: string;
  outputFields: TranslationOutputField[];
  model?: LanguageModel;
  abortSignal?: AbortSignal;
}

export interface ContextLookupResult {
  fields: NormalizedLookupResult;
  validationDecision: ValidationDecision;
  detectedLanguage: DetectedLanguageInfo;
}

export type ContextLookupDegradationPath =
  | 'none'
  | 'repair-recovered'
  | 'repair-failed'
  | 'stream-final-degrade';

export interface ContextLookupTelemetryPayload {
  mode: ContextLookupMode;
  decision: ValidationDecision;
  repairCount: number;
  degradationPath: ContextLookupDegradationPath;
  sourceLanguage: string;
  targetLanguage: string;
  detectedLanguage: string;
  detectionConfidence: number;
  mixed: boolean;
  sourcePlugin: string;
  targetPlugin: string;
  structuredOutput: boolean;
  selectedTextLength: number;
}

export const CONTEXT_LOOKUP_EVENT = 'context_lookup_outcome';

export const CONTEXT_LOOKUP_ROLLOUT = {
  telemetryEnabled: true,
  repairOnDegrade: true,
};

export const contextLookupTelemetry = {
  logOutcome(payload: ContextLookupTelemetryPayload): void {
    if (!CONTEXT_LOOKUP_ROLLOUT.telemetryEnabled) {
      return;
    }

    captureEvent(CONTEXT_LOOKUP_EVENT, payload as unknown as Record<string, unknown>);
  },
};

function resolvePrimaryField(outputFields: TranslationOutputField[]): string {
  return outputFields.find((field) => field.enabled)?.id ?? 'translation';
}

export function buildContextLookupTelemetryPayload(input: {
  mode: ContextLookupMode;
  selectedText: string;
  targetLanguage: string;
  sourceLanguage: string;
  detectedLanguage: DetectedLanguageInfo;
  validationDecision: ValidationDecision;
  repairCount: number;
  degradationPath: ContextLookupDegradationPath;
  rawResponse: string;
}): ContextLookupTelemetryPayload {
  const plugins = resolveLookupPlugins({
    sourceLanguage: input.sourceLanguage,
    targetLanguage: input.targetLanguage,
    mode: input.mode,
  });

  return {
    mode: input.mode,
    decision: input.validationDecision,
    repairCount: input.repairCount,
    degradationPath: input.degradationPath,
    sourceLanguage: input.sourceLanguage,
    targetLanguage: input.targetLanguage,
    detectedLanguage: input.detectedLanguage.language,
    detectionConfidence: input.detectedLanguage.confidence,
    mixed: input.detectedLanguage.mixed,
    sourcePlugin: plugins.source.language,
    targetPlugin: plugins.target.language,
    structuredOutput: input.rawResponse.includes('<lookup_json>'),
    selectedTextLength: input.selectedText.length,
  };
}

/**
 * Shared lookup service:
 * 1. Detects source language from selectedText
 * 2. Builds prompts via buildLookupPrompt
 * 3. Calls the LLM
 * 4. Normalizes the response
 * 5. Validates the result
 * 6. Returns a ContextLookupResult
 */
export async function runContextLookup(
  request: ContextLookupRequest,
): Promise<ContextLookupResult> {
  const detectedLanguage = detectLookupLanguage(request.selectedText);
  const sourceLanguage = request.sourceLanguage ?? detectedLanguage.language;
  const primaryField = resolvePrimaryField(request.outputFields);

  const { systemPrompt, userPrompt } = buildLookupPrompt({
    mode: request.mode,
    selectedText: request.selectedText,
    popupContext: request.popupContext,
    targetLanguage: request.targetLanguage,
    sourceLanguage,
    outputFields: request.outputFields,
  });

  const runAttempt = async (system: string, user: string) => {
    const raw = await callLLM(system, user, request.model as LanguageModel, request.abortSignal);
    const fields = normalizeLookupResponse(raw, request.mode);
    const validation = validateLookupResult(fields, primaryField, request.selectedText);

    return { raw, fields, validation };
  };

  let repairCount = 0;
  let degradationPath: ContextLookupDegradationPath = 'none';
  let attempt = await runAttempt(systemPrompt, userPrompt);

  if (attempt.validation.decision === 'degrade' && CONTEXT_LOOKUP_ROLLOUT.repairOnDegrade) {
    repairCount = 1;

    const repairPrompt = buildRepairPrompt({
      originalUserPrompt: userPrompt,
      issue: attempt.validation.reason ?? `${primaryField} field is empty or missing`,
    });

    attempt = await runAttempt(repairPrompt.systemPrompt, repairPrompt.userPrompt);
    degradationPath = attempt.validation.decision === 'degrade' ? 'repair-failed' : 'repair-recovered';
  }

  contextLookupTelemetry.logOutcome(
    buildContextLookupTelemetryPayload({
      mode: request.mode,
      selectedText: request.selectedText,
      targetLanguage: request.targetLanguage,
      sourceLanguage,
      detectedLanguage,
      validationDecision: attempt.validation.decision,
      repairCount,
      degradationPath,
      rawResponse: attempt.raw,
    }),
  );

  return {
    fields: attempt.fields,
    validationDecision: attempt.validation.decision,
    detectedLanguage,
  };
}
