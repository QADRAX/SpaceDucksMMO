'use client';

import * as React from 'react';

import { Entity, type DefaultEcsComponentFactory, type ComponentType } from '@duckengine/ecs';

import {
  serializeSnapshotFromScene,
  collectAllEntitiesFromRoots,
} from '../logic/sceneEditorRuntime';
import type { EcsEditorScene } from '../logic/EcsEditorScene';

import type { EditorMode } from '../types';
import { useStableEvent } from '../useStableEvent';
import { validateReparent } from './actionsLogic';

export function useEcsEditorActions(args: {
  modeRef: React.RefObject<EditorMode>;
  editSceneRef: React.RefObject<EcsEditorScene | null>;
  selectedIdRef: React.RefObject<string | null>;
  setSelectedId: (id: string | null) => void;
  setError: (msg: string | null) => void;
  commitFromCurrentEditScene: (reason: string) => void;
  factoryRef: React.MutableRefObject<DefaultEcsComponentFactory>;
  bumpPresentationRevision: () => void;
}) {
  const getEntityById = (id: string): Entity | null => {
    if (args.modeRef.current !== 'edit') return null;
    const scene = args.editSceneRef.current;
    if (!scene) return null;
    return scene.getEntitiesById().get(id) ?? null;
  };

  const mutateSelectedEntity = useStableEvent((fn: (scene: EcsEditorScene, ent: Entity) => void, reason: string) => {
    if (args.modeRef.current !== 'edit') return;
    const scene = args.editSceneRef.current;
    const selectedId = args.selectedIdRef.current;
    if (!scene || !selectedId) return;

    const ent = scene.getEntitiesById().get(selectedId);
    if (!ent) return;

    try {
      fn(scene, ent);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Edit failed';
      args.setError(msg);
      return;
    }

    args.commitFromCurrentEditScene(reason);
  });

  const onToggleEntityDebug = useStableEvent((id: string, kind: any) => {
    const ent = getEntityById(id);
    if (!ent) return;
    try {
      ent.setDebugEnabled(kind, !ent.isDebugEnabled(kind));
    } finally {
      args.bumpPresentationRevision();
    }
  });

  const onToggleSceneDebug = useStableEvent((kind: string) => {
    if (args.modeRef.current !== 'edit') return;
    const scene = args.editSceneRef.current;
    if (!scene) return;
    try {
      scene.setDebugEnabled(kind, !scene.debugFlags[kind]);
    } finally {
      args.bumpPresentationRevision();
    }
  });

  const onClearAllDebug = useStableEvent(() => {
    if (args.modeRef.current !== 'edit') return;
    const scene = args.editSceneRef.current;
    if (!scene) return;
    for (const ent of scene.getEntitiesById().values()) {
      try {
        const enabled = ent.getEnabledDebugs();
        for (const kind of enabled) {
          ent.setDebugEnabled(kind, false);
        }
      } catch {
        // ignore individual entity failures
      }
    }
    args.bumpPresentationRevision();
  });
  const onCreateEmpty = useStableEvent(() => {
    if (args.modeRef.current !== 'edit') return;

    const scene = args.editSceneRef.current;
    if (!scene) return;

    const selectedId = args.selectedIdRef.current;
    const parent = selectedId ? scene.getEntitiesById().get(selectedId) : undefined;

    const id = globalThis.crypto?.randomUUID?.() ?? `entity_${Math.random().toString(16).slice(2)}`;
    const e = new Entity(id);
    e.displayName = 'Entity';

    if (parent) parent.addChild(e);

    scene.addEntity(e);
    scene.getEntitiesById().set(e.id, e);

    args.setSelectedId(e.id);
    args.commitFromCurrentEditScene('create-empty');
  });

  const onDeleteSelected = useStableEvent(() => {
    if (args.modeRef.current !== 'edit') return;

    const scene = args.editSceneRef.current;
    const selectedId = args.selectedIdRef.current;
    if (!scene || !selectedId) return;

    const ent = scene.getEntitiesById().get(selectedId);
    if (!ent) return;

    const toRemove = collectAllEntitiesFromRoots([ent]);

    try {
      ent.parent?.removeChild(ent.id);
    } catch (e) {
      args.setError(e instanceof Error ? e.message : 'Failed to detach from parent');
      return;
    }

    for (const e of toRemove.reverse()) {
      try {
        scene.removeEntity(e.id);
      } catch (err) {
        args.setError(err instanceof Error ? err.message : `Failed to remove entity '${e.id}'`);
        // best-effort cleanup: continue removing remaining entities to reduce dangling references
      }
      scene.getEntitiesById().delete(e.id);
    }

    // If we deleted the active camera, make sure the editor camera becomes active again.
    try {
      if (!scene.getActiveCamera()) {
        const editorCam = scene.getEditorCamera();
        if (editorCam) scene.setActiveCamera(editorCam.id);
      }
    } catch {
      // ignore
    }

    args.setSelectedId(null);
    args.commitFromCurrentEditScene('delete');
  });

  const onSetActiveCameraEntityId = useStableEvent((id: string | null) => {
    if (args.modeRef.current !== 'edit') return;

    const scene = args.editSceneRef.current;
    if (!scene) return;

    if (!id) {
      const editorCam = scene.getEditorCamera();
      if (!editorCam) return;
      try {
        scene.setActiveCamera(editorCam.id);
      } catch (e) {
        args.setError(e instanceof Error ? e.message : 'Failed to set active camera');
        return;
      }
      args.commitFromCurrentEditScene('set-active-camera');
      return;
    }

    const ent = scene.getEntitiesById().get(id);
    if (!ent) {
      args.setError(`Camera entity '${id}' not found`);
      return;
    }
    if (!ent.getComponent('cameraView')) {
      args.setError(`Entity '${id}' has no CameraViewComponent`);
      return;
    }

    try {
      scene.setActiveCamera(id);
    } catch (e) {
      args.setError(e instanceof Error ? e.message : 'Failed to set active camera');
      return;
    }

    args.commitFromCurrentEditScene('set-active-camera');
  });

  const onAddComponent = useStableEvent((type: string) => {
    mutateSelectedEntity((_scene, ent) => {
      const factory = args.factoryRef.current;
      if (!factory) throw new Error('Component factory not available');
      const comp = factory.create(type as any, undefined);
      const res = ent.safeAddComponent(comp as any);
      if (!res.ok) throw new Error(res.error.message);
    }, `add-component:${type}`);
  });

  const onRemoveComponent = useStableEvent((type: string) => {
    mutateSelectedEntity((_scene, ent) => {
      const res = ent.safeRemoveComponent(type as ComponentType);
      if (!res.ok) throw new Error(res.error.message);
    }, `remove-component:${type}`);
  });

  const onReparentEntity = useStableEvent((childId: string, newParentId: string | null) => {
    if (args.modeRef.current !== 'edit') return;

    const scene = args.editSceneRef.current;
    if (!scene) return;

    const child = scene.getEntitiesById().get(childId);
    if (!child) {
      args.setError(`Entity '${childId}' not found`);
      return;
    }

    const newParent = newParentId ? scene.getEntitiesById().get(newParentId) : undefined;
    if (newParentId && !newParent) {
      args.setError(`Parent entity '${newParentId}' not found`);
      return;
    }

    const validation = validateReparent(child, newParent);
    if (!validation.ok) {
      args.setError(validation.error);
      return;
    }

    try {
      child.parent?.removeChild(child.id);
      if (newParent) newParent.addChild(child);
    } catch (e) {
      args.setError(e instanceof Error ? e.message : 'Reparent failed');
      return;
    }

    args.commitFromCurrentEditScene('reparent');
  });

  const onReparent = useStableEvent((newParentId: string | null) => {
    if (args.modeRef.current !== 'edit') return;

    const scene = args.editSceneRef.current;
    const selectedId = args.selectedIdRef.current;
    if (!scene || !selectedId) return;

    const child = scene.getEntitiesById().get(selectedId);
    if (!child) return;

    const newParent = newParentId ? scene.getEntitiesById().get(newParentId) : undefined;
    if (newParentId && !newParent) {
      args.setError(`Parent entity '${newParentId}' not found`);
      return;
    }

    const validation = validateReparent(child, newParent);
    if (!validation.ok) {
      args.setError(validation.error);
      return;
    }

    try {
      child.parent?.removeChild(child.id);
      if (newParent) newParent.addChild(child);
    } catch (e) {
      args.setError(e instanceof Error ? e.message : 'Reparent failed');
      return;
    }

    args.commitFromCurrentEditScene('reparent');
  });

  const onSetSelectedName = useStableEvent((value: string) => {
    mutateSelectedEntity((_scene, ent) => {
      ent.displayName = value;
    }, 'set-name');
  });

  const onSetSelectedGizmoIcon = useStableEvent((value: string) => {
    mutateSelectedEntity((_scene, ent) => {
      const next = value.trim();
      ent.gizmoIcon = next ? next : undefined;
    }, 'set-gizmo-icon');
  });

  const onSetSelectedLocalPositionAxis = useStableEvent((axis: 'x' | 'y' | 'z', n: number) => {
    mutateSelectedEntity((_scene, ent) => {
      const p = ent.transform.localPosition;
      const next = { x: p.x, y: p.y, z: p.z } as any;
      next[axis] = Number.isFinite(n) ? n : 0;
      ent.transform.setPosition(next.x, next.y, next.z);
    }, `transform-pos-${axis}`);
  });

  const onUpdateSelectedComponentData = useStableEvent((type: string, data: Record<string, unknown>) => {
    mutateSelectedEntity((_scene, ent) => {
      const comp = ent.getComponent(type as ComponentType) as any;
      if (!comp) throw new Error(`Component '${type}' not found`);

      const fields = (comp.metadata?.inspector?.fields ?? []) as Array<{ key: string; set?: (c: any, v: any) => void }>;
      const fieldByKey = new Map(fields.map((f) => [f.key, f] as const));

      for (const [k, v] of Object.entries(data)) {
        const f = fieldByKey.get(k);
        if (f?.set) {
          f.set(comp, v);
        } else {
          (comp as any)[k] = v;
        }
      }
    }, `edit-component:${type}`);
  });

  return {
    onCreateEmpty,
    onDeleteSelected,
    onAddComponent,
    onRemoveComponent,
    onReparent,
    onReparentEntity,
    onSetActiveCameraEntityId,
    onSetSelectedName,
    onSetSelectedGizmoIcon,
    onSetSelectedLocalPositionAxis,
    onUpdateSelectedComponentData,
    onToggleEntityDebug,
    onToggleSceneDebug,
    onClearAllDebug,
  };
}
