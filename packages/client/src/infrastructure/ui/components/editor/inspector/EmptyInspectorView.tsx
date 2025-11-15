/** @jsxImportSource preact */
import { h } from 'preact';
import { useI18n } from '@client/infrastructure/ui/hooks/useI18n';
import './empty-inspector-view.css';

/**
 * Display when no object selected
 * 
 * Empty state for object inspector
 */
export function EmptyInspectorView() {
  const { t } = useI18n();
  
  return (
    <div class="empty-inspector-view">
      <span class="empty-icon">👁️</span>
      <p class="empty-title">{t('editor.objectInspector.noSelection')}</p>
      <small class="empty-description">{t('editor.objectInspector.selectFromHierarchy')}</small>
    </div>
  );
}
