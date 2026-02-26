import type { StateCreator } from 'zustand';
import { Entity, type ComponentType, type DefaultEcsComponentFactory } from '@duckengine/ecs';
import { collectAllFromRoots } from '../../logic/EcsLiveScene';
import type { EditorSceneGraphSlice, SceneEditorState } from '../types';

// ============================================================================
// HELPER METHODS (Pure)
// ============================================================================

function validateReparent(
    child: Entity,
    newParent: Entity | undefined
): { ok: true } | { ok: false; error: string } {
    if (!newParent) return { ok: true };
    if (newParent.id === child.id) return { ok: false, error: 'An entity cannot be its own parent' };

    // Walk up tree
    let current: Entity | undefined = newParent;
    while (current) {
        if (current.id === child.id) return { ok: false, error: 'Reparenting would create a cycle' };
        current = current.parent ?? undefined;
    }
    return { ok: true };
}

// ============================================================================
// SLICE CREATOR
// ============================================================================

export const createSceneGraphSlice: StateCreator<
    SceneEditorState,
    [],
    [],
    EditorSceneGraphSlice
> = (set, get) => {

    // Internal helper to perform mutations with state checks and history commits
    const mutateSelected = (
        fn: (scene: NonNullable<SceneEditorState['sceneRef']['current']>, ent: Entity) => void,
        reason: string,
        liveOnly = false
    ) => {
        const { sceneRef, selectedId, gameState, commitFromCurrentScene, setError } = get();
        const scene = sceneRef.current;
        if (!scene || !selectedId) return;

        const ent = scene.getMutableEntitiesById().get(selectedId);
        if (!ent) return;

        try {
            fn(scene, ent);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Edit failed');
            return;
        }

        // Live only changes (like slider dragging) don't create history frames
        // In Play mode, nothing creates history frames
        if (liveOnly || gameState !== 'stopped') return;

        commitFromCurrentScene(reason);
    };

    return {
        // STATE
        selectedId: null,

        // SELECTION
        setSelectedId: (id) => set({ selectedId: id }),

        // ENTITY LIFECYCLE
        onCreateEmpty: () => {
            const { gameState, sceneRef, selectedId, commitFromCurrentScene } = get();
            if (gameState !== 'stopped') return;

            const scene = sceneRef.current;
            if (!scene) return;

            const parent = selectedId ? scene.getMutableEntitiesById().get(selectedId) : undefined;
            const id = globalThis.crypto?.randomUUID?.() ?? `entity_${Math.random().toString(16).slice(2)}`;
            const e = new Entity(id);
            e.displayName = 'Entity';

            if (parent) parent.addChild(e);
            scene.addEntity(e);

            set({ selectedId: e.id });
            commitFromCurrentScene('create-empty');
        },

        onDeleteSelected: () => {
            const { gameState, sceneRef, selectedId, commitFromCurrentScene, setError } = get();
            if (gameState !== 'stopped') return;

            const scene = sceneRef.current;
            if (!scene || !selectedId) return;

            const ent = scene.getMutableEntitiesById().get(selectedId);
            if (!ent) return;

            const toRemove = collectAllFromRoots([ent]);

            try {
                ent.parent?.removeChild(ent.id);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to detach from parent');
                return;
            }

            for (const e of toRemove.reverse()) {
                try { scene.removeEntity(e.id); } catch { /* ignore */ }
            }

            set({ selectedId: null });
            commitFromCurrentScene('delete');
        },

        onDuplicateSelected: () => {
            const { gameState, sceneRef, selectedId, commitFromCurrentScene, setError, logWarn } = get();
            if (gameState !== 'stopped') return;

            const scene = sceneRef.current;
            if (!scene || !selectedId) return;

            const original = scene.getMutableEntitiesById().get(selectedId);
            if (!original) return;

            logWarn('SceneGraph', 'Duplicate entity not fully implemented yet');
            // TODO: Implement deep cloning of ECS entities via snapshot APIs.
            // try {
            //     const cloned = scene.cloneEntity(original);
            //     const parent = original.parent;
            //     if (parent) parent.addChild(cloned);

            //     cloned.transform.localPosition.copy(original.transform.localPosition);
            //     cloned.transform.localRotation.copy(original.transform.localRotation);
            //     cloned.transform.localScale.copy(original.transform.localScale);
            //     cloned.transform.setDirty();

            //     set({ selectedId: cloned.id });
            //     commitFromCurrentScene('duplicate');
            // } catch (e) {
            //     setError(e instanceof Error ? e.message : 'Clone failed');
            // }
        },

        onReparentEntity: (childId, newParentId) => {
            const { gameState, sceneRef, commitFromCurrentScene, setError } = get();
            if (gameState !== 'stopped') return;

            const scene = sceneRef.current;
            if (!scene) return;

            const child = scene.getMutableEntitiesById().get(childId);
            if (!child) { setError(`Entity '${childId}' not found`); return; }

            const newParent = newParentId ? scene.getMutableEntitiesById().get(newParentId) : undefined;
            const validation = validateReparent(child, newParent);
            if (!validation.ok) { setError(validation.error); return; }

            try {
                child.parent?.removeChild(child.id);
                if (newParent) newParent.addChild(child);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Reparent failed');
                return;
            }

            commitFromCurrentScene('reparent');
        },

        // TRANSFORM & METADATA
        onSetSelectedName: (name) => {
            mutateSelected((_s, ent) => { ent.displayName = name; }, 'set-name');
        },

        onSetSelectedGizmoIcon: (icon) => {
            mutateSelected((_s, ent) => { ent.gizmoIcon = icon.trim() || undefined; }, 'set-gizmo-icon');
        },

        onSetSelectedLocalPositionAxis: (axis, val) => {
            mutateSelected((_s, ent) => {
                const p = ent.transform.localPosition;
                const pos = { x: p.x, y: p.y, z: p.z } as Record<string, number>;
                pos[axis] = Number.isFinite(val) ? val : 0;
                ent.transform.setPosition(pos.x, pos.y, pos.z);
            }, `transform-pos-${axis}`, true /* live drag */);
        },

        // COMPONENTS
        onAddComponent: (type) => {
            mutateSelected((_scene, ent) => {
                const { engineRef } = get();
                const factory = engineRef.current?.ecs?.componentFactory as DefaultEcsComponentFactory | undefined;
                if (!factory) throw new Error('Component factory not initialized');

                const comp = factory.create(type as any, undefined);
                const res = ent.safeAddComponent(comp as any);
                if (!res.ok) throw new Error(res.error.message);
            }, `add-component:${type}`);
        },

        onRemoveComponent: (type) => {
            mutateSelected((_scene, ent) => {
                const res = ent.safeRemoveComponent(type as ComponentType);
                if (!res.ok) throw new Error(res.error.message);
            }, `remove-component:${type}`);
        },

        onUpdateSelectedComponentData: (type, data) => {
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
        }
    };
};
