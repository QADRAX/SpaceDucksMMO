'use client';

import * as React from 'react';
import { PanelTabs } from '@/components/molecules/PanelTabs';
import { useEcsTreeEditorContext } from '../EcsTreeEditorContext';
import { SCENE_NODE_ID } from '../types';
import { SceneInspectorPanel } from './SceneInspectorPanel';
import {
  getRememberedScrollTop,
  getRememberedTab,
  setRememberedScrollTop,
  setRememberedTab,
  type InspectorTab,
} from './inspectorUiMemory';
import { InspectorHeader } from './inspector/InspectorHeader';
import { EntityInspector } from './inspector/EntityInspector';
import { ComponentList } from './inspector/ComponentList';

export function InspectorPanel() {
  const editor = useEcsTreeEditorContext();
  const selected = editor.selectedEntity;
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
    // Restore remembered tab per entity when selection changes.
    setTabState(getRememberedTab(selectionKey, 'entity'));
  }, [selectionKey]);

  const setTab = (next: InspectorTab) => {
    setTabState(next);
    setRememberedTab(selectionKey, next);
  };

  // Restore scroll position per entity + tab.
  React.useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (editor.selectedId === SCENE_NODE_ID) return;
    const remembered = getRememberedScrollTop(selectionKey, tab);
    if (Math.abs(el.scrollTop - remembered) > 1) el.scrollTop = remembered;
    // We include component count and scene revision to handle content changes.
  }, [selectionKey, tab, editor.sceneRevision, selected?.getAllComponents().length]);

  if (editor.selectedId === SCENE_NODE_ID) {
    return <SceneInspectorPanel />;
  }

  const selectedComponents = selected ? selected.getAllComponents().filter((c: any) => c.type !== 'name') : [];
  const creatableComponents = selected ? editor.factory.listCreatableComponents(selected as any) : [];

  return (
    <div className="col-span-3 flex min-h-0 flex-col overflow-hidden rounded-base border-2 border-border bg-white">
      <InspectorHeader selected={selected} editor={editor} />

      {selected ? (
        <PanelTabs
          value={tab}
          onChange={setTab}
          ariaLabel="Inspector tabs"
          tabs={[
            { value: 'entity', label: 'Entity' },
            { value: 'components', label: 'Components' },
          ]}
        />
      ) : null}

      <div
        ref={scrollRef}
        className="scrollbar min-h-0 flex-1 overflow-y-auto"
        onScroll={(e) => {
          if (editor.selectedId === SCENE_NODE_ID) return;
          setRememberedScrollTop(selectionKey, tab, (e.currentTarget as HTMLDivElement).scrollTop);
        }}
      >
        {selected ? (
          <div className="flex flex-col">
            {tab === 'entity' ? (
              <EntityInspector selected={selected} editor={editor} />
            ) : null}

            {tab === 'components' ? (
              <ComponentList
                selectedComponents={selectedComponents}
                creatableComponents={creatableComponents}
                editor={editor}
                selectionKey={selectionKey}
                tab={tab === 'components' ? 'components' : ''}
                referenceOptions={referenceOptions}
              />
            ) : null}
          </div>
        ) : (
          <div className="px-3 py-3 text-sm text-muted-foreground">Select an entity to edit.</div>
        )}
      </div>
    </div>
  );
}

