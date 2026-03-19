import { describe, test, expect } from 'vitest';
import { buildTranslationPrompt } from '@/services/contextTranslation/promptBuilder';
import type {
  TranslationRequest,
  TranslationOutputField,
} from '@/services/contextTranslation/types';

const baseFields: TranslationOutputField[] = [
  {
    id: 'translation',
    label: 'Translation',
    enabled: true,
    order: 0,
    promptInstruction: 'Provide a direct translation of the selected text.',
  },
  {
    id: 'contextualMeaning',
    label: 'Contextual Meaning',
    enabled: true,
    order: 1,
    promptInstruction: 'Explain what the word/phrase means given the surrounding context.',
  },
  {
    id: 'examples',
    label: 'Examples',
    enabled: false,
    order: 2,
    promptInstruction: 'Give usage examples.',
  },
];

const baseRequest: TranslationRequest = {
  selectedText: '知己',
  recentContext: 'He had finally found a true 知己 among his companions.',
  targetLanguage: 'en',
  outputFields: baseFields,
};

describe('buildTranslationPrompt', () => {
  test('includes selected text in prompt', () => {
    const { userPrompt } = buildTranslationPrompt(baseRequest);
    expect(userPrompt).toContain('知己');
  });

  test('includes recent context in prompt', () => {
    const { userPrompt } = buildTranslationPrompt(baseRequest);
    expect(userPrompt).toContain('He had finally found a true 知己');
  });

  test('includes target language in system prompt', () => {
    const { systemPrompt } = buildTranslationPrompt(baseRequest);
    expect(systemPrompt.toLowerCase()).toContain('english');
  });

  test('includes only enabled fields in system prompt', () => {
    const { systemPrompt } = buildTranslationPrompt(baseRequest);
    expect(systemPrompt).toContain('translation');
    expect(systemPrompt).toContain('contextualMeaning');
    expect(systemPrompt).not.toContain('examples');
  });

  test('includes prompt instructions for enabled fields', () => {
    const { systemPrompt } = buildTranslationPrompt(baseRequest);
    expect(systemPrompt).toContain('Provide a direct translation');
    expect(systemPrompt).toContain('Explain what the word/phrase means');
  });

  test('instructs LLM to use XML tags for each enabled field', () => {
    const { systemPrompt } = buildTranslationPrompt(baseRequest);
    expect(systemPrompt).toContain('<translation>');
    expect(systemPrompt).toContain('<contextualMeaning>');
    expect(systemPrompt).not.toContain('<examples>');
  });

  test('includes RAG context when provided', () => {
    const request: TranslationRequest = {
      ...baseRequest,
      ragContext: 'From chapter 3: 知己 was used to describe a lifelong bond.',
    };
    const { userPrompt } = buildTranslationPrompt(request);
    expect(userPrompt).toContain('From chapter 3');
  });

  test('omits RAG section when ragContext is absent', () => {
    const { userPrompt } = buildTranslationPrompt(baseRequest);
    expect(userPrompt).not.toContain('deeper context');
  });

  test('includes source language hint when provided', () => {
    const request: TranslationRequest = {
      ...baseRequest,
      sourceLanguage: 'zh',
    };
    const { systemPrompt } = buildTranslationPrompt(request);
    expect(systemPrompt).toContain('zh');
  });
});
