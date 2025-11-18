/** @jsxImportSource preact */
import { h } from 'preact';
import { render, cleanup, fireEvent } from '@testing-library/preact';
import { TreeView, TreeNodeData } from './TreeView';

afterEach(() => cleanup());

describe('TreeView', () => {
  it('expands/collapses nodes and calls onSelect when clicked', () => {
    const nodes: TreeNodeData[] = [
      { id: '1', label: 'Root', children: [{ id: '1-1', label: 'Child' }] },
    ];

    const onSelect = jest.fn();
    const { queryByText, getByText } = render(
      <TreeView nodes={nodes} onSelect={onSelect} />
    );

    // child not visible initially
    expect(queryByText('Child')).toBeNull();

    // click root to expand and select
    fireEvent.click(getByText('Root'));
    expect(onSelect).toHaveBeenCalledWith('1');
    expect(queryByText('Child')).not.toBeNull();

    // click root again to collapse
    fireEvent.click(getByText('Root'));
    expect(queryByText('Child')).toBeNull();
  });

  it('supports keyboard navigation (ArrowDown/ArrowUp) and Enter to select', () => {
    const nodes: TreeNodeData[] = [
      { id: 'a', label: 'A', children: [{ id: 'a1', label: 'A1' }] },
      { id: 'b', label: 'B' },
    ];

    const onSelect = jest.fn();
    const { getByText } = render(<TreeView nodes={nodes} onSelect={onSelect} defaultExpandedIds={['a']} />);

    const a = getByText('A');
    const a1 = getByText('A1');
    const b = getByText('B');

    // focus A
    a.focus();

    // ArrowDown moves focus to A1
    fireEvent.keyDown(a, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(a1);

    // ArrowDown moves focus to B
    fireEvent.keyDown(a1, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(b);

    // ArrowUp moves focus back to A1
    fireEvent.keyDown(b, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(a1);

    // Enter selects focused node
    fireEvent.keyDown(a1, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith('a1');
  });
});
