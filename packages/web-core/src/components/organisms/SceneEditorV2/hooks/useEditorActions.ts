'use client';

import * as React from 'react';
import { Entity, type DefaultEcsComponentFactory, type ComponentType } from '@duckengine/ecs';
import type { EcsLiveScene } from '../logic/EcsLiveScene';
import { collectAllFromRoots } from '../logic/EcsLiveScene';
import { useStableEvent } from '../useStableEvent';
import type { GameState } from '../types';

function validateReparent(
    child: Entity,
    newParent: Entity | undefined
): { ok: true } | { ok: false; error: string } {
    if (!newParent) return { ok: true };
    if (newParent.id === child.id) return { ok: false, error: 'An entity cannot be its own parent' };
    // Walk up the tree to detect cycles
    let current: Entity | undefined = newParent;
    while (current) {
        if (current.id === child.id) return { ok: false, error: 'Reparenting would create a cycle' };
        current = current.parent ?? undefined;
    }
    return { ok: true };
}

/**
 * useEditorActions — all entity/component mutation actions.
 *
 * - In 'stopped' mode: mutations commit via `commitFromCurrentScene`
 * - In 'playing'/'paused' mode: mutations are live-only (no history commit)
 *   This is the Unity-style "inspect live entities" behaviour.
 */
