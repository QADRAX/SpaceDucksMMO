/**
 * All DuckEngine API types and TSDoc live here. The implementation is in createDuckEngineAPI.ts (minimal).
 * This file defines InferredDuckEngineAPI and scope types from buildDuckEngineAPI, exports DuckEngineAPI
 * for the implementation return type, and uses declaration merging to attach TSDoc for the IDE.
 *
 * Entity/component scope method TSDoc cannot be merged (generic component return conflicts).
 * Use DuckEngineEntityScopeDoc and DuckEngineComponentScopeDoc for full method documentation.
 */
import type { buildDuckEngineAPI } from './createDuckEngineAPI';

/** Inferred API shape; DuckEngineAPI extends this and is augmented with TSDoc below. */
export type InferredDuckEngineAPI = ReturnType<typeof buildDuckEngineAPI>;

/** Scene-scoped API returned by `api.scene(id)`. */
export interface DuckEngineSceneScope extends ReturnType<InferredDuckEngineAPI['scene']> {}

/** Entity-scoped API returned by `scene.entity(id)`. Type alias to avoid merge conflict with component().setField. */
export type DuckEngineEntityScope = ReturnType<ReturnType<InferredDuckEngineAPI['scene']>['entity']>;

/** Viewport-scoped API returned by `api.viewport(id)`. */
export interface DuckEngineViewportScope extends ReturnType<InferredDuckEngineAPI['viewport']> {}

/** Fully-typed DuckEngine API surface. TSDoc is attached via declaration merging below. */
export interface DuckEngineAPI extends InferredDuckEngineAPI {}

import type { Result } from '../../domain/utils';
import type { EntityId } from '../../domain/ids';
import type { SceneState, ViewportState } from '../../domain';
import type { SceneView } from '../../domain/scene';
import type { ViewportView } from '../../domain/viewport';
import type { EntityView } from '../../domain/entities';
import type { GameSettings } from '../../domain/engine';

import type { AddSceneParams } from '../../application/engine/addSceneToEngine';
import type { RemoveSceneParams } from '../../application/engine/removeSceneFromEngine';
import type { AddViewportParams } from '../../application/engine/addViewport';
import type { RemoveViewportParams } from '../../application/engine/removeViewport';
import type { RegisterCanvasParams } from '../../application/engine/registerCanvas';
import type { UnregisterCanvasParams } from '../../application/engine/unregisterCanvas';
import type { SetEnginePausedParams } from '../../application/engine/setEnginePaused';
import type { SetupEngineParams } from '../../application/engine/setupEngine';
import type { RegisterEngineSubsystemParams } from '../../application/engine/registerEngineSubsystem';
import type { UpdateSettingsParams } from '../../application/engine/updateSettings';
import type { AddEntityParams } from '../../application/scene/addEntityToScene';
import type { AddPrefabParams } from '../../application/prefabs/addPrefab';
import type { InstantiatePrefabParams } from '../../application/prefabs/instantiatePrefab';
import type { RemoveEntityParams } from '../../application/scene/removeEntityFromScene';
import type { ReparentEntityParams } from '../../application/scene/reparentEntityInScene';
import type { SetActiveCameraParams } from '../../application/scene/setActiveCamera';
import type { ToggleSceneDebugParams } from '../../application/scene/toggleSceneDebug';
import type { SetupSceneParams } from '../../application/scene/setupScene';
import type { UpdateSceneParams } from '../../application/scene/updateScene';
import type { SetScenePausedParams } from '../../application/scene/setScenePaused';
import type { SubscribeToSceneChangesParams } from '../../application/scene/subscribeToSceneChanges';
import type { AddUISlotParams } from '../../domain/ports';
import type { RemoveUISlotParams } from '../../application/scene/removeUISlot';
import type { UpdateUISlotParamsWithId } from '../../application/scene/updateUISlot';
import type { SetViewportEnabledParams } from '../../application/viewport/setViewportEnabled';
import type { SetViewportDebugEnabledParams } from '../../application/viewport/setViewportDebugEnabled';
import type { SetViewportSceneParams } from '../../application/viewport/setViewportScene';
import type { SetViewportCameraParams } from '../../application/viewport/setViewportCamera';
import type { SetViewportCanvasParams } from '../../application/viewport/setViewportCanvas';
import type { ResizeViewportParams } from '../../application/viewport/resizeViewport';
import type { UpdateEngineParams } from '../../application/engine/updateEngine';

