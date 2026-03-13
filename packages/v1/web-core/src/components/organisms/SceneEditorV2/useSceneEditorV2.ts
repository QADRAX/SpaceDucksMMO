'use client';

import * as React from 'react';
import type { EditorResource, SceneEditorV2Store } from './types';
import { makeSceneFromSnapshotJson, serializeLiveScene, restoreSceneFromSnapshot, collectAllFromRoots } from './logic/liveSceneRuntime';
import { EditorThreeScene } from './logic/EditorThreeScene';
import { ThreeMultiRenderer } from '@duckengine/rendering-three';
import { useEditorLayout } from './hooks/useEditorLayout';
import { useEditorPlugins } from './hooks/useEditorPlugins';
import { useRendererLoop } from './hooks/useRendererLoop';
import { createEditorInputServices, type EditorInputServices } from './logic/editorInputServices';
import { setInputServices } from '@duckengine/rendering-three/ecs';
import { useEditorStore } from './store';


/**
 * useSceneEditorV2 — composes sub-hooks into one SceneEditorV2Store.
 *
 *   useSceneHistory  → undo/redo stack of EcsTreeSnapshot (Moved to Store)
 *   useLiveScene     → play/pause/stop, applySnapshot (Moved to Store)
 *   useEditorActions → entity/component mutations (Moved to Store)
 *   useEditorLayout  → viewport registration 
 *   useEditorPlugins → plugin tick stub
 */
