import {
  Entity,
} from '@duckengine/core';

import {
  deserializeEcsTreeSnapshotToEntities,
  serializeEcsTreeFromRoots,
  createEmptyEcsTreeSnapshot,
  parseEcsTreeSnapshot,
} from '@/lib/ecs-snapshot';

import { EcsEditorScene, type EditorSceneInit } from './EcsEditorScene';

// Re-export for consumers
export { EcsEditorScene, type EditorSceneInit };

export type SnapshotJson = string;

export function safeParseSnapshotJson(json: string | null): unknown {
  if (!json || !json.trim()) return createEmptyEcsTreeSnapshot();
  try {
    return JSON.parse(json);
  } catch {
    return createEmptyEcsTreeSnapshot();
  }
}

export function snapshotToJson(snapshot: unknown): SnapshotJson {
  try {
    return JSON.stringify(snapshot);
  } catch {
    return JSON.stringify(createEmptyEcsTreeSnapshot());
  }
}

export function collectAllEntitiesFromRoots(roots: Entity[]): Entity[] {
  const out: Entity[] = [];
  const visited = new Set<string>();
  const walk = (e: Entity) => {
    if (visited.has(e.id)) return;
    visited.add(e.id);
    out.push(e);
    for (const c of e.getChildren()) walk(c);
  };
  for (const r of roots) walk(r);
  return out;
}

export function makeEditorSceneFromSnapshot(args: {
  id: string;
  snapshotJson: SnapshotJson;
  debugTransformsEnabled: boolean;
  cameraPose?: { position?: [number, number, number]; rotation?: [number, number, number] };
}): { scene: EcsEditorScene; snapshotJson: SnapshotJson } {
  const snapshotObj = safeParseSnapshotJson(args.snapshotJson);
  const parsed = parseEcsTreeSnapshot(snapshotObj);
  const des = deserializeEcsTreeSnapshotToEntities(parsed, { strict: true });

  const entitiesById = des.entitiesById;

  return {
    scene: new EcsEditorScene({
      id: args.id,
      entitiesById,
      debugTransformsEnabled: args.debugTransformsEnabled,
      activeCameraEntityId: des.activeCameraEntityId,
      cameraPose: args.cameraPose,
    }),
    snapshotJson: snapshotToJson(parsed),
  };
}

export function serializeSnapshotFromScene(scene: EcsEditorScene): SnapshotJson {
  const roots = scene.getUserRoots();
  const snapshot = serializeEcsTreeFromRoots(roots, { detachRoots: false });

  // Persist active camera only if it's a user entity (exclude editor camera/lights).
  try {
    const activeId = scene.getActiveCamera()?.id ?? null;
    snapshot.activeCameraEntityId = activeId && scene.getEntitiesById().has(activeId) ? activeId : null;
  } catch {
    snapshot.activeCameraEntityId = null;
  }

  return snapshotToJson(snapshot);
}
