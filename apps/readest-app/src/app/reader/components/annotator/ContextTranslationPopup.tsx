import React from 'react';
import { RiBookmarkLine, RiBookmarkFill } from 'react-icons/ri';
import Popup from '@/components/Popup';
import { Position } from '@/utils/sel';
import { useTranslation } from '@/hooks/useTranslation';
import { useContextTranslation } from '@/hooks/useContextTranslation';
import type { ContextTranslationSettings } from '@/services/contextTranslation/types';

interface ContextTranslationPopupProps {
  bookKey: string;
  bookHash: string;
  selectedText: string;
  currentPage: number;
  settings: ContextTranslationSettings;
  position: Position;
  trianglePosition: Position;
  popupWidth: number;
  popupHeight: number;
  onDismiss?: () => void;
}

const ContextTranslationPopup: React.FC<ContextTranslationPopupProps> = ({
  bookKey,
  bookHash,
  selectedText,
  currentPage,
  settings,
  position,
  trianglePosition,
  popupWidth,
  popupHeight,
  onDismiss,
}) => {
  const _ = useTranslation();
  const [saved, setSaved] = React.useState(false);

  const { result, loading, error, saveToVocabulary } = useContextTranslation({
    bookKey,
    bookHash,
    selectedText,
    currentPage,
    settings,
  });

  const enabledFields = settings.outputFields
    .filter((f) => f.enabled)
    .sort((a, b) => a.order - b.order);

  const handleSave = async () => {
    await saveToVocabulary();
    setSaved(true);
  };

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
        {/* Header: selected term + save button */}
        <div className='flex items-center justify-between border-b border-gray-500/30 px-4 py-3'>
          <span className='not-eink:text-yellow-300 line-clamp-1 select-text font-medium'>
            {selectedText}
          </span>
          <button
            onClick={handleSave}
            disabled={!result || saved}
            title={saved ? _('Saved') : _('Save to vocabulary')}
            className='text-gray-400 transition-colors hover:text-yellow-300 disabled:opacity-40'
          >
            {saved ? <RiBookmarkFill size={18} /> : <RiBookmarkLine size={18} />}
          </button>
        </div>

        {/* Body: field results */}
        <div className='flex flex-1 flex-col gap-3 overflow-y-auto p-4'>
          {loading && <p className='text-sm italic text-gray-400'>{_('Translating...')}</p>}
          {error && <p className='text-sm text-red-400'>{error}</p>}
          {!loading &&
            !error &&
            result &&
            enabledFields.map((field) => {
              const value = result[field.id];
              if (!value) return null;
              return (
                <div key={field.id}>
                  <h3 className='mb-1 text-xs font-medium uppercase tracking-wide text-gray-400'>
                    {_(field.label)}
                  </h3>
                  <p className='not-eink:text-white/90 select-text text-sm leading-relaxed'>
                    {value}
                  </p>
                </div>
              );
            })}
        </div>
      </Popup>
    </div>
  );
};

export default ContextTranslationPopup;