import type { AddComponentToEntityParams } from '../../application/entity/addComponentToEntity';
import type { RemoveComponentFromEntityParams } from '../../application/entity/removeComponentFromEntity';
import type { SetEntityDisplayNameParams } from '../../application/entity/setEntityDisplayName';
import type { SetEntityGizmoIconParams } from '../../application/entity/setEntityGizmoIcon';
import type { SetEntityDebugEnabledParams } from '../../application/entity/setEntityDebugEnabled';
import type { ComponentBase } from '../../domain/components';
import type { SetEnabledParams } from '../../application/component/setComponentEnabled';
import type { SetComponentFieldParams } from '../../application/component/setComponentField';

declare module './createDuckEngineAPI' {
  export interface DuckEngineAPI {
    /** Adds a scene to the engine. Fails if the scene id already exists. */
    addScene(params: AddSceneParams): Result<SceneState>;
    /** Removes a scene from the engine. Fails if any viewport still references it. */
    removeScene(params: RemoveSceneParams): Result<void>;
    /** Adds a viewport. Requires a valid scene and camera entity with cameraPerspective or cameraOrthographic. */
    addViewport(params: AddViewportParams): Result<ViewportState>;
    /** Removes a viewport from the engine. */
    removeViewport(params: RemoveViewportParams): Result<void>;
    /** Registers a canvas with the engine. Subsystems (e.g. rendering) resolve via engine.canvases.get(canvasId). */
    registerCanvas(params: RegisterCanvasParams): Result<void>;
    /** Removes a canvas from the engine registry. */
    unregisterCanvas(params: UnregisterCanvasParams): Result<void>;
    /** Pauses or resumes the engine (all scenes). */
    setPaused(params: SetEnginePausedParams): Result<void>;
    /** Runs engine setup (subsystems, port derivers). Call once before using scenes. */
    setup(params: SetupEngineParams): Result<void>;
    /** Registers an engine-level subsystem (render, audio, etc.). */
    registerSubsystem(params: RegisterEngineSubsystemParams): Result<void>;
    /** Runs one frame (earlyUpdate, physics, update, lateUpdate, preRender, postRender). */
    update(params: UpdateEngineParams): Result<void>;
    /** Applies a partial update to the engine's game settings. */
    updateSettings(params: UpdateSettingsParams): Result<GameSettings>;
    /** Returns current engine settings. */
    getSettings(): Result<GameSettings>;
    /** Returns a list of all registered scene snapshots. */
    listScenes(): Result<SceneView[]>;
    /** Returns a list of all registered viewport snapshots. */
    listViewports(): Result<ViewportView[]>;
    /** Returns the scene-scoped API for the given scene id. */
    scene(id: string): DuckEngineSceneScope;
    /** Returns the viewport-scoped API for the given viewport id. */
    viewport(id: string): DuckEngineViewportScope;
  }

