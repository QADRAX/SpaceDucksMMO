'use client';

import * as React from 'react';
import type { EditorResource, SceneEditorV2Store } from './types';
import { makeSceneFromSnapshotJson, serializeLiveScene, restoreSceneFromSnapshot, collectAllFromRoots } from './logic/liveSceneRuntime';
import { EcsLiveScene } from './logic/EcsLiveScene';
import { EditorThreeScene } from './logic/EditorThreeScene';
import { ThreeMultiRenderer } from '@duckengine/rendering-three';
import { useSceneHistory } from './hooks/useSceneHistory';
import { useLiveScene } from './hooks/useLiveScene';
import { useEditorActions } from './hooks/useEditorActions';
import { useEditorLayout } from './hooks/useEditorLayout';
import { useEditorPlugins } from './hooks/useEditorPlugins';
import { useRendererLoop } from './hooks/useRendererLoop';
import { createEditorInputServices, type EditorInputServices } from './logic/editorInputServices';
import { setInputServices } from '@duckengine/rendering-three/ecs';


/**
 * useSceneEditorV2 — composes sub-hooks into one SceneEditorV2Store.
 *
 *   useSceneHistory  → undo/redo stack of EcsTreeSnapshot
 *   useLiveScene     → play/pause/stop, applySnapshot
 *   useEditorActions → entity/component mutations
 *   useEditorLayout  → viewport registration
 *   useEditorPlugins → plugin tick stub
 */
