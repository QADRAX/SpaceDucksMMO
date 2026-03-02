import { BaseScene, Entity, type IRenderingEngine, ScriptComponent, DefaultEcsComponentFactory } from "@duckengine/core";
import type { ISettingsService, PhysicsTimestepConfig } from "@duckengine/core";
import RapierPhysicsSystem from "../../RapierPhysicsSystem";
import { initRapier } from "../../rapier/RapierInit";
import { ScriptSystem } from "@duckengine/core/src/domain/scripting/ScriptSystem";

class RapierIntegrationTestScene extends BaseScene {
  readonly id = "RapierIntegrationTestScene";
}

export type RapierSceneTestScaffoldOptions = {
  timestep?: PhysicsTimestepConfig;
  scriptOverrides?: Record<string, string>;
};

export class RapierSceneTestScaffold {
  public readonly scene: RapierIntegrationTestScene;
  public readonly scriptSystem: ScriptSystem | undefined;
  private readonly engine: IRenderingEngine;
  private setupComplete = false;

  private constructor(options: RapierSceneTestScaffoldOptions = {}) {
    const settingsService: ISettingsService = {
      getSettings: () => ({
        graphics: { textureQuality: "low" },
      } as any),
      subscribe: () => () => {
        // no-op in tests
      },
    };

    this.scene = new RapierIntegrationTestScene(settingsService);

    this.engine = {
      createPhysicsSystem: () => {
        const physics = new RapierPhysicsSystem();
        if (options.timestep) {
          physics.configureTimestep?.(options.timestep);
        }
        return physics;
      },
      createRenderSyncSystem: () => undefined,
      createGizmoRenderer: () => ({ clear: () => undefined }),
      getTextureCatalog: () => undefined,
      onActiveCameraChanged: () => undefined,
    } as unknown as IRenderingEngine;

    // Initialize script system if overrides provided
    if (options.scriptOverrides && Object.keys(options.scriptOverrides).length > 0) {
      const factory = new DefaultEcsComponentFactory();
      this.scriptSystem = new ScriptSystem(
        factory,
        false,
        undefined,
        this.scene.collisionEvents,
        undefined,
        undefined,
        undefined,
        options.scriptOverrides
      );
      this.scene.scriptSystem = this.scriptSystem;
    }

    this.scene.setup(this.engine, {});
  }

  static async create(options: RapierSceneTestScaffoldOptions = {}): Promise<RapierSceneTestScaffold> {
    await initRapier();
    return new RapierSceneTestScaffold(options);
  }

  async ensureScriptSetup(): Promise<void> {
    if (!this.setupComplete && this.scriptSystem) {
      this.setupComplete = true;
      this.scriptSystem.setup(new Map(this.scene.getEntities().map(e => [e.id, e])), this.scene);
      await this.scriptSystem.ready;
    }
  }

  addEntity(entity: Entity): Entity {
    this.scene.addEntity(entity);
    return entity;
  }

  removeEntity(entityId: string): void {
    this.scene.removeEntity(entityId);
  }

  spawnScriptedEntity(id: string, scriptId: string, properties: Record<string, any> = {}): Entity {
    const entity = new Entity(id);
    const scriptComp = new ScriptComponent();
    scriptComp.addSlot(scriptId);
    if (Object.keys(properties).length > 0) {
      const slot = scriptComp.getSlots()[0];
      if (slot) slot.properties = properties;
    }
    entity.addComponent(scriptComp as any);
    this.scene.addEntity(entity);
    if (this.scriptSystem) {
      this.scriptSystem.registerEntity(entity);
    }
    return entity;
  }

  tick(dtMs: number): void {
    this.scene.update(dtMs);
  }

  runFrames(frameCount: number, dtMs = 17): void {
    for (let i = 0; i < frameCount; i += 1) {
      this.tick(dtMs);
    }
  }

  dispose(): void {
    this.scene.teardown(this.engine, {});
  }
}

export default RapierSceneTestScaffold;