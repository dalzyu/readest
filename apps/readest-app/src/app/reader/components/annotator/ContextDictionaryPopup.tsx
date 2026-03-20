import React from 'react';
import Popup from '@/components/Popup';
import { useContextDictionary } from '@/hooks/useContextDictionary';
import { useTranslation } from '@/hooks/useTranslation';
import type {
  ContextDictionarySettings,
  ContextTranslationSettings,
} from '@/services/contextTranslation/types';
import { Position } from '@/utils/sel';

interface ContextDictionaryPopupProps {
  bookKey: string;
  bookHash: string;
  selectedText: string;
  currentPage: number;
  translationSettings: ContextTranslationSettings;
  dictionarySettings: ContextDictionarySettings;
  position: Position;
  trianglePosition: Position;
  popupWidth: number;
  popupHeight: number;
  onDismiss?: () => void;
}

const ContextDictionaryPopup: React.FC<ContextDictionaryPopupProps> = ({
  bookKey,
  bookHash,
  selectedText,
  currentPage,
  translationSettings,
  dictionarySettings,
  position,
  trianglePosition,
  popupWidth,
  popupHeight,
  onDismiss,
}) => {
  const _ = useTranslation();
  const { result, loading, error } = useContextDictionary({
    bookKey,
    bookHash,
    selectedText,
    currentPage,
    translationSettings,
    dictionarySettings,
  });

  const simpleDefinition = result?.['simpleDefinition'] ?? null;
  const contextualMeaning = result?.['contextualMeaning'] ?? null;
  const sourceExamples = result?.['sourceExamples'] ?? null;

  return (
    <div>
      <Popup
        trianglePosition={trianglePosition}
        width={popupWidth}
        minHeight={popupHeight}
        maxHeight={480}
        position={position}
        className='not-eink:text-white flex flex-col bg-gray-700'
        triangleClassName='text-gray-700'
        onDismiss={onDismiss}
      >
        <div className='flex items-center border-b border-gray-500/30 px-4 py-3'>
          <span className='not-eink:text-yellow-300 font-medium'>{selectedText}</span>
        </div>

        <div className='flex flex-1 flex-col gap-3 overflow-y-auto p-4'>
          {loading && <p className='text-sm italic text-gray-400'>{_('Looking up...')}</p>}
          {error && <p className='text-sm text-red-400'>{error}</p>}
          {!loading && !error && simpleDefinition !== null ? (
            <div>
              <h3 className='mb-1 text-xs font-medium uppercase tracking-wide text-gray-400'>
                {_('Definition')}
              </h3>
              <p className='not-eink:text-white/90 select-text whitespace-pre-wrap text-sm leading-relaxed'>
                {simpleDefinition}
              </p>
            </div>
          ) : null}
          {!loading && !error && contextualMeaning ? (
            <div>
              <h3 className='mb-1 text-xs font-medium uppercase tracking-wide text-gray-400'>
                {_('Contextual Meaning')}
              </h3>
              <p className='not-eink:text-white/90 select-text whitespace-pre-wrap text-sm leading-relaxed'>
                {contextualMeaning}
              </p>
            </div>
          ) : null}
          {!loading && !error && dictionarySettings.sourceExamples && sourceExamples ? (
            <div>
              <h3 className='mb-1 text-xs font-medium uppercase tracking-wide text-gray-400'>
                {_('Examples')}
              </h3>
              <p className='not-eink:text-white/90 select-text whitespace-pre-wrap text-sm leading-relaxed'>
                {sourceExamples}
              </p>
            </div>
          ) : null}
        </div>
      </Popup>
    </div>
  );
};

export default ContextDictionaryPopup;
