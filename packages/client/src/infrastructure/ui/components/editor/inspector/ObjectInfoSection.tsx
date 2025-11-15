/** @jsxImportSource preact */
import { h } from 'preact';
import { useI18n } from '@client/infrastructure/ui/hooks/useI18n';
import './object-info-section.css';

export interface ObjectInfoSectionProps {
  objectId: string;
  objectType?: string;
}

/**
 * Display object ID and type
 * 
 * Shows basic object identification information
 */
export function ObjectInfoSection({ objectId, objectType }: ObjectInfoSectionProps) {
  const { t } = useI18n();
  
  return (
    <div class="object-info-section">
      <div class="info-row">
        <span class="info-label">{t('editor.objectInspector.objectId')}</span>
        <span class="info-value">{objectId}</span>
      </div>
      {objectType && (
        <div class="info-row">
          <span class="info-label">{t('editor.objectInspector.objectType')}</span>
          <span class="info-value">{objectType}</span>
        </div>
      )}
    </div>
  );
}
