'use client';

import * as React from 'react';

import { useEcsTreeEditorContext } from '../EcsTreeEditorContext';

export function ViewportPanel() {
  const editor = useEcsTreeEditorContext();

  return (
    <div className="col-span-6 min-h-105 overflow-hidden rounded-base border-2 border-border bg-white">
      <div className="flex items-center justify-between border-b border-border p-2">
        <div className="text-sm font-bold">Viewport</div>
        <div className="text-xs text-muted-foreground">Click to capture mouse</div>
      </div>

      <div ref={editor.containerRef} className="h-140 w-full" />
    </div>
  );
}
