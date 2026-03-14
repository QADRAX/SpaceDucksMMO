import type * as THREE from 'three';
import type { RenderContextBase } from '@duckengine/rendering-base-v2';
import type { ResourceRef } from '@duckengine/core-v2';
import type { MeshGeometryFileData } from '@duckengine/core-v2';

/**
 * Resolves a mesh resource ref to geometry data. Implemented by infra (GL/WebGPU);
 * may delegate to core resource loader. Sync only for simplicity.
 */
export type MeshResolver = (ref: ResourceRef<'mesh'>) => MeshGeometryFileData | null;

/**
 * Resolves a skybox resource ref to a Three.js cube texture (e.g. for scene.background).
 * Optional; when not provided, SkyboxFeature will not set the scene background.
 */
export type SkyboxResolver = (ref: ResourceRef<'skybox'>) => THREE.CubeTexture | null;

/**
 * Render context extended with Three.js objects. Used by features in common and infra.
 */
export interface RenderContextThree extends RenderContextBase {
  readonly threeScene: THREE.Scene;
  /** Entity id -> Object3D (Mesh, Light, Camera, etc.). */
  readonly registry: RenderObjectRegistry;
  /** Resolve mesh ref to geometry data for customGeometry. */
  readonly getMeshData: MeshResolver;
  /** Optional: resolve skybox ref to CubeTexture for scene background. */
  readonly getSkyboxTexture?: SkyboxResolver;
}

/**
 * Registry of entity id to Three object(s). One entity can have mesh + camera + light;
 * infra may use a Group per entity. get returns the root (Group or single Object3D).
 * keys() returns all entity ids currently in the registry (for sync to detect removed entities).
 */
export interface RenderObjectRegistry {
  get(entityId: string): THREE.Object3D | undefined;
  add(entityId: string, object3D: THREE.Object3D, scene: THREE.Scene): void;
  remove(entityId: string, object3D: THREE.Object3D, scene: THREE.Scene): void;
  keys(): Iterable<string>;
}
