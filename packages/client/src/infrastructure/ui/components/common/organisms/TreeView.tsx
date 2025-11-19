import { h, VNode } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import './tree-view.css';
import { TreeViewNodeRow } from '../molecules/TreeViewNodeRow';

export type TreeNodeId = string;

export type TreeNode<TExtra = unknown> = {
  id: TreeNodeId;
  parentId: TreeNodeId | null;
  label: string;
  icon?: VNode;
  data?: TExtra;
};

export type TreeViewProps<TExtra = unknown> = {
  nodes: TreeNode<TExtra>[];

  selectedId?: TreeNodeId | null;
  onSelect?: (id: TreeNodeId | null, node: TreeNode<TExtra> | null) => void;

  onReparent?: (params: {
    draggedId: TreeNodeId;
    newParentId: TreeNodeId | null;
    beforeId?: TreeNodeId | null;
    afterId?: TreeNodeId | null;
  }) => void;

  canDropOnNode?: (
    dragged: TreeNode<TExtra>,
    target: TreeNode<TExtra>
  ) => boolean;

  renderNodeContent?: (
    node: TreeNode<TExtra>,
    depth: number,
    isSelected: boolean
  ) => VNode;

  className?: string;
};

function buildMaps<TExtra>(nodes: TreeNode<TExtra>[]) {
  const byId = new Map<TreeNodeId, TreeNode<TExtra>>();
  const children = new Map<TreeNodeId | null, TreeNode<TExtra>[]>();
  nodes.forEach((n) => {
    byId.set(n.id, n);
    const list = children.get(n.parentId) || [];
    list.push(n);
    children.set(n.parentId, list);
  });
  return { byId, children };
}

export function TreeView<TExtra = unknown>(props: TreeViewProps<TExtra>) {
  const {
    nodes,
    selectedId,
    onSelect,
    onReparent,
    canDropOnNode,
    renderNodeContent,
    className,
  } = props;

  const { byId, children } = useMemo(() => buildMaps(nodes), [nodes]);

  // dragging state for visual feedback
  const [draggingId, setDraggingId] = useState<TreeNodeId | null>(null);
  const [hoverTargetId, setHoverTargetId] = useState<TreeNodeId | null>(null);
  const [hoverRootIndex, setHoverRootIndex] = useState<number | null>(null);

  const isDescendant = (ancestorId: TreeNodeId, candidateId: TreeNodeId): boolean => {
    const stack = children.get(ancestorId) || [];
    for (const c of stack) {
      if (c.id === candidateId) return true;
      if (isDescendant(c.id, candidateId)) return true;
    }
    return false;
  };

  const handleDragStart = (e: DragEvent, id: TreeNodeId) => {
    setDraggingId(id);
    try {
      e.dataTransfer?.setData('application/x-tree-node-id', id);
      e.dataTransfer!.effectAllowed = 'move';
    } catch {}
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setHoverTargetId(null);
    setHoverRootIndex(null);
  };

  const handleNodeDragOver = (e: DragEvent, targetId: TreeNodeId) => {
    e.preventDefault();
    setHoverTargetId(targetId);
    setHoverRootIndex(null);
    try {
      e.dataTransfer && (e.dataTransfer.dropEffect = 'move');
    } catch {}
  };

  const handleNodeDrop = (e: DragEvent, targetId: TreeNodeId) => {
    e.preventDefault();
    const draggedId = (e.dataTransfer && e.dataTransfer.getData('application/x-tree-node-id')) || draggingId;
    if (!draggedId) {
      handleDragEnd();
      return;
    }
    if (draggedId === targetId) {
      handleDragEnd();
      return;
    }
    const draggedNode = byId.get(draggedId);
    const targetNode = byId.get(targetId);
    if (!draggedNode || !targetNode) {
      handleDragEnd();
      return;
    }
    // prevent dropping into its own descendant
    if (isDescendant(draggedId, targetId)) {
      handleDragEnd();
      return;
    }

    if (canDropOnNode && !canDropOnNode(draggedNode, targetNode)) {
      handleDragEnd();
      return;
    }

    onReparent && onReparent({ draggedId, newParentId: targetId });
    handleDragEnd();
  };

  const rootNodes = children.get(null) || [];

  const handleRootDragOver = (e: DragEvent, index: number) => {
    e.preventDefault();
    setHoverRootIndex(index);
    setHoverTargetId(null);
  };

  const handleRootDrop = (e: DragEvent, index: number) => {
    e.preventDefault();
    const draggedId = (e.dataTransfer && e.dataTransfer.getData('application/x-tree-node-id')) || draggingId;
    if (!draggedId) {
      handleDragEnd();
      return;
    }
    const draggedNode = byId.get(draggedId);
    if (!draggedNode) {
      handleDragEnd();
      return;
    }
    // Moving to root
    onReparent && onReparent({ draggedId, newParentId: null, beforeId: rootNodes[index]?.id ?? null });
    handleDragEnd();
  };

  const renderNode = (node: TreeNode<TExtra>, depth: number) => {
    const nodeChildren = children.get(node.id) || [];
    const isSelected = selectedId === node.id;
    const canDrop = (() => {
      if (!draggingId) return true;
      const dragged = byId.get(draggingId);
      if (!dragged) return false;
      if (dragged.id === node.id) return false;
      if (isDescendant(dragged.id, node.id)) return false;
      return canDropOnNode ? canDropOnNode(dragged, node) : true;
    })();

    return (
      <div key={node.id} className="tree-node">
        <TreeViewNodeRow
          node={node}
          depth={depth}
          isSelected={isSelected}
          onSelect={onSelect}
          onDragStart={handleDragStart}
          onDragOver={handleNodeDragOver}
          onDrop={handleNodeDrop}
          canDrop={canDrop}
          isDropTarget={hoverTargetId === node.id}
          renderContent={renderNodeContent}
        />
        {nodeChildren.length > 0 && (
          <div className="tree-node-children">
            {nodeChildren.map((c) => renderNode(c, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`tree-view ${className || ''}`.trim()} role="tree">
      {/* root dropzone before first */}
      {rootNodes.length === 0 && (
        <div
          className={`tree-root-dropzone ${hoverRootIndex === 0 ? 'tree-root-dropzone--active' : ''}`}
          onDragOver={(e: DragEvent) => handleRootDragOver(e, 0)}
          onDrop={(e: DragEvent) => handleRootDrop(e, 0)}
        >
          <div className="tree-root-dropzone__label">&nbsp;</div>
        </div>
      )}
      {rootNodes.map((n, idx) => (
        <div key={n.id} className="tree-root-row">
          <div
            className={`tree-root-dropzone ${hoverRootIndex === idx ? 'tree-root-dropzone--active' : ''}`}
            onDragOver={(e: DragEvent) => handleRootDragOver(e, idx)}
            onDrop={(e: DragEvent) => handleRootDrop(e, idx)}
          >
            <div className="tree-root-dropzone__label">&nbsp;</div>
          </div>
          {renderNode(n, 0)}
        </div>
      ))}
      {/* trailing root dropzone */}
      <div
        className={`tree-root-dropzone ${hoverRootIndex === rootNodes.length ? 'tree-root-dropzone--active' : ''}`}
        onDragOver={(e: DragEvent) => handleRootDragOver(e, rootNodes.length)}
        onDrop={(e: DragEvent) => handleRootDrop(e, rootNodes.length)}
      >
        <div className="tree-root-dropzone__label">&nbsp;</div>
      </div>
    </div>
  );
}

export default TreeView;
