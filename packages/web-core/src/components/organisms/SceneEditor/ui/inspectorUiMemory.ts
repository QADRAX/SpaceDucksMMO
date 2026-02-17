export type InspectorTab = 'entity' | 'components';

type ScrollArea = InspectorTab | 'scene';

const tabBySelectionKey = new Map<string, InspectorTab>();
const scrollTopBySelectionKeyAndArea = new Map<string, number>();

function scrollKey(selectionKey: string, area: ScrollArea): string {
  return `${selectionKey}::${area}`;
}

export function getRememberedTab(selectionKey: string, fallback: InspectorTab = 'entity'): InspectorTab {
  return tabBySelectionKey.get(selectionKey) ?? fallback;
}

export function setRememberedTab(selectionKey: string, tab: InspectorTab): void {
  tabBySelectionKey.set(selectionKey, tab);
}

export function getRememberedScrollTop(selectionKey: string, area: ScrollArea): number {
  return scrollTopBySelectionKeyAndArea.get(scrollKey(selectionKey, area)) ?? 0;
}

export function setRememberedScrollTop(selectionKey: string, area: ScrollArea, scrollTop: number): void {
  const next = Number.isFinite(scrollTop) ? Math.max(0, scrollTop) : 0;
  scrollTopBySelectionKeyAndArea.set(scrollKey(selectionKey, area), next);
}
