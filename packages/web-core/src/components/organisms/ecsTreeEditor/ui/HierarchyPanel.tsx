'use client';

import * as React from 'react';

import { useEcsTreeEditorContext } from '../EcsTreeEditorContext';
import { HierarchyHeader } from './hierarchy/HierarchyHeader';
import { HierarchyList } from './hierarchy/HierarchyList';
import { HierarchyProvider } from './hierarchy/HierarchyContext';

export function HierarchyPanel() {
  const editor = useEcsTreeEditorContext();
  // Force re-render when the scene graph is rebuilt into refs.
  void editor.sceneRevision;
  // Force re-render for per-entity debug visualization flags.
  void editor.presentationRevision;

  return (
    <HierarchyProvider>
      <div className="col-span-3 flex min-h-0 flex-col overflow-hidden rounded-base border-2 border-border bg-white">
        <HierarchyHeader editor={editor} />
        <HierarchyList editor={editor} />
      </div>
    </HierarchyProvider>
  );
}
