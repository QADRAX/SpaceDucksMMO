'use client';

import * as React from 'react';

import type { EditorResource } from './types';
import { useEcsTreeEditor } from './useEcsTreeEditor';
import { EcsTreeEditorProvider } from './EcsTreeEditorContext';
import { EditorToolbar } from './ui/EditorToolbar';
import { HierarchyPanel } from './ui/HierarchyPanel';
import { ViewportPanel } from './ui/ViewportPanel';
import { InspectorPanel } from './ui/InspectorPanel';

export type EcsTreeEditorProps = {
  resource: EditorResource;
  initialComponentDataJson: string | null;
};

export function EcsTreeEditor(props: EcsTreeEditorProps) {
  const store = useEcsTreeEditor({
    resource: props.resource,
    initialComponentDataJson: props.initialComponentDataJson,
  });

  return (
    <EcsTreeEditorProvider value={store}>
      <div className="flex h-full min-h-105 flex-col gap-3">
        <EditorToolbar />

        {store.error ? (
          <div className="rounded-base border-2 border-border bg-red-100 p-3 text-sm text-red-800">{store.error}</div>
        ) : null}

        <div className="grid flex-1 grid-cols-12 gap-3">
          <HierarchyPanel />
          <ViewportPanel />
          <InspectorPanel />
        </div>
      </div>
    </EcsTreeEditorProvider>
  );
}