import * as React from 'react';
import { useSceneEditorV2Context } from '../../SceneEditorV2Context';

interface HierarchyContextValue {
    isExpanded: (id: string) => boolean;
    toggleExpanded: (id: string) => void;
    dragOverId: string | null;
    setDragOverId: (id: string | null) => void;
    handleDropToParent: (newParentId: string | null, e: React.DragEvent) => void;
}

const HierarchyContext = React.createContext<HierarchyContextValue | null>(null);

export function useHierarchyContext() {
    const ctx = React.useContext(HierarchyContext);
    if (!ctx) throw new Error('useHierarchyContext must be used within HierarchyProvider');
    return ctx;
}

export function HierarchyProvider({ children }: { children: React.ReactNode }) {
    const editor = useSceneEditorV2Context();
    const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});
    const [dragOverId, setDragOverId] = React.useState<string | null>(null);

    // Reset hover state on scene rebuild.
    React.useEffect(() => {
        setDragOverId(null);
    }, [editor.sceneRevision]);

    const isExpanded = React.useCallback((id: string) => collapsed[id] !== true, [collapsed]);

    const toggleExpanded = React.useCallback((id: string) => {
        setCollapsed((prev) => ({ ...prev, [id]: prev[id] !== true }));
    }, []);

    const handleDropToParent = React.useCallback(
        (newParentId: string | null, e: React.DragEvent) => {
            e.preventDefault();
            const draggedId = e.dataTransfer.getData('text/plain');
            setDragOverId(null);
            if (!draggedId) return;
            if (draggedId === newParentId) return;
            editor.onReparentEntity(draggedId, newParentId);
        },
        [editor]
    );

    const value = React.useMemo(
        () => ({
            isExpanded,
            toggleExpanded,
            dragOverId,
            setDragOverId,
            handleDropToParent,
        }),
        [isExpanded, toggleExpanded, dragOverId, handleDropToParent]
    );

    return <HierarchyContext.Provider value={value}>{children}</HierarchyContext.Provider>;
}
