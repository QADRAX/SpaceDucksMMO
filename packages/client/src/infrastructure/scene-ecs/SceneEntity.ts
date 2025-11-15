import * as THREE from 'three';
import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import { Entity } from './Entity';
import { TransformComponent } from './TransformComponent';
import type TextureResolverService from '@client/application/TextureResolverService';

export interface SceneEntityConfig {
  radius?: number;
  segments?: number;
  color?: number;
  textureId?: string; // CelestialBodyId
  emissive?: number;
}

/**
 * SceneEntity is a self-contained scene object that owns an Entity + TransformComponent
 * and creates its own Three.js Mesh during addTo(). It does not use legacy VisualBody.
 */
export class SceneEntity implements ISceneObject {
  readonly id: string;
  readonly entity: Entity;
  readonly transform: TransformComponent;
  private mesh?: THREE.Mesh;
  private textureLoader = new THREE.TextureLoader();
  private material?: THREE.MeshStandardMaterial;

  constructor(id: string, private config: SceneEntityConfig = {}, private textureResolver?: TextureResolverService) {
    this.id = id;
    this.entity = new Entity(id);
    this.transform = new TransformComponent({ position: [0, 0, 0] });
    this.entity.addComponent(this.transform);
  }

  addTo(scene: THREE.Scene): void {
    const radius = this.config.radius ?? 1.0;
    const segments = this.config.segments ?? 32;
    const color = this.config.color ?? 0xffffff;

    const geometry = new THREE.SphereGeometry(radius, segments, segments);
    // Base material: MeshStandard so it responds to lights. Set sensible defaults
    this.material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.7,
      metalness: 0.1,
    });
    if (this.config.emissive !== undefined) {
      this.material.emissive = new THREE.Color(this.config.emissive);
      this.material.emissiveIntensity = 0.6;
    }

    this.mesh = new THREE.Mesh(geometry, this.material);
    // Apply initial transform
    this.syncTransformToMesh();
    scene.add(this.mesh);

    // If there's a textureId and resolver, try to load texture async
    if (this.config.textureId && this.textureResolver && this.material) {
      try {
        const resource = this.textureResolver.resolve({ bodyId: this.config.textureId as any, type: 'diffuse' as any });
        console.log(`[SceneEntity:${this.id}] Loading texture from: ${resource.path}`);

        this.textureLoader.load(resource.path, (tex) => {
          if (!this.material) return;
          this.material.map = tex;
          this.material.needsUpdate = true;
          console.log(`[SceneEntity:${this.id}] Texture loaded: ${resource.path}`);
        }, undefined, (err) => {
          console.warn(`[SceneEntity:${this.id}] Failed to load texture: ${resource.path}`, err);
          // keep fallback color material so object remains visible
          if (this.material) {
            this.material.color = new THREE.Color(0x888888);
            this.material.needsUpdate = true;
          }
        });
      } catch (e) {
        console.warn(`[SceneEntity:${this.id}] TextureResolver.resolve failed for ${this.config.textureId}`, e);
        if (this.material) {
          this.material.color = new THREE.Color(0x888888);
        }
      }
    }
  }

  removeFrom(scene: THREE.Scene): void {
    if (this.mesh) {
      scene.remove(this.mesh);
      // dispose geometry/material
      if (this.mesh.geometry) this.mesh.geometry.dispose();
      if (this.material) {
        if (this.material.map) this.material.map.dispose();
        this.material.dispose();
      }
      this.mesh = undefined;
      this.material = undefined;
    }
  }

  update(dt: number): void {
    // First update components stored in entity (so components can modify the transform)
    this.entity.update(dt);
    // Then sync entity components to mesh transform
    this.syncTransformToMesh();
  }

  dispose(): void {
    // cleanup handled in removeFrom
  }

  private syncTransformToMesh(): void {
    if (!this.mesh) return;
    this.mesh.position.copy(this.transform.position);
    this.mesh.rotation.copy(this.transform.rotation);
    this.mesh.scale.copy(this.transform.scale);
  }
}

export default SceneEntity;