export function useSceneEditorV2(args: {
    resource: EditorResource;
    initialComponentDataJson: string | null;
}): SceneEditorV2Store {
    // ── Error ──────────────────────────────────────────────────────────────

    const [error, setError] = React.useState<string | null>(null);

    // ── Scene ref ──────────────────────────────────────────────────────────

    const sceneRef = React.useRef<EcsLiveScene | null>(null);
    const engineRef = React.useRef<ThreeMultiRenderer | null>(null);
    const editorSceneRef = React.useRef<EditorThreeScene | null>(null);
    const inputRef = React.useRef<EditorInputServices | null>(null);

    // ── Input Services ──────────────────────────────────────────────────────

    React.useEffect(() => {
        const input = createEditorInputServices();
        inputRef.current = input;

        // Start disabled so typing in inputs doesn't trigger game actions
        try {
            input.keyboard.setEnabled(false);
        } catch (e) {
            // ignore
        }

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

    const [initialSnapshot] = React.useState(() => {
        // 1. Create purely ECS model
        const { scene, canonicalSnapshot } = makeSceneFromSnapshotJson({
            id: args.resource.id,
            snapshotJson: args.initialComponentDataJson,
        });
        sceneRef.current = scene;

        // 2. Create Engine
        const engine = new ThreeMultiRenderer({} as any);
        engineRef.current = engine;

        // 3. Create EditorThreeScene (binds ECS to Engine)
        const editorScene = new EditorThreeScene(scene);
        editorSceneRef.current = editorScene;
        engine.setScene(editorScene);

        return canonicalSnapshot;
    });

    // ── History ────────────────────────────────────────────────────────────

    const history = useSceneHistory(initialSnapshot);

    // ── Revisions ──────────────────────────────────────────────────────────

    const [presentationRevision, setPresentationRevision] = React.useState(0);
    const bumpPresentationRevision = React.useCallback(() => {
        setPresentationRevision((r) => r + 1);
    }, []);

    const [sceneRevision, setSceneRevision] = React.useState(0);

    // ── Live scene lifecycle ───────────────────────────────────────────────

    const liveScene = useLiveScene({
        sceneRef,
        commitToHistory: history.commit,
        setSceneRevision,
        setError,
    });

    // Apply history cursor changes (undo/redo) → restore scene
    React.useEffect(() => {
        liveScene.applySnapshot(history.current);
    }, [history.current]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Selection ──────────────────────────────────────────────────────────

    const [selectedId, setSelectedId] = React.useState<string | null>(null);
    const selectedIdRef = React.useRef<string | null>(null);
    React.useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

    const factoryRef = React.useRef<any>(null);

    // ── Actions (Entity Mutation) ──────────────────────────────────────────

    const actions = useEditorActions({
        gameStateRef: liveScene.gameStateRef,
        sceneRef,
        selectedIdRef,
        setSelectedId,
        setError,
        commitFromCurrentScene: liveScene.commitFromCurrentScene,
        factoryRef,
        bumpPresentationRevision,
    });

    // Sync ECS entity additions/removals to the Three.js wrapper
    React.useEffect(() => {
        const scene = sceneRef.current;
        const editorScene = editorSceneRef.current;
        if (!scene || !editorScene) return;

        const unsubscribe = scene.subscribeEntitiesChanged((ev) => {
            if (ev.type === 'added') editorScene.syncEntityAdded(ev.entity);
            if (ev.type === 'removed') editorScene.syncEntityRemoved(ev.id);
        });
        return unsubscribe;
    }, []);

    // ── Layout ─────────────────────────────────────────────────────────────

    const layout = useEditorLayout();

    // ── Editor plugins ─────────────────────────────────────────────────────

    const plugins = useEditorPlugins({
        gameState: liveScene.gameState,
        selectedId,
        actions,
        inputRef,
    });

    React.useEffect(() => {
        plugins.notifyGameStateChanged(liveScene.gameState);
    }, [liveScene.gameState]); // eslint-disable-line react-hooks/exhaustive-deps

    React.useEffect(() => {
        plugins.notifySelectionChanged(selectedId ? [selectedId] : []);
    }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Renderer Loop ──────────────────────────────────────────────────────

    // We start the RAF loop here and pass the refs. We use a placeholder for primaryViewportRef
    // since we use ThreeMultiRenderer which manages its own viewports via .addView()
    const rendererLoop = useRendererLoop({
        primaryViewportRef: { current: null },
        rendererRef: engineRef as React.RefObject<ThreeMultiRenderer | null>,
        sceneRef: sceneRef as React.RefObject<EcsLiveScene | null>,
        gameStateRef: liveScene.gameStateRef,
        getEditorPluginTick: () => plugins.tick,
        onError: setError,
    });

    React.useEffect(() => {
        rendererLoop.startLoop();
        return () => rendererLoop.stopLoop();
    }, [rendererLoop]);

    // ── Derived ────────────────────────────────────────────────────────────

    const { allEntities, hierarchyRoots } = React.useMemo(() => {
        const scene = sceneRef.current;
        if (!scene) return { allEntities: [], hierarchyRoots: [] };
        const roots = Array.from(scene.getRoots());
        return { hierarchyRoots: roots, allEntities: collectAllFromRoots(roots) };
    }, [sceneRevision, presentationRevision]); // eslint-disable-line react-hooks/exhaustive-deps

    const selectedEntity = React.useMemo(
        () => !selectedId ? undefined : sceneRef.current?.getMutableEntitiesById().get(selectedId),
        [selectedId, presentationRevision] // eslint-disable-line react-hooks/exhaustive-deps
    );

    // ── Save / persistence ─────────────────────────────────────────────────

    const [resourceDisplayName, setResourceDisplayName] = React.useState(args.resource.displayName);
    const [dirty, setDirty] = React.useState(false);

    React.useEffect(() => { setDirty(history.canUndo); }, [history.canUndo]);

    const onSaveResourceDisplayName = React.useCallback(async (_v: string) => {
        // TODO: call API
    }, []);

    const onSave = React.useCallback(async () => {
        if (liveScene.gameState !== 'stopped') return;
        // TODO: call API with serializeLiveScene(sceneRef.current)
        setDirty(false);
    }, [liveScene.gameState]);

    // ── Assemble store ─────────────────────────────────────────────────────

    return {
        resourceDisplayName,
        onSetResourceDisplayName: setResourceDisplayName,
        onSaveResourceDisplayName,

        error,
        setError,

        gameState: liveScene.gameState,
        onPlay: liveScene.onPlay,
        onPause: liveScene.onPause,
        onResume: liveScene.onResume,
        onStop: liveScene.onStop,

        dirty,
        canUndo: history.canUndo,
        canRedo: history.canRedo,
        onUndo: history.undo,
        onRedo: history.redo,
        onSave,

        presentationRevision,
        sceneRevision,

        selectedId,
        setSelectedId,
        selectedEntity,

        hierarchyRoots,
        allEntitiesForHierarchy: allEntities,

        activeCameraEntityId: sceneRef.current?.activeCameraEntityId ?? null,
        onSetActiveCameraEntityId: actions.onSetActiveCameraEntityId,

        onCreateEmpty: actions.onCreateEmpty,
        onDeleteSelected: actions.onDeleteSelected,
        onReparent: actions.onReparent,
        onReparentEntity: actions.onReparentEntity,

        onAddComponent: actions.onAddComponent,
        onRemoveComponent: actions.onRemoveComponent,
        onUpdateSelectedComponentData: actions.onUpdateSelectedComponentData,

        onSetSelectedName: actions.onSetSelectedName,
        onSetSelectedGizmoIcon: actions.onSetSelectedGizmoIcon,
        onSetSelectedLocalPositionAxis: actions.onSetSelectedLocalPositionAxis,


        factory: factoryRef.current ?? ({ listCreatableComponents: () => [] } as any),
        creatableComponents: [],
        referenceOptions: allEntities.map((e) => ({ id: e.id, label: e.displayName || e.id })),

        viewports: layout.viewports,
        registerViewport: layout.registerViewport,
        unregisterViewport: layout.unregisterViewport,

        engine: engineRef.current ?? undefined,
        input: inputRef.current ?? undefined,
        commitFromCurrentScene: liveScene.commitFromCurrentScene,
    };
}
