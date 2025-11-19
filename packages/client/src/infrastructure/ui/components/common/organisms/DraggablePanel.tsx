import { h, ComponentChildren } from 'preact';
import { useState, useRef, useEffect } from 'preact/hooks';
import './draggable-panel.css';
import { Panel } from '../molecules/Panel';

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
  maxWidth?: number | null;
  maxHeight?: number | null;
  children: ComponentChildren;
  className?: string;
  onClose?: () => void;
  showClose?: boolean;
  onPositionChange?: (pos: { x: number; y: number }) => void;
}

interface Position { x: number; y: number }
interface Size { width: number; height: number }

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
      maxWidth = null,
      maxHeight = null,
    children,
    className = '',
    onClose,
    showClose = false,
    onPositionChange,
  } = props;

  const [position, setPosition] = useState<Position>(defaultPosition);
  const [size, setSize] = useState<Size>(() => ({
    width: Math.min(defaultSize.width, maxWidth ?? defaultSize.width),
    height: Math.min(defaultSize.height, maxHeight ?? defaultSize.height),
  }));
  const [collapsed, setCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  const panelRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  const handleDragStart = (e: MouseEvent) => {
    if (!draggable) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleDragMove = (e: MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;
    const panelWidth = Math.min(size.width, maxWidth ?? size.width);
    const panelHeight = Math.min(size.height, maxHeight ?? size.height);
    const maxX = Math.max(0, window.innerWidth - panelWidth - 20);
    const maxY = Math.max(0, window.innerHeight - panelHeight - 20);
    const clamped = { x: Math.max(0, Math.min(newX, maxX)), y: Math.max(0, Math.min(newY, maxY)) };
    setPosition(clamped);
    onPositionChange && onPositionChange(clamped);
  };

  const handleDragEnd = () => { setIsDragging(false); dragStartRef.current = null; };

  const handleResizeStart = (e: MouseEvent) => {
    if (!resizable) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = { x: e.clientX, y: e.clientY, width: size.width, height: size.height };
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing || !resizeStartRef.current) return;
    const deltaX = e.clientX - resizeStartRef.current.x;
    const deltaY = e.clientY - resizeStartRef.current.y;
    let newWidth = Math.max(minWidth, resizeStartRef.current.width + deltaX);
    let newHeight = Math.max(minHeight, resizeStartRef.current.height + deltaY);
    if (maxWidth != null) newWidth = Math.min(newWidth, maxWidth);
    if (maxHeight != null) newHeight = Math.min(newHeight, maxHeight);
    setSize({ width: newWidth, height: newHeight });
  };

  const handleResizeEnd = () => { setIsResizing(false); resizeStartRef.current = null; };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      return () => { window.removeEventListener('mousemove', handleDragMove); window.removeEventListener('mouseup', handleDragEnd); };
    }
  }, [isDragging, position, onPositionChange]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => { window.removeEventListener('mousemove', handleResizeMove); window.removeEventListener('mouseup', handleResizeEnd); };
    }
  }, [isResizing, size]);

  const toggleCollapse = () => setCollapsed(!collapsed);

  const panelStyle = {
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: `${Math.min(size.width, maxWidth ?? size.width)}px`,
    height: collapsed ? 'auto' : `${Math.min(size.height, maxHeight ?? size.height)}px`,
  };

  // Notify parent when position changes (also covers programmatic changes)
  useEffect(() => {
    onPositionChange && onPositionChange(position);
  }, [position, onPositionChange]);

  return (
    <div
      ref={panelRef}
      class={`draggable-panel draggable-panel-${theme} ${collapsed ? 'collapsed' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${className}`.trim()}
      style={panelStyle}
    >
      <Panel
        title={title}
        collapsible={collapsible}
        collapsed={collapsed}
        onToggle={toggleCollapse}
        onClose={onClose}
        showClose={showClose}
        headerOnMouseDown={draggable ? handleDragStart : undefined}
      >
        {children}
      </Panel>

      {resizable && !collapsed && <div class="resize-handle" onMouseDown={handleResizeStart} title="Drag to resize" />}
    </div>
  );
}