  export interface DuckEngineSceneScope {
    /** Adds an entity (and its subtree) to the scene. Validates uniqueInScene and hierarchy. */
    addEntity(params: AddEntityParams): Result<EntityView>;
    /** Registers an entity as a prefab. Resources are preloaded on prefab-added. */
    addPrefab(params: AddPrefabParams): Result<void>;
    /** Instantiates a prefab by cloning and adding to the scene. Returns the new entity ID. */
    instantiatePrefab(params: InstantiatePrefabParams): Result<EntityId>;
    /** Removes an entity from the scene. Fails if not found. */
    removeEntity(params: RemoveEntityParams): Result<void>;
    /** Moves an entity to a new parent. Pass null to promote to root. */
    reparentEntity(params: ReparentEntityParams): Result<void>;
    /** Sets the scene's active camera entity. */
    setActiveCamera(params: SetActiveCameraParams): Result<void>;
    /** Enables or disables a scene-wide debug visualization kind (e.g. collider, mesh). */
    toggleDebug(params: ToggleSceneDebugParams): Result<void>;
    /** Runs scene setup (subsystems, change listeners). Call after adding the scene. */
    setupScene(params: SetupSceneParams): Result<void>;
    /** Tears down the scene (subsystems, entities). */
    teardownScene(): Result<void>;
    /** Advances the scene by one frame (subsystem phases). Respects scene pause. */
    updateScene(params: UpdateSceneParams): Result<void>;
    /** Pauses or resumes this scene's update. */
    setPaused(params: SetScenePausedParams): Result<void>;
    /** Subscribes to scene change events. Returns unsubscribe function. */
    subscribe(params: SubscribeToSceneChangesParams): Result<() => void>;
    /** Returns snapshots of all entities in the scene. */
    listEntities(): Result<EntityView[]>;
    /** Adds a UI slot. Emits ui-slot-added. */
    addUISlot(params: AddUISlotParams): Result<void>;
    /** Removes a UI slot. Emits ui-slot-removed. */
    removeUISlot(params: RemoveUISlotParams): Result<void>;
    /** Updates a UI slot. Emits ui-slot-updated. */
    updateUISlot(params: UpdateUISlotParamsWithId): Result<void>;
    /** Returns the entity-scoped API for the given entity id (addComponent, removeComponent, view, setDisplayName, setGizmoIcon, setDebug, listChildren, component). */
    entity(id: string): DuckEngineEntityScope;
  }

  export interface DuckEngineViewportScope {
    /** Enables or disables rendering for this viewport. */
    setEnabled(params: SetViewportEnabledParams): Result<void>;
    /** Sets a debug visualization flag for this viewport (e.g. collider, mesh). */
    setDebug(params: SetViewportDebugEnabledParams): Result<void>;
    /** Changes which scene this viewport renders. */
    setScene(params: SetViewportSceneParams): Result<void>;
    /** Sets the camera entity for this viewport. */
    setCamera(params: SetViewportCameraParams): Result<void>;
    /** Sets the target canvas element id. */
    setCanvas(params: SetViewportCanvasParams): Result<void>;
    /** Updates the viewport normalised rect (x, y, w, h). */
    resize(params: ResizeViewportParams): Result<void>;
  }
}

/** Documented shape of scene.entity(id) API. Not merged (component generic conflict); use for IDE "Go to definition" and TSDoc. */
export interface DuckEngineEntityScopeDoc {
  /** Adds a component to the entity. Validates uniqueness and hierarchy. */
  addComponent(params: AddComponentToEntityParams<ComponentBase>): Result<void>;
  /** Removes a component from the entity by type. */
  removeComponent(params: RemoveComponentFromEntityParams): Result<void>;
  /** Returns a readonly snapshot of the entity. */
  view(): Result<EntityView>;
  /** Sets the entity's display name. */
  setDisplayName(params: SetEntityDisplayNameParams): Result<void>;
  /** Sets the entity's gizmo icon (e.g. for editor). */
  setGizmoIcon(params: SetEntityGizmoIconParams): Result<void>;
  /** Sets a debug visualization flag on the entity (e.g. collider, mesh). */
  setDebug(params: SetEntityDebugEnabledParams): Result<void>;
  /** Returns snapshots of all direct children of the entity. */
  listChildren(): Result<EntityView[]>;
  /** Returns the component-scoped API for the given type (e.g. 'rigidBody', 'boxCollider'). See DuckEngineComponentScopeDoc. */
  component(type: string): Readonly<DuckEngineComponentScopeDoc>;
}

/** Documented shape of entity.component(type) API. Actual return is narrow per component type. */
export interface DuckEngineComponentScopeDoc {
  /** Enables or disables the component. */
  setEnabled(params: SetEnabledParams): Result<void>;
  /** Sets a single field (dot-notation supported, e.g. 'halfExtents.x'). */
  setField(params: SetComponentFieldParams<ComponentBase>): Result<void>;
  /** Returns a frozen readonly snapshot of the component. */
  snapshot(): Result<Readonly<ComponentBase>>;
}
