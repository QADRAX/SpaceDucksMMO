import { h, ComponentChildren } from 'preact';
import { useState, useRef, useEffect } from 'preact/hooks';
import './draggable-panel.css';

export type PanelTheme = 'blue' | 'pink' | 'green' | 'gold';

export interface DraggablePanelProps {
  title: string;
  theme?: PanelTheme;
  collapsible?: boolean;
  resizable?: boolean;
  draggable?: boolean;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  minWidth?: number;
  minHeight?: number;
  children: ComponentChildren;
}

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

export function DraggablePanel(props: DraggablePanelProps) {
  const {
    title,
    theme = 'blue',
    collapsible = true,
    resizable = true,
    draggable = true,
    defaultPosition = { x: 20, y: 80 },
    defaultSize = { width: 280, height: 500 },
    minWidth = 200,
    minHeight = 150,
    children,
  } = props;

  const [position, setPosition] = useState<Position>(defaultPosition);
  const [size, setSize] = useState<Size>(defaultSize);
  const [collapsed, setCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  const panelRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  // Dragging logic
  const handleDragStart = (e: MouseEvent) => {
    if (!draggable) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleDragMove = (e: MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    
    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;
    
    // Keep panel within viewport
    const maxX = window.innerWidth - 100;
    const maxY = window.innerHeight - 50;
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  // Resizing logic
  const handleResizeStart = (e: MouseEvent) => {
    if (!resizable) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    };
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing || !resizeStartRef.current) return;
    
    const deltaX = e.clientX - resizeStartRef.current.x;
    const deltaY = e.clientY - resizeStartRef.current.y;
    
    const newWidth = Math.max(minWidth, resizeStartRef.current.width + deltaX);
    const newHeight = Math.max(minHeight, resizeStartRef.current.height + deltaY);
    
    setSize({ width: newWidth, height: newHeight });
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    resizeStartRef.current = null;
  };

  // Mouse event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, position]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, size]);

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const panelStyle = {
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: `${size.width}px`,
    height: collapsed ? 'auto' : `${size.height}px`,
  };

  return (
    <div
      ref={panelRef}
      class={`draggable-panel draggable-panel-${theme} ${collapsed ? 'collapsed' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
      style={panelStyle}
    >
      <div
        class={`panel-header ${draggable ? 'draggable' : ''}`}
        onMouseDown={draggable ? handleDragStart : undefined}
      >
        <span class="panel-title">{title}</span>
        <div class="panel-controls">
          {collapsible && (
            <button
              class="panel-control-btn collapse-btn"
              onClick={toggleCollapse}
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? '▼' : '▲'}
            </button>
          )}
        </div>
      </div>
      
      {!collapsed && (
        <div class="panel-content">
          {children}
        </div>
      )}
      
      {resizable && !collapsed && (
        <div
          class="resize-handle"
          onMouseDown={handleResizeStart}
          title="Drag to resize"
        />
      )}
    </div>
  );
}
