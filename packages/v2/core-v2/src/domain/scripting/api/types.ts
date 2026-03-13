import type { ComponentBase } from '../../components';
import type { ScriptReference } from '../../components/types/gameplay/scripting';
import type { SceneState } from '../../scene';
import type { EntityId } from '../../ids';

/** Simple 3D vector API shape exposed to scripts. */
export interface Vec3API {
  x: number;
  y: number;
  z: number;
}

/** Transform API exposed through Entity API. */
export interface TransformAPI {
  position: Vec3API;
  rotation: Vec3API;
  scale: Vec3API;
  localPosition: Vec3API;
  localRotation: Vec3API;
  localScale: Vec3API;
  readonly parent: EntityAPI | null;
  readonly children: EntityAPI[];
  lookAt(target: Vec3API): void;
  setParent(parent: EntityAPI | null): void;
}

/** Component map exposed to scripts, filtered by permissions. */
export type ComponentsAPI = Record<string, ComponentBase | undefined>;

/** Script slot API exposed to scripts for sibling script interaction. */
export interface ScriptAPI {
  readonly scriptId: string;
  enabled: boolean;
  properties: Record<string, unknown>;
}

/** Script map exposed to scripts, filtered by permissions. */
export type ScriptsAPI = Record<string, ScriptAPI | undefined>;

/** Entity API exposed to scripts. */
export interface EntityAPI {
  readonly id: EntityId;
  name: string;
  readonly transform: TransformAPI;
  readonly components: ComponentsAPI;
  readonly scripts: ScriptsAPI;
  isValid(): boolean;
  destroy(): void;
}

/** Optional callbacks used while building entity APIs. */
export interface ScriptAPIBuildContext {
  destroyEntity?(entityId: EntityId): boolean;
}

/** Internal script reference lookup result. */
export interface ScriptRefResolutionResult {
  readonly script: ScriptReference;
  readonly index: number;
}

/** 2D vector API shape exposed to scripts. */
export interface Vec2API {
  x: number;
  y: number;
}

/** Raycast query payload for scene physics queries. */
export interface SceneRaycastQuery {
  readonly origin: Vec3API;
  readonly direction: Vec3API;
  readonly maxDistance: number;
}

/** Raycast hit payload exposed to scripts. */
export interface SceneRaycastHit {
  readonly hit: boolean;
  readonly entity: EntityAPI | null;
  readonly point: Vec3API;
  readonly distance: number;
}

/** Minimal scene-level API exposed to scripts. */
export interface SceneAPI {
  instantiate(prefabId: string, position?: Vec3API, rotation?: Vec3API): EntityAPI | null;
  findByTag(tag: string): EntityAPI[];
  raycast(query: SceneRaycastQuery): SceneRaycastHit | null;
  emit(eventName: string, payload?: unknown): void;
}

/** Input API exposed to scripts. */
export interface InputAPI {
  isKeyPressed(key: string): boolean;
  isKeyJustPressed(key: string): boolean;
  isKeyReleased(key: string): boolean;
  getMousePosition(): Vec2API;
  getMouseDelta(): Vec2API;
  isMouseButtonPressed(button: number): boolean;
}

/** Time API exposed to scripts. */
export interface TimeAPI {
  readonly delta: number;
  readonly deltaSeconds: number;
  readonly elapsed: number;
  readonly frameCount: number;
  readonly scale: number;
}

/** Scene API extension points for host/runtime integration. */
export interface SceneAPIBuildContext {
  readonly instantiatePrefab?: (
    scene: SceneState,
    prefabId: string,
    position?: Vec3API,
    rotation?: Vec3API,
  ) => EntityId | null;
  readonly findEntityIdsByTag?: (scene: SceneState, tag: string) => EntityId[];
  readonly raycast?: (query: SceneRaycastQuery) => {
    entityId: EntityId;
    point: Vec3API;
    distance: number;
  } | null;
  readonly emitEvent?: (eventName: string, payload?: unknown) => void;
}

/** Input API extension points for host/runtime integration. */
export interface InputAPIBuildContext {
  readonly isKeyPressed?: (key: string) => boolean;
  readonly isKeyJustPressed?: (key: string) => boolean;
  readonly isKeyReleased?: (key: string) => boolean;
  readonly getMousePosition?: () => Vec2API;
  readonly getMouseDelta?: () => Vec2API;
  readonly isMouseButtonPressed?: (button: number) => boolean;
}

/** Time API extension points for host/runtime integration. */
export interface TimeAPIBuildContext {
  readonly delta?: number;
  readonly elapsed?: number;
  readonly frameCount?: number;
  readonly scale?: number;
}
