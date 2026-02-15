'use client';

import * as React from 'react';

import { Button } from '@/components/atoms/Button';
import { BugIcon, PauseIcon, PlayIcon, RedoIcon, SaveIcon, StopIcon, UndoIcon } from '@/components/icons';

import { useEcsTreeEditorContext } from '../EcsTreeEditorContext';

export function EditorToolbar() {
  const editor = useEcsTreeEditorContext();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1">
        <Button
          onClick={editor.onPlay}
          disabled={editor.mode !== 'edit'}
          variant="ghost"
          size="iconSm"
          aria-label="Play"
          title="Play"
          className={editor.mode === 'play' ? 'bg-gray-100' : undefined}
        >
          <PlayIcon className="h-4 w-4" />
        </Button>
        <Button
          onClick={editor.onTogglePause}
          disabled={editor.mode !== 'play'}
          variant="ghost"
          size="iconSm"
          aria-label="Pause"
          title="Pause"
          className={editor.mode === 'play' && editor.paused ? 'bg-gray-100' : undefined}
        >
          <PauseIcon className="h-4 w-4" />
        </Button>
        <Button
          onClick={editor.onStop}
          disabled={editor.mode !== 'play'}
          variant="ghost"
          size="iconSm"
          aria-label="Stop"
          title="Stop"
        >
          <StopIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button
          onClick={editor.onUndo}
          disabled={!editor.canUndo}
          variant="ghost"
          size="iconSm"
          aria-label="Undo"
          title="Undo"
        >
          <UndoIcon className="h-4 w-4" />
        </Button>
        <Button
          onClick={editor.onRedo}
          disabled={!editor.canRedo}
          variant="ghost"
          size="iconSm"
          aria-label="Redo"
          title="Redo"
        >
          <RedoIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="iconSm"
          aria-label={editor.debugTransformsEnabled ? 'Disable debug transforms' : 'Enable debug transforms'}
          title="Debug transforms"
          onClick={() => editor.setDebugTransformsEnabled(!editor.debugTransformsEnabled)}
          className={editor.debugTransformsEnabled ? 'bg-gray-100' : undefined}
        >
          <BugIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <Button
          onClick={editor.onSave}
          disabled={editor.mode !== 'edit' || !editor.dirty}
          variant="ghost"
          size="iconSm"
          aria-label="Save"
          title="Save"
          className={editor.mode === 'edit' && editor.dirty ? 'bg-gray-100' : undefined}
        >
          <SaveIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
