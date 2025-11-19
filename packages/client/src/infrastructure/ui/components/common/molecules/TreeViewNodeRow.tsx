import { h, VNode } from 'preact';
import { JSX } from 'preact/jsx-runtime';
import './tree-view-node-row.css';

import type { TreeNode, TreeNodeId } from '../../organisms/TreeView';

type Props<TExtra = unknown> = {
  node: TreeNode<TExtra>;
  depth: number;
  isSelected?: boolean;
  onSelect?: (id: TreeNodeId | null, node: TreeNode<TExtra> | null) => void;

  // Drag handlers provided by the parent (TreeView)
  onDragStart?: (e: DragEvent, id: TreeNodeId) => void;
  onDragOver?: (e: DragEvent, id: TreeNodeId) => void;
  onDrop?: (e: DragEvent, id: TreeNodeId) => void;

  // Visual state controlled by parent
  canDrop?: boolean;
  isDropTarget?: boolean;

  renderContent?: (
    node: TreeNode<TExtra>,
    depth: number,
    isSelected: boolean
  ) => VNode | string | null;

  className?: string;
};

export function TreeViewNodeRow<TExtra = unknown>(props: Props<TExtra>) {
  const {
    node,
    depth,
    isSelected = false,
    onSelect,
    onDragStart,
    onDragOver,
    onDrop,
    canDrop = true,
    isDropTarget = false,
    renderContent,
    className,
  } = props;

  const handleClick = (ev: MouseEvent) => {
    ev.stopPropagation();
    onSelect && onSelect(node.id, node);
  };

  const handleDragStart = (e: DragEvent) => {
    e.stopPropagation();
    try {
      e.dataTransfer?.setData('application/x-tree-node-id', node.id);
      e.dataTransfer!.effectAllowed = 'move';
    } catch {}
    onDragStart && onDragStart(e, node.id);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer && (e.dataTransfer.dropEffect = canDrop ? 'move' : 'none');
    onDragOver && onDragOver(e, node.id);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDrop && onDrop(e, node.id);
  };

  const content = renderContent
    ? renderContent(node, depth, !!isSelected)
    : (
        <>
          {node.icon && <span className="tree-node-row__icon">{node.icon}</span>}
          <span className="tree-node-row__label">{node.label}</span>
        </>
      );

  return (
    <div
      className={`tree-node-row ${isSelected ? 'selected' : ''} ${
        isDropTarget ? 'drop-target' : ''
      } ${className || ''}`.trim()}
      draggable={true}
      onClick={handleClick as any}
      onDragStart={handleDragStart as any}
      onDragOver={handleDragOver as any}
      onDrop={handleDrop as any}
      role="treeitem"
      aria-selected={isSelected}
    >
      <div
        className="tree-node-row__indent"
        style={{ width: `${depth * 12}px` }}
      />
      <div className="tree-node-row__content">{content}</div>
    </div>
  );
}

export default TreeViewNodeRow;
