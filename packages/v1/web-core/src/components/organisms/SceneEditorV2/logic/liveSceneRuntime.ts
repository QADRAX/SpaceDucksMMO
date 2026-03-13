import { Entity, DefaultEcsComponentFactory } from '@duckengine/core';
import {
    type EcsTreeSnapshot,
    createEmptyEcsTreeSnapshot,
    parseEcsTreeSnapshot,
    deserializeEcsTreeSnapshotToEntities,
} from '@/lib/ecs-snapshot';
import {
    EcsLiveScene,
    serializeLiveScene,
    collectAllFromRoots,
} from './EcsLiveScene';

export { serializeLiveScene, collectAllFromRoots, type EcsTreeSnapshot };

// ─── Create scene from snapshot ────────────────────────────────────────────

export function makeSceneFromSnapshotJson(opts: {
    id: string;
    snapshotJson: EcsTreeSnapshot | string | null;
}): { scene: EcsLiveScene; canonicalSnapshot: EcsTreeSnapshot } {
    const raw = (() => {
        if (!opts.snapshotJson) return createEmptyEcsTreeSnapshot();
        if (typeof opts.snapshotJson === 'string') {
            try { return JSON.parse(opts.snapshotJson) as EcsTreeSnapshot; }
            catch { return createEmptyEcsTreeSnapshot(); }
        }
        return opts.snapshotJson;
    })();

    const snapshot = parseEcsTreeSnapshot(raw);
    const result = deserializeEcsTreeSnapshotToEntities(snapshot, { strict: false });

    const scene = new EcsLiveScene({
        id: opts.id,
        entitiesById: result.entitiesById,
        activeCameraEntityId: result.activeCameraEntityId,
    });

    return { scene, canonicalSnapshot: snapshot };
}

// ─── Restore scene from snapshot (undo / stop) ────────────────────────────

export function restoreSceneFromSnapshot(
    scene: EcsLiveScene,
    snapshot: EcsTreeSnapshot
): void {
    const result = deserializeEcsTreeSnapshotToEntities(snapshot, { strict: false });

    // Clear existing entities
    for (const id of Array.from(scene.getMutableEntitiesById().keys())) {
        try { scene.removeEntity(id); } catch { /* ignore */ }
    }

    // Insert restored entities (roots trigger addEntity which rebuilds the roots list)
    for (const [id, entity] of result.entitiesById) {
        scene.getMutableEntitiesById().set(id, entity);
        if (!entity.parent) scene.addEntity(entity); // only add roots; children link via parent
    }

    scene.activeCameraEntityId = result.activeCameraEntityId ?? null;
}
