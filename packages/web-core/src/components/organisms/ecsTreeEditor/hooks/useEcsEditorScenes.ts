'use client';

import * as React from 'react';

import type { ThreeRenderer } from '@duckengine/rendering-three';

import type { SnapshotJson } from '@/lib/ecsTreeEditorRuntime';
import {
  EcsEditorScene,
  makeEditorSceneFromSnapshot,
  serializeSnapshotFromScene,
} from '@/lib/ecsTreeEditorRuntime';

import type { EditorMode, EditorResource } from '../types';
import { useStableEvent } from '../useStableEvent';
import { makeSceneIds, sanitizeSelectedId } from './scenesLogic';

function applyDebugTransforms(scene: EcsEditorScene, enabled: boolean) {
  try {
    scene.setDebugTransformsEnabled(!!enabled);
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') console.warn('[EcsTreeEditor] setDebugTransformsEnabled failed', e);
  }

  for (const ent of scene.getEntitiesById().values()) {
    try {
      ent.setDebugTransformEnabled(!!enabled);
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') console.warn('[EcsTreeEditor] ent.setDebugTransformEnabled failed', e);
    }
  }
}

export function useEcsEditorScenes(args: {
  resource: EditorResource;
  debugTransformsEnabled: boolean;
  modeRef: React.RefObject<EditorMode>;
  rendererRef: React.RefObject<ThreeRenderer | null>;
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
      debugTransformsEnabled: args.debugTransformsEnabled,
      cameraPose: cameraPoseRef.current,
    });

    editSceneRef.current = built.scene;
    applyDebugTransforms(built.scene, args.debugTransformsEnabled);

    if (args.modeRef.current === 'edit') {
      renderer.setScene(built.scene);
    }

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
      debugTransformsEnabled: args.debugTransformsEnabled,
      cameraPose: cameraPoseRef.current,
    });

    playSceneRef.current = built.scene;
    return built.scene;
  });

  const stopPlayScene = useStableEvent(() => {
    playSceneRef.current = null;
  });

  React.useEffect(() => {
    const scene = editSceneRef.current;
    if (!scene) return;
    applyDebugTransforms(scene, args.debugTransformsEnabled);
  }, [args.debugTransformsEnabled]);

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
