import { pinyin } from 'pinyin-pro';
import type { LookupPlugin, LookupAnnotations } from './types';

export const zhPlugin: LookupPlugin = {
  language: 'zh',
  enrichSourceAnnotations(
    _fields: Record<string, string>,
    selectedText: string,
  ): LookupAnnotations | undefined {
    const phonetic = pinyin(selectedText, {
      toneType: 'symbol',
      nonZh: 'removed',
      type: 'string',
    }).trim();

    if (!phonetic) {
      return undefined;
    }

    return { phonetic };
  },
};
