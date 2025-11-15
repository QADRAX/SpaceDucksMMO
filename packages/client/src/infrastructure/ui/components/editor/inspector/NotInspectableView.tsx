/** @jsxImportSource preact */
import { h } from 'preact';
import { useI18n } from '@client/infrastructure/ui/hooks/useI18n';
import './not-inspectable-view.css';

/**
 * Warning when object not inspectable
 * 
 * Displayed when selected object doesn't implement IInspectable
 */
export function NotInspectableView() {
  const { t } = useI18n();
  
  return (
    <div class="not-inspectable-view">
      <span class="warning-icon">⚠️</span>
      <p class="warning-title">{t('editor.objectInspector.notInspectable.title')}</p>
      <small class="warning-description">{t('editor.objectInspector.notInspectable.description')}</small>
    </div>
  );
}
