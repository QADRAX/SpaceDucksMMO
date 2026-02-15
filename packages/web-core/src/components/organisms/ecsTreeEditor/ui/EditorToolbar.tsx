'use client';

import * as React from 'react';

import { Button } from '@/components/atoms/Button';

import { useEcsTreeEditorContext } from '../EcsTreeEditorContext';

export function EditorToolbar() {
  const editor = useEcsTreeEditorContext();

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-base border-2 border-border bg-white p-2">
      <div className="flex items-center gap-2">
        <Button
          onClick={editor.onPlay}
          disabled={editor.mode !== 'edit'}
          variant={editor.mode === 'play' ? 'secondary' : 'default'}
        >
          Play
        </Button>
        <Button
          onClick={editor.onTogglePause}
          disabled={editor.mode !== 'play'}
          variant={editor.paused ? 'default' : 'secondary'}
        >
          Pause
        </Button>
        <Button onClick={editor.onStop} disabled={editor.mode !== 'play'} variant="secondary">
          Stop
        </Button>
      </div>

      <div className="h-6 w-px bg-border" />

      <div className="flex items-center gap-2">
        <Button onClick={editor.onUndo} disabled={!editor.canUndo} variant="secondary">
          Undo
        </Button>
        <Button onClick={editor.onRedo} disabled={!editor.canRedo} variant="secondary">
          Redo
        </Button>
      </div>

      <div className="h-6 w-px bg-border" />

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={editor.debugTransformsEnabled}
          onChange={(e) => editor.setDebugTransformsEnabled(e.target.checked)}
        />
        <span className="text-sm text-muted-foreground">Debug transforms</span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <Button onClick={editor.onSave} disabled={editor.mode !== 'edit' || !editor.dirty}>
          Save
        </Button>
      </div>
    </div>
  );
}
