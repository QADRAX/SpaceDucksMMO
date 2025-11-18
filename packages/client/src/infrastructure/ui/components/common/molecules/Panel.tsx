import { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import './panel.css';
import { Card } from '../atoms/Card';

export interface PanelProps {
  title?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
  showClose?: boolean;
  headerOnMouseDown?: (e: JSX.TargetedMouseEvent<HTMLDivElement>) => void;
  children?: ComponentChildren;
  className?: string;
}

export function Panel({ title, collapsible = true, collapsed: collapsedProp, onToggle, onClose, showClose, headerOnMouseDown, children, className = '' }: PanelProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isControlled = typeof collapsedProp === 'boolean';
  const collapsed = isControlled ? (collapsedProp as boolean) : internalCollapsed;

  const toggle = () => {
    if (isControlled) {
      onToggle && onToggle();
    } else {
      setInternalCollapsed((s) => !s);
      onToggle && onToggle();
    }
  };

  return (
    <Card className={`sd-panel ${className}`} variant="panel">
      <div
        className={`panel-header ${headerOnMouseDown ? 'draggable' : ''}`}
        onMouseDown={(e: JSX.TargetedMouseEvent<HTMLDivElement>) => headerOnMouseDown && headerOnMouseDown(e)}
      >
        <span className="panel-title">{title}</span>
        <div className="panel-controls">
          {collapsible && (
            <button className="panel-control-btn collapse-btn" onClick={toggle} title={collapsed ? 'Expand' : 'Collapse'}>
              {collapsed ? '▼' : '▲'}
            </button>
          )}

          {/* Close button: if provided via props, render it and call onClose (stop event propagation) */}
          {showClose && onClose && (
            <button
              className="panel-control-btn close-btn"
              onClick={(e) => {
                e.stopPropagation();
                try { onClose && onClose(); } catch {}
              }}
              title="Close"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {!collapsed && <div className="panel-content">{children}</div>}
    </Card>
  );
}

