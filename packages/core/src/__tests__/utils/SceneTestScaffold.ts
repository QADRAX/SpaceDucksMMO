import { BaseScene } from "../../infrastructure/scenes/BaseScene";
import { Entity, ScriptComponent, DefaultEcsComponentFactory } from "../../domain/ecs";
import { ScriptSystem } from "../../domain/scripting/ScriptSystem";
import { CoreLogger } from "../../domain/logging/CoreLogger";
import { TestScripts } from "../generated/TestScriptAssets";

/**
 * A concrete BaseScene implementation for integration testing.
 */
class IntegrationTestScene extends BaseScene {
    readonly id = "IntegrationTestScene";
}


/**
 * Orchestrates a full engine environment for testing Lua scripts.
 */
export class SceneTestScaffold {
    public scene: IntegrationTestScene;
    public scriptSystem: ScriptSystem;
    private logs: string[] = [];

    constructor(scriptOverrides: Record<string, string> = {}) {
        // Mock dependencies
        const mockSettings: any = {
            getSettings: () => ({ graphics: { textureQuality: "low" } }),
            subscribe: () => () => { }
        };

        const mockEngine: any = {
            createPhysicsSystem: () => null,
            getTextureCatalog: () => null,
            createRenderSyncSystem: () => null,
            createGizmoRenderer: () => ({ clear: () => { } }),
            onActiveCameraChanged: () => { }
        };

        this.scene = new IntegrationTestScene(mockSettings);

        // Capture logs
        CoreLogger.subscribe(msg => {
            this.logs.push(`[${msg.severity.toUpperCase()}] [${msg.system}] ${msg.message}`);
        });

        // We override the ScriptSystem creation in setup by manually initializing it
        const factory = new DefaultEcsComponentFactory();
        this.scriptSystem = new ScriptSystem(
            factory,
            false,
            undefined,
            this.scene.collisionEvents,
            undefined,
            undefined,
            undefined, // We'll let ScriptSystem use the global SystemScripts (sandbox modules)
            scriptOverrides
        );

        // Link the scene to the script system
        this.scene.scriptSystem = this.scriptSystem;
    }


    private setupDone = false;
    private async ensureSetup() {
        if (this.setupDone) return;
        this.setupDone = true;

        const mockEngine: any = {
            createPhysicsSystem: () => null,
            getTextureCatalog: () => null,
            createRenderSyncSystem: () => null,
            createGizmoRenderer: () => ({ clear: () => { } }),
            onActiveCameraChanged: () => { }
        };
        this.scene.setup(mockEngine);
    }

    /**
     * Advances the simulation by the given milliseconds.
     */
    public tick(ms: number) {
        this.scene.update(ms);
    }

    /**
     * Helper to wait for async operations (like wasmoon engine setup)
     */
    public async wait(ms: number = 100) {
        await this.ensureSetup();
        await this.scriptSystem.ready;
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Spawns an entity with a ScriptComponent containing the specified script.
     */
    public spawnScriptedEntity(id: string, scriptId: string, properties: Record<string, any> = {}): Entity {
        const entity = new Entity(id);
        const scriptComp = new ScriptComponent();
        const slotId = scriptComp.addSlot(scriptId);
        // Set properties if provided
        if (Object.keys(properties).length > 0) {
            const slot = scriptComp.getSlots()[0];
            slot.properties = properties;
        }
        entity.addComponent(scriptComp as any);
        this.scene.addEntity(entity);

        // Explicitly register in script system to ensure it's processed
        this.scriptSystem.registerEntity(entity);

        return entity;
    }

    /**
     * Returns all captured logs.
     */
    public getLogs(): string[] {
        return this.logs;
    }

    /**
     * Helper to load a Lua file from the pre-built test assets.
     */
    public static loadTestScript(filename: string): string {
        const scriptId = `test://${filename}`;
        const source = TestScripts[scriptId];
        if (!source) {
            throw new Error(`Test script not found in assets: ${scriptId}. Did you run 'npm run build:test-scripts'?`);
        }
        return source;
    }
}

