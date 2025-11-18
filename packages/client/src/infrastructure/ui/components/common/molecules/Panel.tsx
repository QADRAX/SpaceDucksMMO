import { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import './panel.css';
import { Card } from '../atoms/Card';

export interface PanelProps {
  title?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
  headerOnMouseDown?: (e: JSX.TargetedMouseEvent<HTMLDivElement>) => void;
  children?: ComponentChildren;
  className?: string;
}

export function Panel({ title, collapsible = true, collapsed: collapsedProp, onToggle, headerOnMouseDown, children, className = '' }: PanelProps) {
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
        </div>
      </div>

      {!collapsed && <div className="panel-content">{children}</div>}
    </Card>
  );
}

