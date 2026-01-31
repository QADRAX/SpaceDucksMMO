import type { Entity } from '@duckengine/ecs';
import { err, ok, type Result } from '@duckengine/ecs';
import type { IRenderingEngine } from '../rendering/IRenderingEngine';
import type { ISceneRenderBridge } from '../rendering/ISceneRenderBridge';
import type { IScene } from './IScene';

type VoidResult = Result<void>;

/**
 * Scaffold BaseScene.
 *
 * This will be replaced by the migrated implementation from the client.
 * The important part of the architecture is that it depends only on:
 * - @duckengine/core interfaces
 * - @duckengine/ecs entities
 * and talks to rendering through ISceneRenderBridge.
 */
export abstract class BaseScene implements IScene {
  abstract readonly id: string;

  protected entities: Map<string, Entity> = new Map();
  protected activeCameraId: string | null = null;

  protected engine?: IRenderingEngine;
  protected renderScene?: unknown;
  protected renderBridge?: ISceneRenderBridge;

  public debugTransformsEnabled = false;

  addEntity(entity: Entity): void {
    if (this.entities.has(entity.id)) return;
    this.entities.set(entity.id, entity);
    this.renderBridge?.addEntity(entity);
  }

  removeEntity(entityId: string): void {
    if (!this.entities.has(entityId)) return;
    this.renderBridge?.removeEntity(entityId);
    this.entities.delete(entityId);
    if (this.activeCameraId === entityId) {
      this.activeCameraId = null;
      this.renderBridge?.setActiveCameraEntityId(null);
      this.engine?.onActiveCameraChanged();
    }
  }

  setActiveCamera(entityId: string): void {
    if (!this.entities.has(entityId)) return;
    this.activeCameraId = entityId;
    this.renderBridge?.setActiveCameraEntityId(entityId);
    this.engine?.onActiveCameraChanged();
  }

  getActiveCamera(): unknown | null {
    if (!this.activeCameraId) return null;
    return this.entities.get(this.activeCameraId) || null;
  }

  setDebugTransformsEnabled(enabled: boolean): void {
    this.debugTransformsEnabled = !!enabled;
    this.renderBridge?.setSceneDebugEnabled(this.debugTransformsEnabled);
  }

  setup(engine: IRenderingEngine, renderScene: unknown): void {
    this.engine = engine;
    this.renderScene = renderScene;
  }

  teardown(_engine: IRenderingEngine, _renderScene: unknown): void {
    this.entities.clear();
    this.activeCameraId = null;
    this.renderBridge = undefined;
  }

  update(dt: number): void {
    this.renderBridge?.update(dt);
  }

  public reparentEntityResult(_childId: string, _newParentId: string | null): VoidResult {
    return err('operation-not-allowed', 'Not implemented in scaffold BaseScene');
  }

  public reparentEntity(_childId: string, _newParentId: string | null): void {
    void ok(undefined);
  }
}
