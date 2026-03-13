'use client';

import * as React from 'react';

import type { IRenderingEngine } from '@duckengine/core';

import type { SnapshotJson } from '../logic/sceneEditorRuntime';
import { serializeSnapshotFromScene } from '../logic/sceneEditorRuntime';
import {
  makeEditorSceneFromSnapshot,
} from '../logic/sceneEditorRuntime';
import { type EcsEditorScene } from '../logic/EcsEditorScene';

import { hydrateResourceBackedMaterials } from '@/lib/resourceBackedEditor';

import type { EditorMode, EditorResource } from '../types';
import { useStableEvent } from '../useStableEvent';
import { makeSceneIds, sanitizeSelectedId } from './scenesLogic';

export function useEcsEditorScenes(args: {
  resource: EditorResource;
  modeRef: React.RefObject<EditorMode>;
  rendererRef: React.RefObject<IRenderingEngine | null>;
  selectedIdRef: React.RefObject<string | null>;
  setSelectedId: (id: string | null) => void;
  commitJson: (nextJson: SnapshotJson) => void;
}) {
  const editSceneRef = React.useRef<EcsEditorScene | null>(null);
  const playSceneRef = React.useRef<EcsEditorScene | null>(null);
  const cameraPoseRef = React.useRef<{ position?: [number, number, number]; rotation?: [number, number, number] }>({});

  const ids = React.useMemo(() => makeSceneIds(args.resource), [args.resource.id, args.resource.kind]);

  const rebuildEditScene = useStableEvent((snapshotJson: SnapshotJson) => {
    const renderer = args.rendererRef.current;
    if (!renderer) return;

    const built = makeEditorSceneFromSnapshot({
      id: ids.editId,
      snapshotJson,
      // Debug masters are always enabled; per-entity flags decide what renders.
      debugTransformsEnabled: true,
      cameraPose: cameraPoseRef.current,
    });

    editSceneRef.current = built.scene;

    if (args.modeRef.current === 'edit') {
      renderer.setScene(built.scene);
    }

    // Best-effort: resolve resource-backed material refs to the active version.
    // This keeps the editor preview in sync without persisting expanded params.
    const tracker = renderer.getLoadingTracker?.();
    if (!tracker) {
      const nextSelected = sanitizeSelectedId(args.selectedIdRef.current, built.scene.getEntitiesById());
      if (nextSelected !== args.selectedIdRef.current) args.setSelectedId(nextSelected);
      return;
    }

    const taskId = `editor:hydrate:${ids.editId}`;
    tracker.startTask(taskId);

    void hydrateResourceBackedMaterials(built.scene).catch((e) => {
      if (process.env.NODE_ENV !== 'production') console.warn('[SceneEditor] hydrate materials failed', e);
    }).finally(() => {
      tracker.endTask(taskId);
    });

    const nextSelected = sanitizeSelectedId(args.selectedIdRef.current, built.scene.getEntitiesById());
    if (nextSelected !== args.selectedIdRef.current) args.setSelectedId(nextSelected);
  });

  const commitFromCurrentEditScene = useStableEvent((reason: string) => {
    const scene = editSceneRef.current;
    if (!scene) return;
    const nextJson = serializeSnapshotFromScene(scene);
    args.commitJson(nextJson);
    if (process.env.NODE_ENV !== 'production') console.debug('[EcsTreeEditor] commit', reason);
  });

  const captureCameraPoseFromScene = useStableEvent((scene: EcsEditorScene) => {
    const editorCam = scene.getEditorCamera();
    if (!editorCam) return;
    try {
      cameraPoseRef.current = {
        position: [
          editorCam.transform.worldPosition.x,
          editorCam.transform.worldPosition.y,
          editorCam.transform.worldPosition.z,
        ],
        rotation: [
          editorCam.transform.worldRotation.x,
          editorCam.transform.worldRotation.y,
          editorCam.transform.worldRotation.z,
        ],
      };
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') console.warn('[EcsTreeEditor] captureCameraPose failed', e);
    }
  });

  const createPlaySceneFromEdit = useStableEvent((): EcsEditorScene | null => {
    const editScene = editSceneRef.current;
    if (!editScene) return null;

    const playSnapshot = serializeSnapshotFromScene(editScene);
    const built = makeEditorSceneFromSnapshot({
      id: ids.playId,
      snapshotJson: playSnapshot,
      debugTransformsEnabled: true,
      cameraPose: cameraPoseRef.current,
    });

    playSceneRef.current = built.scene;

    void hydrateResourceBackedMaterials(built.scene).catch((e) => {
      if (process.env.NODE_ENV !== 'production') console.warn('[EcsTreeEditor] hydrate play materials failed', e);
    });

    return built.scene;
  });

  const stopPlayScene = useStableEvent(() => {
    playSceneRef.current = null;
  });

  React.useEffect(() => {
    // No scene-level debug toggles; masters stay enabled.
  }, []);

  return {
    editSceneRef,
    playSceneRef,
    rebuildEditScene,
    commitFromCurrentEditScene,
    captureCameraPoseFromScene,
    createPlaySceneFromEdit,
    stopPlayScene,
  };
}
