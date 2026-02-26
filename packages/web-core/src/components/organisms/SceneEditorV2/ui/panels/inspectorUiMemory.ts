export type InspectorTab = 'entity' | 'components' | 'scene';

const MEMORY_KEY = '___duck_editor_inspector_memory_v2';

interface MemoryState {
    tabByEntity: Record<string, InspectorTab>;
    scrollTopByEntityTab: Record<string, number>;
}

function getMemory(): MemoryState {
    try {
        const stored = localStorage.getItem(MEMORY_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        // ignore
    }
    return {
        tabByEntity: {},
        scrollTopByEntityTab: {},
    };
}

function setMemory(state: MemoryState) {
    try {
        localStorage.setItem(MEMORY_KEY, JSON.stringify(state));
    } catch (e) {
        // ignore
    }
}

export function getRememberedTab(entityId: string, fallback: InspectorTab): InspectorTab {
    const mem = getMemory();
    return mem.tabByEntity[entityId] ?? fallback;
}

export function setRememberedTab(entityId: string, tab: InspectorTab) {
    const mem = getMemory();
    mem.tabByEntity[entityId] = tab;
    setMemory(mem);
}

export function getRememberedScrollTop(entityId: string, tab: InspectorTab): number {
    const mem = getMemory();
    return mem.scrollTopByEntityTab[`${entityId}::${tab}`] ?? 0;
}

export function setRememberedScrollTop(entityId: string, tab: InspectorTab, scrollTop: number) {
    const mem = getMemory();
    mem.scrollTopByEntityTab[`${entityId}::${tab}`] = scrollTop;
    setMemory(mem);
}
