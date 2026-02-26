'use client';

import * as React from 'react';
import { Button } from '@/components/atoms/Button';
import { PlayIcon, PauseIcon, StopIcon, UndoIcon, RedoIcon, SaveIcon } from '@/components/icons';
import { useSceneEditorV2Context } from '../../SceneEditorV2Context';
import { EditorPanelSlot } from '../../plugins/EditorPanelSlot';

/**
 * EditorToolbar — the global top bar of SceneEditorV2.
 *
 * Contains:
 * - Play / Pause (resume) / Stop
 * - Undo / Redo
 * - Save
 * - Game state badge
 *
 * Debug overlay toggles and gizmo tools will be added via plugins in later phases.
 */
export function EditorToolbar() {
    const editor = useSceneEditorV2Context();
    const { gameState } = editor;

    const badgeClass =
        gameState === 'playing' ? 'bg-green-600 text-white'
            : gameState === 'paused' ? 'bg-amber-500 text-white'
                : 'bg-blue-600 text-white';

    const badgeLabel =
        gameState === 'playing' ? '▶ PLAY'
            : gameState === 'paused' ? '⏸ PAUSED'
                : 'EDIT';

    return (
        <div className="flex items-center justify-between border-b-2 border-black bg-white px-3 py-1.5 h-10 w-full shrink-0">
            {/* Left: Play controls */}
            <div className="flex items-center gap-1">
                {/* Play / Resume */}
                <Button
                    onClick={gameState === 'paused' ? editor.onResume : editor.onPlay}
                    disabled={gameState === 'playing'}
                    variant="ghost"
                    size="iconSm"
                    aria-label="Play"
                    title={gameState === 'paused' ? 'Resume' : 'Play'}
                >
                    <PlayIcon className="h-4 w-4" />
                </Button>

                {/* Pause */}
                <Button
                    onClick={editor.onPause}
                    disabled={gameState !== 'playing'}
                    variant="ghost"
                    size="iconSm"
                    aria-label="Pause"
                    title="Pause"
                    className={gameState === 'paused' ? 'bg-black/10' : undefined}
                >
                    <PauseIcon className="h-4 w-4" />
                </Button>

                {/* Stop */}
                <Button
                    onClick={editor.onStop}
                    disabled={gameState === 'stopped'}
                    variant="ghost"
                    size="iconSm"
                    aria-label="Stop"
                    title="Stop"
                >
                    <StopIcon className="h-4 w-4" />
                </Button>

                <div className="mx-1 h-5 w-px bg-black/20" />

                {/* Undo */}
                <Button
                    onClick={editor.onUndo}
                    disabled={!editor.canUndo || gameState !== 'stopped'}
                    variant="ghost"
                    size="iconSm"
                    aria-label="Undo"
                    title="Undo"
                >
                    <UndoIcon className="h-4 w-4" />
                </Button>

                {/* Redo */}
                <Button
                    onClick={editor.onRedo}
                    disabled={!editor.canRedo || gameState !== 'stopped'}
                    variant="ghost"
                    size="iconSm"
                    aria-label="Redo"
                    title="Redo"
                >
                    <RedoIcon className="h-4 w-4" />
                </Button>
            </div>

            {/* Centre: mode badge */}
            <span className={`rounded-none px-2 py-0.5 text-xs font-black uppercase tracking-widest ${badgeClass}`}>
                {badgeLabel}
            </span>

            {/* Right: Actions & Save */}
            <div className="flex items-center gap-1">
                <EditorPanelSlot slotId="toolbar.debug-actions" className="flex items-center gap-1 mr-2" />

                <Button
                    onClick={editor.onSave}
                    disabled={gameState !== 'stopped' || !editor.dirty}
                    variant="ghost"
                    size="iconSm"
                    aria-label="Save"
                    title="Save"
                    className={gameState === 'stopped' && editor.dirty ? 'bg-black/10' : undefined}
                >
                    <SaveIcon className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
