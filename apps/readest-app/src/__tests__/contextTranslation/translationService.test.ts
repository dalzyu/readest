import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { TranslationOutputField } from '@/services/contextTranslation/types';

// Mock the LLM call — we don't want real network I/O in unit tests
vi.mock('@/services/contextTranslation/llmClient', () => ({
  callLLM: vi.fn(),
}));

import { callLLM } from '@/services/contextTranslation/llmClient';
import { translateWithContext } from '@/services/contextTranslation/translationService';

const mockCallLLM = vi.mocked(callLLM);

const fields: TranslationOutputField[] = [
  {
    id: 'translation',
    label: 'Translation',
    enabled: true,
    order: 0,
    promptInstruction: 'Provide a direct translation.',
  },
  {
    id: 'contextualMeaning',
    label: 'Contextual Meaning',
    enabled: true,
    order: 1,
    promptInstruction: 'Explain contextual meaning.',
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('translateWithContext', () => {
  test('calls LLM with built prompts and returns parsed result', async () => {
    mockCallLLM.mockResolvedValueOnce(
      '<translation>close friend</translation>\n<contextualMeaning>A soulmate who truly understands you.</contextualMeaning>',
    );

    const result = await translateWithContext({
      selectedText: '知己',
      recentContext: 'He had finally found a true 知己.',
      targetLanguage: 'en',
      outputFields: fields,
    });

    expect(mockCallLLM).toHaveBeenCalledOnce();
    const [systemPrompt, userPrompt] = mockCallLLM.mock.calls[0]!;
    expect(systemPrompt).toContain('English');
    expect(userPrompt).toContain('知己');

    expect(result['translation']).toBe('close friend');
    expect(result['contextualMeaning']).toBe('A soulmate who truly understands you.');
  });

  test('returns empty translation when LLM returns empty string', async () => {
    mockCallLLM.mockResolvedValueOnce('');

    const result = await translateWithContext({
      selectedText: '知己',
      recentContext: 'some context',
      targetLanguage: 'en',
      outputFields: fields,
    });

    expect(result['translation']).toBe('');
  });

  test('propagates LLM errors', async () => {
    mockCallLLM.mockRejectedValueOnce(new Error('Network error'));

    await expect(
      translateWithContext({
        selectedText: '知己',
        recentContext: 'some context',
        targetLanguage: 'en',
        outputFields: fields,
      }),
    ).rejects.toThrow('Network error');
  });

  test('passes RAG context through to LLM prompt when provided', async () => {
    mockCallLLM.mockResolvedValueOnce('<translation>soulmate</translation>');

    await translateWithContext({
      selectedText: '知己',
      recentContext: 'context text',
      ragContext: 'From chapter 2: the word signified deep bonds.',
      targetLanguage: 'en',
      outputFields: fields,
    });

    const [, userPrompt] = mockCallLLM.mock.calls[0]!;
    expect(userPrompt).toContain('From chapter 2');
  });
});
