'use client';

import * as React from 'react';

import { Button } from '@/components/atoms/Button';
import { ClearDebugIcon, PauseIcon, PlayIcon, RedoIcon, SaveIcon, StopIcon, UndoIcon } from '@/components/icons';

import { useSceneEditorContext } from '../SceneEditorContext';

export function ViewportPanel() {
  const editor = useSceneEditorContext();
  // Force re-render for per-entity debug visualization flags.
  void editor.presentationRevision;

  const anyDebugActive = editor.allEntitiesForHierarchy.some(
    (e) => e.isDebugTransformEnabled() || e.isDebugMeshEnabled() || e.isDebugColliderEnabled()
  );

  return (
    <div
      className={`col-span-6 flex min-h-0 flex-col overflow-hidden rounded-base border-2 transition-all duration-300 ${editor.viewportState.isLocked
        ? 'border-main border-4 bg-main/5 shadow-2xl ring-4 ring-main/10'
        : 'border-border bg-white'
        }`}
      style={{
        cursor: editor.viewportState.isCooldown ? 'progress' : 'auto'
      }}
    >
      <div className="flex items-center justify-between border-b border-border p-2">
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

          <div className="mx-1 h-5 w-px bg-border" />

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

          <div className="mx-1 h-5 w-px bg-border" />

          {editor.mode === 'edit' && anyDebugActive ? (
            <Button
              type="button"
              variant="ghost"
              size="iconSm"
              aria-label="Clear all debugs"
              title="Clear all debugs"
              onClick={editor.onClearAllDebug}
            >
              <ClearDebugIcon className="h-4 w-4" />
            </Button>
          ) : null}
        </div>

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

      {editor.error ? (
        <div className="border-b border-border bg-red-100 p-2 text-sm text-red-800">{editor.error}</div>
      ) : null}

      <div
        ref={editor.containerRef}
        className="min-h-0 flex-1 w-full"
        style={{ cursor: editor.viewportState.isCooldown ? 'progress' : 'auto' }}
      />
    </div>
  );
}
