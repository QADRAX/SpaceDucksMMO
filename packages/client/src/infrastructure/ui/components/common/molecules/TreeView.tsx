import { useState, useRef, useEffect, useMemo } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import './TreeView.css';

export type TreeNodeData = {
  id: string;
  label: string;
  icon?: ComponentChildren;
  children?: TreeNodeData[];
};

type TreeViewProps = {
  nodes: TreeNodeData[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  defaultExpandedIds?: string[];
  className?: string;
  draggable?: boolean;
  onDropNode?: (childId: string, newParentId: string | null) => void;
};

export function TreeView({ nodes, selectedId, onSelect, defaultExpandedIds = [], className = '', draggable = false, onDropNode }: TreeViewProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(defaultExpandedIds));
  const nodeRefs = useRef<Record<string, HTMLElement | null>>({});
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Build a flattened list of visible node ids in render order
  const buildVisible = (ns: TreeNodeData[], acc: string[] = []) => {
    for (const n of ns) {
      acc.push(n.id);
      if (n.children && n.children.length > 0 && expandedIds.has(n.id)) {
        buildVisible(n.children, acc);
      }
    }
    return acc;
  };

  const visibleIds = useMemo(() => buildVisible(nodes, []), [nodes, expandedIds]);

  const [focusedId, setFocusedId] = useState<string | null>(() => (visibleIds.length > 0 ? visibleIds[0] : null));

  useEffect(() => {
    // Ensure focusedId is valid when visibleIds change
    if (focusedId == null && visibleIds.length > 0) {
      setFocusedId(visibleIds[0]);
    } else if (focusedId != null && !visibleIds.includes(focusedId) && visibleIds.length > 0) {
      setFocusedId(visibleIds[0]);
    }
  }, [visibleIds.join(',')]);

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleClick = (node: TreeNodeData) => {
    if (node.children && node.children.length > 0) toggle(node.id);
    onSelect && onSelect(node.id);
    setFocusedId(node.id);
    // focus DOM element if available
    nodeRefs.current[node.id]?.focus();
  };

  const renderNode = (node: TreeNodeData, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const isSelected = selectedId === node.id;

    const iconElement = hasChildren ? (
      // chevron for expandable nodes
      <svg className={`tree-icon-chev ${isExpanded ? 'expanded' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ) : (
      // leaf dot for leaf nodes
      <svg className="tree-icon-leaf" width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="12" cy="12" r="3" fill="currentColor" />
      </svg>
    );

    return (
      <div
        key={node.id}
        className={`tree-node ${hasChildren ? 'tree-node--has-children' : ''} ${isSelected ? 'tree-node--selected' : ''} ${dragOverId === node.id ? 'tree-node--drag-over' : ''}`}
        role="treeitem"
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-selected={isSelected}
      >
        <div
          className="tree-node-label"
          style={{ paddingLeft: `${depth * 12}px` }}
          draggable={draggable}
          onDragStart={(e: JSX.TargetedEvent<HTMLDivElement, DragEvent>) => {
            if (!draggable) return;
            setIsDragging(true);
            try {
              e.dataTransfer?.setData('application/x-entity-id', node.id);
              if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
            } catch {}
            try {
              // Ensure a drag image exists (helps in some Electron/Chromium contexts)
              const dt = (e as unknown as DragEvent).dataTransfer;
              if (dt && typeof dt.setDragImage === 'function') {
                const img = new Image();
                img.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='; // 1x1 transparent
                try { dt.setDragImage(img, 0, 0); } catch {}
              }
            } catch {}
            try {
              // debug hook to help diagnose drag issues in dev
              if (typeof window !== 'undefined') console.debug('TreeView: dragstart', node.id);
            } catch {}
          }}
          onDragEnd={() => {
            setIsDragging(false);
            setDragOverId(null);
          }}
          onDragOver={(e: JSX.TargetedEvent<HTMLDivElement, DragEvent>) => {
            if (!draggable) return;
            e.preventDefault();
            if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
            setDragOverId(node.id);
          }}
          onDragLeave={(_e: JSX.TargetedEvent<HTMLDivElement, DragEvent>) => {
            if (!draggable) return;
            setDragOverId((prev) => (prev === node.id ? null : prev));
          }}
          onDrop={(e: JSX.TargetedEvent<HTMLDivElement, DragEvent>) => {
            if (!draggable) return;
            e.preventDefault();
            e.stopPropagation();
            const childId = e.dataTransfer?.getData('application/x-entity-id');
            setDragOverId(null);
            setIsDragging(false);
            try { if (typeof window !== 'undefined') console.debug('TreeView: drop on', node.id, 'childId=', childId); } catch {}
            if (childId && onDropNode && childId !== node.id) onDropNode(childId, node.id);
          }}
        >
          <span className={`tree-node-icon ${hasChildren ? 'has-children' : 'leaf'}`}>
            {iconElement}
          </span>
          {/* entity-specific icon (if provided) */}
          {node.icon && (
            <span className="tree-node-entity-icon" aria-hidden="true">{node.icon}</span>
          )}
          <span
            ref={(el) => { nodeRefs.current[node.id] = el; }}
            tabIndex={0}
            className="tree-node-title"
            onClick={() => handleClick(node)}
            onKeyDown={(e: JSX.TargetedEvent<HTMLElement, KeyboardEvent>) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick(node);
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                const idx = visibleIds.indexOf(node.id);
                const next = visibleIds[idx + 1];
                if (next) {
                  setFocusedId(next);
                  nodeRefs.current[next]?.focus();
                }
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const idx = visibleIds.indexOf(node.id);
                const prev = visibleIds[idx - 1];
                if (prev) {
                  setFocusedId(prev);
                  nodeRefs.current[prev]?.focus();
                }
              }
            }}
          >
            {node.label}
          </span>
        </div>

        {hasChildren && isExpanded && (
          <div className="tree-node-children" role="group">
            {node.children!.map((c) => renderNode(c, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`sd-treeview ${className} ${isDragging ? 'sd-treeview--dragging' : ''}`.trim()}
      role="tree"
      onDragOver={(e: JSX.TargetedEvent<HTMLDivElement, DragEvent>) => {
        // allow dropping on empty area to clear parent
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(e: JSX.TargetedEvent<HTMLDivElement, DragEvent>) => {
        e.preventDefault();
        const childId = e.dataTransfer?.getData('application/x-entity-id');
        setDragOverId(null);
        if (childId && onDropNode) onDropNode(childId, null);
      }}
    >
      {/* visible drop zone to remove parent - only when dragging or hovered */}
      {draggable && onDropNode && (isDragging || dragOverId === '__dropzone') && (
        <div
          className="tree-empty-dropzone"
          role="button"
          tabIndex={0}
          onDragOver={(e: JSX.TargetedEvent<HTMLDivElement, DragEvent>) => {
            e.preventDefault();
            if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
            setDragOverId('__dropzone');
          }}
          onDragLeave={() => setDragOverId((prev) => (prev === '__dropzone' ? null : prev))}
          onDrop={(e: JSX.TargetedEvent<HTMLDivElement, DragEvent>) => {
            e.preventDefault();
            const childId = e.dataTransfer?.getData('application/x-entity-id');
            setDragOverId(null);
            if (childId && onDropNode) onDropNode(childId, null);
          }}
        >
          Drop here to remove parent
        </div>
      )}

      {nodes.map((n) => renderNode(n, 0))}
    </div>
  );
}

// Named export only (per UI styleguide)
