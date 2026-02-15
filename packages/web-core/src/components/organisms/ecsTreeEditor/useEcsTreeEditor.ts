'use client';

import * as React from 'react';

import { ThreeRenderer } from '@duckengine/rendering-three';

import { DefaultEcsComponentFactory } from '@duckengine/ecs';

import type { EditorMode, EditorResource, EcsTreeEditorStore } from './types';
import { useStableEvent } from './useStableEvent';

import { useEcsEditorHistory } from './hooks/useEcsEditorHistory';
import { useEcsEditorScenes } from './hooks/useEcsEditorScenes';
import { useThreeRendererLoop } from './hooks/useThreeRendererLoop';
import { useEcsEditorActions } from './hooks/useEcsEditorActions';
import * as scenesLogic from './hooks/scenesLogic';

export type { EditorMode, EditorResource } from './types';

export function useEcsTreeEditor(args: {
  resource: EditorResource;
  initialComponentDataJson: string | null;
  debugTransformsEnabledInitial?: boolean;
}): EcsTreeEditorStore {
  const { resource, initialComponentDataJson } = args;

  const containerRef = React.useRef<HTMLDivElement>(null as any);
  const rendererRef = React.useRef<ThreeRenderer | null>(null);

  const [error, setError] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<EditorMode>('edit');
  const [paused, setPaused] = React.useState(false);

  const modeRef = React.useRef<EditorMode>('edit');
  const pausedRef = React.useRef(false);

  const [debugTransformsEnabled, setDebugTransformsEnabled] = React.useState(
    args.debugTransformsEnabledInitial ?? true
  );

  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const selectedIdRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const history = useEcsEditorHistory({ initialComponentDataJson });

  const scenes = useEcsEditorScenes({
    resource,
    debugTransformsEnabled,
    modeRef,
    rendererRef,
    selectedIdRef,
    setSelectedId,
    commitJson: history.commitJson,
  });

  React.useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  React.useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useThreeRendererLoop({
    containerRef,
    rendererRef,
    getFrame: () => {
      const scene = modeRef.current === 'play' ? scenes.playSceneRef.current : scenes.editSceneRef.current;
      const paused = modeRef.current === 'play' && pausedRef.current;
      return { scene: scene ?? null, paused };
    },
    onInit: () => {
      scenes.rebuildEditScene(history.editSnapshotJson);
    },
    onCapturePose: scenes.captureCameraPoseFromScene,
    onError: (msg) => setError(msg || null),
  });

  const canUndo = mode === 'edit' && history.canUndo;
  const canRedo = mode === 'edit' && history.canRedo;

  const onUndo = () => {
    if (!canUndo) return;
    const prev = history.undo();
    if (prev) scenes.rebuildEditScene(prev);
  };

  const onRedo = () => {
    if (!canRedo) return;
    const next = history.redo();
    if (next) scenes.rebuildEditScene(next);
  };

  const onPlay = () => {
    if (modeRef.current === 'play') return;
    const renderer = rendererRef.current;
    if (!renderer) return;

    const playScene = scenes.createPlaySceneFromEdit();
    if (!playScene) return;

    const next = scenesLogic.enterPlay({ mode: modeRef.current, paused: pausedRef.current });
    setMode(next.mode);
    setPaused(next.paused);

    renderer.setScene(playScene);
    setSelectedId(null);
  };

  const onStop = () => {
    if (modeRef.current !== 'play') return;
    const renderer = rendererRef.current;
    const editScene = scenes.editSceneRef.current;

    const next = scenesLogic.enterEdit({ mode: modeRef.current, paused: pausedRef.current });
    setMode(next.mode);
    setPaused(next.paused);

    if (renderer && editScene) {
      renderer.setScene(editScene);
    }
    scenes.stopPlayScene();
    setSelectedId(null);
  };

  const onTogglePause = () => {
    if (modeRef.current !== 'play') return;
    setPaused((v) => scenesLogic.togglePause({ mode: 'play', paused: v }).paused);
  };

  const onSave = async () => {
    if (modeRef.current !== 'edit') return;

    const json = history.editSnapshotJson;
    setError(null);

    const form = new FormData();
    form.set('componentData', json);

    const res = await fetch(`/api/admin/resources/${resource.id}/versions`, {
      method: 'POST',
      body: form,
    });

    if (!res.ok) {
      let msg = `Failed to save (${res.status})`;
      try {
        const j = await res.json();
        if (j?.error) msg = String(j.error);
      } catch {
        // ignore
      }
      setError(msg);
      return;
    }

    history.markSaved(json);
  };

  const factoryRef = React.useRef(new DefaultEcsComponentFactory());
  const actions = useEcsEditorActions({
    modeRef,
    editSceneRef: scenes.editSceneRef,
    selectedIdRef,
    setSelectedId,
    setError,
    commitFromCurrentEditScene: scenes.commitFromCurrentEditScene,
    factoryRef,
  });

  const currentScene = mode === 'play' ? scenes.playSceneRef.current : scenes.editSceneRef.current;
  const selectedEntity = selectedId && currentScene ? currentScene.getEntitiesById().get(selectedId) : undefined;

  const hierarchyRoots = (() => {
    const scene = currentScene;
    if (!scene) return [];
    return scene.getUserRoots();
  })();

  const allEntitiesForHierarchy = (() => {
    const scene = currentScene;
    if (!scene) return [];
    return Array.from(scene.getEntitiesById().values());
  })();

  return {
    containerRef,
    error,
    setError,
    mode,
    paused,
    debugTransformsEnabled,
    setDebugTransformsEnabled,
    dirty: history.dirty,
    canUndo,
    canRedo,
    onPlay,
    onStop,
    onTogglePause,
    onUndo,
    onRedo,
    onSave,
    selectedId,
    setSelectedId,
    selectedEntity,
    hierarchyRoots,
    allEntitiesForHierarchy,
    onCreateEmpty: actions.onCreateEmpty,
    onDeleteSelected: actions.onDeleteSelected,
    onReparent: actions.onReparent,
    onAddComponent: actions.onAddComponent,
    onRemoveComponent: actions.onRemoveComponent,
    onSetSelectedName: actions.onSetSelectedName,
    onSetSelectedLocalPositionAxis: actions.onSetSelectedLocalPositionAxis,
    onUpdateSelectedComponentData: actions.onUpdateSelectedComponentData,
    commitFromCurrentEditScene: scenes.commitFromCurrentEditScene,
    factory: factoryRef.current,
  };
}

