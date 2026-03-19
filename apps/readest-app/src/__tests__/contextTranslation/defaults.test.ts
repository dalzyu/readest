import { describe, test, expect } from 'vitest';
import { DEFAULT_CONTEXT_TRANSLATION_SETTINGS } from '@/services/contextTranslation/defaults';
import type {
  ContextTranslationSettings,
  TranslationOutputField,
} from '@/services/contextTranslation/types';

describe('DEFAULT_CONTEXT_TRANSLATION_SETTINGS', () => {
  const s: ContextTranslationSettings = DEFAULT_CONTEXT_TRANSLATION_SETTINGS;

  test('is disabled by default', () => {
    expect(s.enabled).toBe(false);
  });

  test('targets English by default', () => {
    expect(s.targetLanguage).toBe('en');
  });

  test('uses at least 2 recent context pages', () => {
    expect(s.recentContextPages).toBeGreaterThanOrEqual(2);
  });

  test('has at least one enabled output field', () => {
    const enabled = s.outputFields.filter((f) => f.enabled);
    expect(enabled.length).toBeGreaterThanOrEqual(1);
  });

  test('translation field is always enabled', () => {
    const translation = s.outputFields.find((f) => f.id === 'translation');
    expect(translation).toBeDefined();
    expect(translation!.enabled).toBe(true);
  });

  test('contextualMeaning field is present and enabled', () => {
    const f = s.outputFields.find((f) => f.id === 'contextualMeaning');
    expect(f).toBeDefined();
    expect(f!.enabled).toBe(true);
  });

  test('all fields have non-empty promptInstruction', () => {
    s.outputFields.forEach((f: TranslationOutputField) => {
      expect(f.promptInstruction.trim().length).toBeGreaterThan(0);
    });
  });

  test('fields have unique, sequential order values', () => {
    const orders = s.outputFields.map((f) => f.order).sort((a, b) => a - b);
    orders.forEach((o, i) => expect(o).toBe(i));
  });
});
