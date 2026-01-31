import * as THREE from 'three';
import type { Entity } from '@duckengine/ecs';
import type { ISceneRenderBridge } from '@duckengine/core';

/**
 * Scaffold bridge.
 *
 * In the migration, this will adapt RenderSyncSystem (three) to the
 * @duckengine/core ISceneRenderBridge interface.
 */
export class ThreeSceneRenderBridge implements ISceneRenderBridge {
  constructor(_scene: THREE.Scene) {
    void THREE;
  }

  addEntity(_entity: Entity): void {
    throw new Error('Not implemented');
  }
  removeEntity(_entityId: string): void {
    throw new Error('Not implemented');
  }
  update(_dt: number): void {
    // no-op in scaffold
  }
  getCamera(_entityId: string): unknown | undefined {
    return undefined;
  }
  setSceneDebugEnabled(_enabled: boolean): void {
    // no-op in scaffold
  }
  setActiveCameraEntityId(_id: string | null): void {
    // no-op in scaffold
  }
}
