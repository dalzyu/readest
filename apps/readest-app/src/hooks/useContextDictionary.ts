import {
  useContextLookup,
  type UseContextLookupInput,
  type UseContextLookupResult,
} from './useContextLookup';

export function useContextDictionary(
  input: Omit<UseContextLookupInput, 'mode'>,
): UseContextLookupResult {
  return useContextLookup({ ...input, mode: 'dictionary' });
}