export function useEditorActions(args: {
    gameStateRef: React.RefObject<GameState>;
    sceneRef: React.RefObject<EcsLiveScene | null>;
    selectedIdRef: React.RefObject<string | null>;
    setSelectedId: (id: string | null) => void;
    setError: (msg: string | null) => void;
    commitFromCurrentScene: (reason: string) => void;
    factoryRef: React.RefObject<DefaultEcsComponentFactory>;
    bumpPresentationRevision: () => void;
}) {
    const isStopped = () => args.gameStateRef.current === 'stopped';

    // ── Internal helper — mutate selected entity ──────────────────────────

    const mutateSelected = useStableEvent((
        fn: (scene: EcsLiveScene, ent: Entity) => void,
        reason: string,
        liveOnly = false,
    ) => {
        const scene = args.sceneRef.current;
        const selectedId = args.selectedIdRef.current;
        if (!scene || !selectedId) return;

        const ent = scene.getMutableEntitiesById().get(selectedId);
        if (!ent) return;

        try {
            fn(scene, ent);
        } catch (e) {
            args.setError(e instanceof Error ? e.message : 'Edit failed');
            return;
        }

        if (liveOnly || !isStopped()) return;
        args.commitFromCurrentScene(reason);
    });

    // ── Entity creation / deletion ────────────────────────────────────────

    const onCreateEmpty = useStableEvent(() => {
        if (!isStopped()) return;
        const scene = args.sceneRef.current;
        if (!scene) return;

        const selectedId = args.selectedIdRef.current;
        const parent = selectedId ? scene.getMutableEntitiesById().get(selectedId) : undefined;

        const id = globalThis.crypto?.randomUUID?.() ?? `entity_${Math.random().toString(16).slice(2)}`;
        const e = new Entity(id);
        e.displayName = 'Entity';

        if (parent) parent.addChild(e);
        scene.addEntity(e);

        args.setSelectedId(e.id);
        args.commitFromCurrentScene('create-empty');
    });

    const onDeleteSelected = useStableEvent(() => {
        if (!isStopped()) return;
        const scene = args.sceneRef.current;
        const selectedId = args.selectedIdRef.current;
        if (!scene || !selectedId) return;

        const ent = scene.getMutableEntitiesById().get(selectedId);
        if (!ent) return;

        const toRemove = collectAllFromRoots([ent]);

        try {
            ent.parent?.removeChild(ent.id);
        } catch (e) {
            args.setError(e instanceof Error ? e.message : 'Failed to detach from parent');
            return;
        }

        for (const e of toRemove.reverse()) {
            try { scene.removeEntity(e.id); } catch { /* ignore */ }
        }

        args.setSelectedId(null);
        args.commitFromCurrentScene('delete');
    });

    // ── Reparenting ───────────────────────────────────────────────────────

    const onReparentEntity = useStableEvent((childId: string, newParentId: string | null) => {
        if (!isStopped()) return;
        const scene = args.sceneRef.current;
        if (!scene) return;

        const child = scene.getMutableEntitiesById().get(childId);
        if (!child) { args.setError(`Entity '${childId}' not found`); return; }

        const newParent = newParentId ? scene.getMutableEntitiesById().get(newParentId) : undefined;
        const validation = validateReparent(child, newParent);
        if (!validation.ok) { args.setError(validation.error); return; }

        try {
            child.parent?.removeChild(child.id);
            if (newParent) newParent.addChild(child);
        } catch (e) {
            args.setError(e instanceof Error ? e.message : 'Reparent failed');
            return;
        }

        args.commitFromCurrentScene('reparent');
    });

    const onReparent = useStableEvent((newParentId: string | null) => {
        const selectedId = args.selectedIdRef.current;
        if (selectedId) onReparentEntity(selectedId, newParentId);
    });

    // ── Active camera ─────────────────────────────────────────────────────

    const onSetActiveCameraEntityId = useStableEvent((id: string | null) => {
        if (!isStopped()) return;
        const scene = args.sceneRef.current;
        if (!scene) return;

        if (id) {
            const ent = scene.getMutableEntitiesById().get(id);
            if (!ent) { args.setError(`Entity '${id}' not found`); return; }
            if (!ent.getComponent('cameraView')) {
                args.setError(`Entity '${id}' has no CameraViewComponent`); return;
            }
        }

        scene.activeCameraEntityId = id;
        args.commitFromCurrentScene('set-active-camera');
    });

    // ── Component mutations ───────────────────────────────────────────────

    const onAddComponent = useStableEvent((type: string) => {
        mutateSelected((_scene, ent) => {
            const factory = args.factoryRef.current;
            if (!factory) throw new Error('Component factory not initialized');
            const comp = factory.create(type as any, undefined);
            const res = ent.safeAddComponent(comp as any);
            if (!res.ok) throw new Error(res.error.message);
        }, `add-component:${type}`);
    });

    const onRemoveComponent = useStableEvent((type: string) => {
        mutateSelected((_scene, ent) => {
            const res = ent.safeRemoveComponent(type as ComponentType);
            if (!res.ok) throw new Error(res.error.message);
        }, `remove-component:${type}`);
    });

    const onUpdateSelectedComponentData = useStableEvent((
        type: string,
        data: Record<string, unknown> & { live?: boolean }
    ) => {
        const { live, ...actualData } = data;
        mutateSelected((_scene, ent) => {
            const comp = ent.getComponent(type as ComponentType) as any;
            if (!comp) throw new Error(`Component '${type}' not found`);

            const fields = (comp.metadata?.inspector?.fields ?? []) as Array<{
                key: string;
                set?: (c: any, v: any) => void;
            }>;
            const fieldByKey = new Map(fields.map((f) => [f.key, f] as const));

            for (const [k, v] of Object.entries(actualData)) {
                const f = fieldByKey.get(k);
                if (f?.set) f.set(comp, v);
                else (comp as any)[k] = v;
            }
        }, `edit-component:${type}`, !!live);
    });

    // ── Entity meta ───────────────────────────────────────────────────────

    const onSetSelectedName = useStableEvent((value: string) => {
        mutateSelected((_s, ent) => { ent.displayName = value; }, 'set-name');
    });

    const onSetSelectedGizmoIcon = useStableEvent((value: string) => {
        mutateSelected((_s, ent) => { ent.gizmoIcon = value.trim() || undefined; }, 'set-gizmo-icon');
    });

    const onSetSelectedLocalPositionAxis = useStableEvent((axis: 'x' | 'y' | 'z', n: number) => {
        mutateSelected((_s, ent) => {
            const p = ent.transform.localPosition;
            const pos = { x: p.x, y: p.y, z: p.z } as Record<string, number>;
            pos[axis] = Number.isFinite(n) ? n : 0;
            ent.transform.setPosition(pos.x, pos.y, pos.z);
        }, `transform-pos-${axis}`, true /* live during drag */);
    });

    // ── Debug overlays (entity-level, legacy) ────────────────────────────

    const onToggleEntityDebug = useStableEvent((id: string, kind: any) => {
        const scene = args.sceneRef.current;
        const ent = scene?.getMutableEntitiesById().get(id);
        if (!ent) return;
        try { ent.setDebugEnabled(kind, !ent.isDebugEnabled(kind)); } finally {
            args.bumpPresentationRevision();
        }
    });

    return {
        onCreateEmpty,
        onDeleteSelected,
        onReparent,
        onReparentEntity,
        onSetActiveCameraEntityId,
        onAddComponent,
        onRemoveComponent,
        onUpdateSelectedComponentData,
        onSetSelectedName,
        onSetSelectedGizmoIcon,
        onSetSelectedLocalPositionAxis,
        onToggleEntityDebug,
    };
}
