/** @jsxImportSource preact */
import { h } from 'preact';
import { useI18n } from '@client/infrastructure/ui/hooks/useI18n';
import './empty-components-view.css';

/**
 * Display when no components added
 * 
 * Empty state for component list
 */
export function EmptyComponentsView() {
  const { t } = useI18n();
  
  return (
    <div class="empty-components-view">
      <span class="empty-icon">📦</span>
      <p class="empty-title">{t('editor.components.empty.title')}</p>
      <small class="empty-description">{t('editor.components.empty.description')}</small>
    </div>
  );
}
