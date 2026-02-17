'use client';

import * as React from 'react';

import type { EditorResource } from './types';
import { useSceneEditor } from './useSceneEditor';
import { SceneEditorProvider } from './SceneEditorContext';
import { HierarchyPanel } from './ui/HierarchyPanel';
import { ViewportPanel } from './ui/ViewportPanel';
import { InspectorPanel } from './ui/InspectorPanel';

export type SceneEditorProps = {
  resource: EditorResource;
  initialComponentDataJson: string | null;
};

export function SceneEditor(props: SceneEditorProps) {
  const store = useSceneEditor({
    resource: props.resource,
    initialComponentDataJson: props.initialComponentDataJson,
  });

  return (
    <SceneEditorProvider value={store}>
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        <div className="grid flex-1 min-h-0 grid-cols-12 gap-3">
          <HierarchyPanel />
          <ViewportPanel />
          <InspectorPanel />
        </div>
      </div>
    </SceneEditorProvider>
  );
}