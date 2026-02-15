'use client';

import * as React from 'react';

import type { EditorResource } from './types';
import { useEcsTreeEditor } from './useEcsTreeEditor';
import { EcsTreeEditorProvider } from './EcsTreeEditorContext';
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
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        <div className="grid flex-1 min-h-0 grid-cols-12 gap-3">
          <HierarchyPanel />
          <ViewportPanel />
          <InspectorPanel />
        </div>
      </div>
    </EcsTreeEditorProvider>
  );
}