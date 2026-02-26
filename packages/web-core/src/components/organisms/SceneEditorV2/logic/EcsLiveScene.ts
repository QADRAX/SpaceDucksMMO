import { Entity } from '@duckengine/ecs';
import {
    type EcsTreeSnapshot,
    parseEcsTreeSnapshot,
    createEmptyEcsTreeSnapshot,
} from '@/lib/ecs-snapshot';
import { serializeEcsTreeFromRoots } from '@/lib/ecs-snapshot';
import type { GameState } from '../types';

/**
 * EcsLiveScene — the unified, always-live scene for the editor.
 *
 * Design:
 * - ONE scene, never swapped out.
 * - Editor plugins (camera, gizmos) tick independently, always on.
 * - Game scripts controlled by play() / pause() / resume() / stop().
 * - stop() restores entity state from the pre-play snapshot.
 */
export class EcsLiveScene {
    readonly id: string;

    private _gameState: GameState = 'stopped';
    private _entitiesById = new Map<string, Entity>();
    private _roots: Entity[] = [];

    /** Snapshot captured at the moment Play is pressed. Restored on Stop. */
    private _prePlaySnapshot: EcsTreeSnapshot | null = null;

    /** The entity ID of the active game camera. */
    activeCameraEntityId: string | null = null;

    constructor(opts: {
        id: string;
        entitiesById: Map<string, Entity>;
        activeCameraEntityId?: string | null;
    }) {
        this.id = opts.id;
        this._entitiesById = new Map(opts.entitiesById);
        this.activeCameraEntityId = opts.activeCameraEntityId ?? null;
        this._rebuildRoots();
    }

    // ─── Accessors ─────────────────────────────────────────────────────────

    get gameState(): GameState { return this._gameState; }

    getEntitiesById(): ReadonlyMap<string, Entity> { return this._entitiesById; }
    getMutableEntitiesById(): Map<string, Entity> { return this._entitiesById; }
    getRoots(): readonly Entity[] { return this._roots; }

    // ─── Events ────────────────────────────────────────────────────────────

    private _entityListeners = new Set<(ev: { type: 'added' | 'removed', entity: Entity, id: string }) => void>();

    subscribeEntitiesChanged(listener: (ev: { type: 'added' | 'removed', entity: Entity, id: string }) => void): () => void {
        this._entityListeners.add(listener);
        return () => this._entityListeners.delete(listener);
    }

    // ─── Entity management ─────────────────────────────────────────────────

    addEntity(entity: Entity): void {
        if (this._entitiesById.has(entity.id)) return;
        this._entitiesById.set(entity.id, entity);
        this._rebuildRoots();
        this._entityListeners.forEach(l => l({ type: 'added', entity, id: entity.id }));
    }

    removeEntity(id: string): void {
        const entity = this._entitiesById.get(id);
        if (!entity) return;
        this._entitiesById.delete(id);
        this._rebuildRoots();
        this._entityListeners.forEach(l => l({ type: 'removed', entity, id }));
    }

    // ─── Play / Pause / Stop transitions ──────────────────────────────────

    async play(captureSnapshot: () => EcsTreeSnapshot): Promise<void> {
        if (this._gameState !== 'stopped') return;
        this._prePlaySnapshot = captureSnapshot();
        this._gameState = 'playing';
    }

    pause(): void {
        if (this._gameState !== 'playing') return;
        this._gameState = 'paused';
    }

    resume(): void {
        if (this._gameState !== 'paused') return;
        this._gameState = 'playing';
    }

    async stop(restoreFromSnapshot: (s: EcsTreeSnapshot) => void): Promise<void> {
        if (this._gameState === 'stopped') return;
        this._gameState = 'stopped';
        if (this._prePlaySnapshot !== null) {
            restoreFromSnapshot(this._prePlaySnapshot);
            this._prePlaySnapshot = null;
        }
    }

    /** Game-logic tick. No-op when not playing. */
    gameUpdate(_dt: number): void {
        if (this._gameState !== 'playing') return;
        // GameScriptSystem called here in Phase 2
    }

    // ─── Private ───────────────────────────────────────────────────────────

    private _rebuildRoots(): void {
        this._roots = Array.from(this._entitiesById.values()).filter((e) => !e.parent);
    }
}

// ─── Snapshot helpers ──────────────────────────────────────────────────────

export function collectAllFromRoots(roots: readonly Entity[]): Entity[] {
    const result: Entity[] = [];
    const visit = (e: Entity) => { result.push(e); for (const c of e.getChildren()) visit(c); };
    for (const r of roots) visit(r);
    return result;
}

export function serializeLiveScene(scene: EcsLiveScene): EcsTreeSnapshot {
    const roots = Array.from(scene.getRoots()) as Entity[];
    return serializeEcsTreeFromRoots(roots);
}

export { type EcsTreeSnapshot, createEmptyEcsTreeSnapshot, parseEcsTreeSnapshot };