export function useSceneEditorV2(args: {
    resource: EditorResource;
    initialComponentDataJson: string | null;
}): SceneEditorV2Store {
    const [error, setError] = React.useState<string | null>(null);

    const isReadyRef = React.useRef(false);
    const rendererRef = React.useRef<ThreeMultiRenderer | null>(null);
    const editorSceneRef = React.useRef<EditorThreeScene | null>(null);
    const inputRef = React.useRef<EditorInputServices | null>(null);

    // ── Input Services ──────────────────────────────────────────────────────

    React.useEffect(() => {
        const input = createEditorInputServices();
        inputRef.current = input;

        try {
            input.keyboard.setEnabled(false);
        } catch (e) { }

        setInputServices({ mouse: input.mouse, keyboard: input.keyboard });

        input.keyboard.onKeyDown('escape', () => {
            try { input.mouse.exitPointerLock(); } catch (e) { }
            try { input.keyboard.setEnabled(false); } catch (e) { }
        });

        return () => {
            try { input.dispose(); } catch (e) { }
            inputRef.current = null;
            try { setInputServices(null); } catch (e) { }
        };
    }, []);

    // ── Initial scene build ────────────────────────────────────────────────

    React.useEffect(() => {
        if (isReadyRef.current) return;
        isReadyRef.current = true;

        try {
            // 1. Create purely ECS model
            const { scene } = makeSceneFromSnapshotJson({
                id: args.resource.id,
                snapshotJson: args.initialComponentDataJson,
            });

            // 2. Create Engine
            const engine = new ThreeMultiRenderer({ antialias: true, alpha: true } as any);
            rendererRef.current = engine;

            // 3. Create Editor wrapper and bind them
            const editorScene = new EditorThreeScene(scene);
            editorSceneRef.current = editorScene;
            engine.setScene(editorScene);

            // 4. Initialize Store
            useEditorStore.getState().initialize(scene, engine);
            useEditorStore.getState().syncHierarchy();

        } catch (e) {
            console.error('Failed to initialize Scene Editor V2:', e);
            setError(e instanceof Error ? e.message : 'Unknown error during init');
        }

        return () => {
            rendererRef.current?.dispose();
        };
    }, [args.resource.id, args.initialComponentDataJson]);

    // ── Sync ECS entity additions/removals to the Three.js wrapper ─────────

    // We bind it effectively based on the initialized store reference.
    const activeScene = useEditorStore(s => s.scene);
    React.useEffect(() => {
        const scene = activeScene;
        const editorScene = editorSceneRef.current;
        if (!scene || !editorScene) return;

        const unsubscribe = scene.subscribeEntitiesChanged((ev: any) => {
            if (ev.type === 'added') editorScene.syncEntityAdded(ev.entity);
            if (ev.type === 'removed') editorScene.syncEntityRemoved(ev.id);
        });

        return unsubscribe;
    }, [activeScene]);


    // ── Layout ─────────────────────────────────────────────────────────────

    const layout = useEditorLayout();

    // ── Editor plugins ─────────────────────────────────────────────────────

    const plugins = useEditorPlugins({
        gameState: useEditorStore(s => s.gameState),
        selectedId: useEditorStore(s => s.selectedId),
        actions: {} as any,
        inputRef,
    });

    React.useEffect(() => {
        plugins.notifyGameStateChanged(useEditorStore.getState().gameState);
    }, [useEditorStore(s => s.gameState)]);

    React.useEffect(() => {
        plugins.notifySelectionChanged(useEditorStore.getState().selectedId ? [useEditorStore.getState().selectedId!] : []);
    }, [useEditorStore(s => s.selectedId)]);

    // ── Renderer Loop ──────────────────────────────────────────────────────

    const rendererLoop = useRendererLoop({
        getEditorPluginTick: () => plugins.tick,
        onError: setError,
    });

    React.useEffect(() => {
        rendererLoop.startLoop();
        return () => rendererLoop.stopLoop();
    }, [rendererLoop]);

    // ── Formatting public API ──────────────────────────────────────────────

    const sceneRevision = useEditorStore(s => s.sceneRevision);
    const { allEntities, hierarchyRoots } = React.useMemo(() => {
        const scene = useEditorStore.getState().scene;
        if (!scene) return { allEntities: [], hierarchyRoots: [] };
        const roots = Array.from(scene.getRoots());
        return { hierarchyRoots: roots, allEntities: collectAllFromRoots(roots) as any[] };
    }, [sceneRevision]);

    return {
        error,
        setError,
        sceneId: args.resource.id,
        resourceDisplayName: args.resource.displayName,
        onSetResourceDisplayName: (v: string) => { },
        onSaveResourceDisplayName: async (v: string) => { },
        sceneRevision,
        presentationRevision: sceneRevision,

        layout,
        registerViewport: layout.registerViewport,
        unregisterViewport: layout.unregisterViewport,

        allEntities,
        hierarchyRoots: hierarchyRoots as any[],
        gameState: useEditorStore(s => s.gameState),
        selectedId: useEditorStore(s => s.selectedId),
        selectedEntity: useEditorStore(s => s.selectedId) ? (useEditorStore.getState().scene?.getEntitiesById().get(useEditorStore(s => s.selectedId)!) as any) : undefined,
        activeCameraEntityId: null,
        onSetActiveCameraEntityId: () => { },

        sceneRef: { current: useEditorStore.getState().scene },
        engineRef: rendererRef,
        engine: rendererRef.current,
        factory: null as any,
        inputRef,
        input: inputRef.current,

        onSetSelectedName: useEditorStore.getState().onSetSelectedName,
        onSetSelectedGizmoIcon: useEditorStore.getState().onSetSelectedGizmoIcon,
        onSetSelectedLocalPositionAxis: (axis: 'x' | 'y' | 'z', n: number) => { },

        actions: {
            onCreateEmpty: useEditorStore.getState().onCreateEmpty,
            onDeleteSelected: useEditorStore.getState().onDeleteSelected,
            onDuplicateSelected: useEditorStore.getState().onDuplicateSelected,
            onReparentEntity: useEditorStore.getState().onReparentEntity,
            onReparent: (id: string | null) => useEditorStore.getState().onReparentEntity(useEditorStore.getState().selectedId!, id),
            onSetSelectedName: useEditorStore.getState().onSetSelectedName,
            onSetSelectedGizmoIcon: useEditorStore.getState().onSetSelectedGizmoIcon,
            onSetActiveCameraEntityId: () => { },
            mutateSelected: () => { },
        },
        onCreateEmpty: useEditorStore.getState().onCreateEmpty,
        onDeleteSelected: useEditorStore.getState().onDeleteSelected,
        onDuplicateSelected: useEditorStore.getState().onDuplicateSelected,
        onAddComponent: (type: string) => { },
        onRemoveComponent: (type: string) => { },
        onUpdateSelectedComponentData: (type: string, data: Record<string, unknown> & { live?: boolean }) => { },
        onReparentEntity: useEditorStore.getState().onReparentEntity,

        onPlay: () => useEditorStore.getState().setGameState('playing'),
        onPause: () => useEditorStore.getState().setGameState('paused'),
        onResume: () => useEditorStore.getState().setGameState('playing'),
        onStop: () => {
            useEditorStore.getState().setGameState('stopped');
            useEditorStore.getState().undo();
        },

        commitFromCurrentScene: useEditorStore.getState().commitFromCurrentScene,

        canUndo: useEditorStore(s => s.historyCursor > 0),
        canRedo: useEditorStore(s => s.historyCursor < s.historyStackCount - 1),
        undo: useEditorStore.getState().undo,
        redo: useEditorStore.getState().redo,
        onUndo: useEditorStore.getState().undo,
        onRedo: useEditorStore.getState().redo,
        dirty: false,
        onSave: async () => { },

        setSelectedId: useEditorStore.getState().setSelectedId,
    };
}
