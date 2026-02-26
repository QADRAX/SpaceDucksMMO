'use client';

import * as React from 'react';
import { useSceneEditorV2Context } from '../../SceneEditorV2Context';
import { SCENE_NODE_ID } from '../../types';
import { SceneInspectorPanel } from './SceneInspectorPanel';
import {
    getRememberedScrollTop,
    getRememberedTab,
    setRememberedScrollTop,
    setRememberedTab,
    type InspectorTab,
} from './inspectorUiMemory';
import { EntityInspector } from '../inspector/EntityInspector';
import { ComponentList } from '../inspector/ComponentList';
import { EditorPanelSlot } from '../../plugins/EditorPanelSlot';

export function InspectorPanel() {
    const editor = useSceneEditorV2Context();
    const selected = editor.selectedEntity;
    const isLive = editor.gameState !== 'stopped';

    // Force re-render on per-entity debug flag changes.
    void editor.presentationRevision;

    const referenceOptions = React.useMemo(() => {
        const out: any[] = [];
        const visit = (ent: any, depth: number) => {
            const id = String(ent?.id ?? '');
            if (!id) return;
            const dn = typeof ent?.displayName === 'string' ? ent.displayName.trim() : '';
            const label = dn ? dn : id;
            out.push({
                id,
                label,
                depth,
                icon: typeof ent?.gizmoIcon === 'string' ? ent.gizmoIcon : undefined,
            });

            const kids = typeof ent?.getChildren === 'function' ? ent.getChildren() : [];
            if (Array.isArray(kids) && kids.length) {
                for (const c of kids) visit(c, depth + 1);
            }
        };

        for (const r of editor.hierarchyRoots) visit(r as any, 0);
        return out;
    }, [editor.hierarchyRoots, editor.sceneRevision]);

    const selectionKey = editor.selectedId ?? '__none__';
    const scrollRef = React.useRef<HTMLDivElement | null>(null);
    const [tab, setTabState] = React.useState<InspectorTab>(() => getRememberedTab(selectionKey, 'entity'));

    React.useEffect(() => {
        setTabState(getRememberedTab(selectionKey, 'entity'));
    }, [selectionKey]);

    const setTab = (next: InspectorTab) => {
        setTabState(next);
        setRememberedTab(selectionKey, next);
    };

    React.useLayoutEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        if (editor.selectedId === SCENE_NODE_ID) return;
        const remembered = getRememberedScrollTop(selectionKey, tab);
        if (Math.abs(el.scrollTop - remembered) > 1) el.scrollTop = remembered;
    }, [selectionKey, tab, editor.sceneRevision, selected?.getAllComponents().length]);

    if (editor.selectedId === SCENE_NODE_ID) {
        return <SceneInspectorPanel />;
    }

    const selectedComponents = selected ? selected.getAllComponents().filter((c: any) => c.type !== 'name') : [];
    const creatableComponents = selected && editor.factory ? editor.factory.listCreatableComponents(selected as any) : [];

    return (
        <div className="flex h-full flex-col overflow-hidden text-neutral-800">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b-2 border-black bg-black px-3 py-1.5">
                <span className="text-xs font-black uppercase tracking-widest text-white truncate">
                    Inspector {selected?.displayName ? `— ${selected.displayName}` : (selected ? `— ${selected.id}` : '')}
                </span>
                {isLive && (
                    <span className="border border-amber-400 bg-amber-400 px-1.5 py-0.5 text-xs font-black uppercase text-black">
                        Live
                    </span>
                )}
            </div>

            {!selected ? (
                <div className="flex flex-1 items-center justify-center p-4 text-center text-xs font-bold uppercase tracking-widest text-black/30">
                    Nothing selected
                </div>
            ) : (
                <>
                    <div className="flex shrink-0 border-b border-black/10 bg-black/5">
                        {[{ value: 'entity', label: 'Entity' }, { value: 'components', label: 'Components' }].map((t) => (
                            <button
                                key={t.value}
                                className={`flex-1 px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${tab === t.value
                                    ? 'bg-white border-b-2 border-main text-main'
                                    : 'text-black/50 hover:bg-black/10 hover:text-black'
                                    }`}
                                onClick={() => setTab(t.value as any)}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div
                        ref={scrollRef}
                        className="scrollbar min-h-0 flex-1 overflow-y-auto"
                        onScroll={(e) => {
                            if (editor.selectedId === SCENE_NODE_ID) return;
                            setRememberedScrollTop(selectionKey, tab, (e.currentTarget as HTMLDivElement).scrollTop);
                        }}
                    >
                        <div className="flex flex-col">
                            {tab === 'entity' ? (
                                <EntityInspector selected={selected} editor={editor} />
                            ) : null}

                            {tab === 'components' ? (
                                <>
                                    <ComponentList
                                        selectedComponents={selectedComponents}
                                        creatableComponents={creatableComponents}
                                        editor={editor}
                                        selectionKey={selectionKey}
                                        tab={tab === 'components' ? 'components' : ''}
                                        referenceOptions={referenceOptions}
                                    />
                                    <EditorPanelSlot slotId="inspector.after-components" />
                                </>
                            ) : null}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
