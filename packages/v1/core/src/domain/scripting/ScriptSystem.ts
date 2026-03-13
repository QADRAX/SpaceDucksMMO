import type { Entity, ScriptComponent, ScriptSlot, IEcsComponentFactory } from "../ecs";
import type { CollisionEventsHub } from "../physics/CollisionEventsHub";
import type SceneChangeEvent from "../scene/SceneChangeEvent";
import { CoreLogger } from "../logging/CoreLogger";
import { SceneEventBus } from "./SceneEventBus";
import { ScriptRuntime } from "./ScriptRuntime";
import { ScriptInstanceManager } from "./ScriptInstanceManager";
import { ScriptEntityRegistry } from "./ScriptEntityRegistry";
import { ScriptCollisionManager } from "./ScriptCollisionManager";
import { ScriptLifecycleOrchestrator } from "./ScriptLifecycleOrchestrator";
import { ScriptBridgeRegistry } from "./ScriptBridgeRegistry";
import type { BridgeContext } from "./bridge";
import type { AssetResolver } from "./bridge/AssetResolver";
import type { IPrefabRegistry } from "../ports/IPrefabRegistry";
import type { IGizmoRenderer } from "../ports/IGizmoRenderer";

/**
 * Main orchestrator for the Lua scripting system.
 * 
 * @remarks
 * This class coordinates:
 * - ScriptEntityRegistry: Entity registration and compilation
 * - ScriptCollisionManager: Collision event subscriptions
 * - ScriptLifecycleOrchestrator: Hook execution (earlyUpdate, update, lateUpdate)
 * - ScriptBridgeRegistry: Lua API bridge registration
 * 
 * Refactored to follow Single Responsibility Principle.
 */
export class ScriptSystem {
    public readonly eventBus = new SceneEventBus();

    // Lua Runtime and Instance Management
    private runtime = new ScriptRuntime(this.eventBus);
    private instanceManager?: ScriptInstanceManager;

    // Subsystems (created after setup)
    private entityRegistry?: ScriptEntityRegistry;
    private collisionManager?: ScriptCollisionManager;
    private lifecycleOrchestrator?: ScriptLifecycleOrchestrator;
    private bridgeRegistry?: ScriptBridgeRegistry;

    // Reference to all entities in the scene
    private allEntities: Map<string, Entity> | null = null;

    // Scene change subscription cleanup
    private sceneUnsub?: () => void;

    // Ready promise (resolves after setup completes)
    private _resolveReady!: () => void;
    public readonly ready: Promise<void> = new Promise(resolve => {
        this._resolveReady = resolve;
    });

    constructor(
        private componentFactory: IEcsComponentFactory,
        private isEditorContext: boolean = false,
        private assetResolver?: AssetResolver,
        private collisionEvents?: CollisionEventsHub,
        private prefabRegistry?: IPrefabRegistry,
        private gizmoRenderer?: IGizmoRenderer,
        private systemScriptOverrides: Record<string, string> = {},
        private scriptOverrides: Record<string, string> = {}
    ) { }

    /**
     * Registers an entity that has a ScriptComponent.
     * If setupAsync has completed, also compiles the entity immediately.
     */
    public registerEntity(entity: Entity): void {
        if (!this.entityRegistry) return;
        
        // Always register
        this.entityRegistry.registerEntity(entity);
        
        // If we've completed setupAsync, compile immediately
        if (this.lifecycleOrchestrator && this.collisionManager) {
            const sc = entity.getComponent<ScriptComponent>("script");
            if (sc) {
                const compiledSlotIds = this.entityRegistry.compileEntity(entity, sc);
                
                // Subscribe to collision events
                for (const slotId of compiledSlotIds) {
                    const slot = sc.getSlots().find(s => s.slotId === slotId);
                    if (slot) {
                        this.collisionManager.subscribeIfNeeded(entity, sc, slot);
                    }
                }
            }
        }
    }

    /**
     * Unregisters an entity and cleans up all its resources.
     * Calls onDestroy hooks and removes collision subscriptions.
     */
    public unregisterEntity(entityId: string): void {
        if (!this.entityRegistry || !this.collisionManager) return;

        const removedSlotIds = this.entityRegistry.unregisterEntity(entityId);
        this.collisionManager.unsubscribeMany(removedSlotIds);
        this.eventBus.unsubscribeAll(entityId);
    }

    /**
     * Executes the earlyUpdate lifecycle phase.
     * Delegates to ScriptLifecycleOrchestrator.
     */
    public earlyUpdate(dt: number): void {
        if (!this.lifecycleOrchestrator || !this.entityRegistry) return;
        this.lifecycleOrchestrator.earlyUpdate(this.entityRegistry.getAllEntities(), dt);
    }

    /**
     * Executes the update lifecycle phase.
     * Delegates to ScriptLifecycleOrchestrator.
     */
    public update(dt: number): void {
        if (!this.lifecycleOrchestrator || !this.entityRegistry) return;
        this.lifecycleOrchestrator.update(this.entityRegistry.getAllEntities(), dt);
    }

    /**
     * Executes the lateUpdate lifecycle phase.
     * Delegates to ScriptLifecycleOrchestrator.
     */
    public lateUpdate(dt: number): void {
        if (!this.lifecycleOrchestrator || !this.entityRegistry) return;
        this.lifecycleOrchestrator.lateUpdate(this.entityRegistry.getAllEntities(), dt);
    }

    /**
     * Executes the drawGizmos lifecycle phase.
     * Delegates to ScriptLifecycleOrchestrator.
     */
    public drawGizmos(dt: number): void {
        if (!this.lifecycleOrchestrator || !this.entityRegistry) return;
        this.lifecycleOrchestrator.drawGizmos(this.entityRegistry.getAllEntities(), dt);
    }

    /**
     * Asynchronously initializes the scripting system.
     * 
     * @remarks
     * This method:
     * 1. Sets up the Lua runtime
     * 2. Creates the instance manager
     * 3. Instantiates all subsystems (registry, collision, lifecycle, bridges)
     * 4. Registers all Lua bridge APIs
     * 5. Registers and compiles all entities with script components
     * 6. Subscribes to scene change events
     */
    public async setupAsync(
        allEntities: Map<string, Entity>,
        scene: {
            subscribeChanges: (listener: (ev: SceneChangeEvent) => void) => () => void;
            removeEntity?: (id: string) => void;
        }
    ): Promise<void> {
        CoreLogger.info("ScriptSystem", `Starting setupAsync with ${allEntities.size} entities...`);

        // Initialize Lua runtime
        await this.runtime.setup(this.systemScriptOverrides);
        this.instanceManager = new ScriptInstanceManager(
            this.runtime,
            this.scriptOverrides,
            this.systemScriptOverrides
        );

        // Store reference to all entities
        this.allEntities = allEntities;

        // Instantiate subsystems
        this.entityRegistry = new ScriptEntityRegistry(this.instanceManager, this.runtime);
        this.collisionManager = new ScriptCollisionManager(
            this.collisionEvents,
            this.instanceManager,
            this.runtime
        );
        this.bridgeRegistry = new ScriptBridgeRegistry();

        // Register all Lua bridges
        const bridgeCtx: BridgeContext = {
            getEntity: (id: string) => allEntities.get(id),
            getAllEntities: () => Array.from(allEntities.values()),
            getEventBus: () => this.eventBus,
            componentFactory: this.componentFactory,
            assetResolver: this.assetResolver,
            gizmoRenderer: this.gizmoRenderer,
            prefabRegistry: this.prefabRegistry,

            getScriptSlots: (entityId: string) => {
                const ent = allEntities.get(entityId);
                if (!ent) return [];
                const sc = ent.getComponent<ScriptComponent>("script");
                if (!sc) return [];
                return sc.getSlots().map((s: ScriptSlot) => ({ scriptId: s.scriptId, slotId: s.slotId }));
            },
            getSlotProperty: (entityId: string, scriptId: string, key: string): unknown => {
                const ent = allEntities.get(entityId);
                if (!ent) return null;
                const sc = ent.getComponent<ScriptComponent>("script");
                if (!sc) return null;
                const slot = sc.getSlots().find((s: ScriptSlot) => s.scriptId === scriptId);
                if (!slot) return null;
                return slot.properties[key] ?? null;
            },
            setSlotProperty: (entityId: string, scriptId: string, key: string, value: unknown) => {
                const ent = allEntities.get(entityId);
                if (!ent) return;
                const sc = ent.getComponent<ScriptComponent>("script");
                if (!sc) return;
                const slot = sc.getSlots().find((s: ScriptSlot) => s.scriptId === scriptId);
                if (!slot) return;
                slot.properties[key] = value;
            },
            removeEntity: scene.removeEntity ? (id: string) => scene.removeEntity!(id) : undefined,
        };

        this.bridgeRegistry.registerAll(this.runtime.lua, bridgeCtx, this.isEditorContext);

        // Create lifecycle orchestrator (needs timeBridgeSync from bridgeRegistry)
        this.lifecycleOrchestrator = new ScriptLifecycleOrchestrator(
            this.instanceManager,
            this.runtime,
            this.eventBus,
            this.gizmoRenderer,
            this.bridgeRegistry.getTimeBridgeSync()
        );

        // Register all entities with script components
        for (const entity of allEntities.values()) {
            if (entity.hasComponent("script")) {
                this.entityRegistry.registerEntity(entity);
            }
        }

        // Compile all registered entities
        for (const entity of this.entityRegistry.getAllEntities()) {
            const sc = entity.getComponent<ScriptComponent>("script");
            if (sc) {
                const compiledSlotIds = this.entityRegistry.compileEntity(entity, sc);
                
                // Subscribe to collision events for each compiled slot
                for (const slotId of compiledSlotIds) {
                    const slot = sc.getSlots().find(s => s.slotId === slotId);
                    if (slot) {
                        this.collisionManager.subscribeIfNeeded(entity, sc, slot);
                    }
                }
            }
        }

        // Subscribe to scene changes
        this.sceneUnsub = scene.subscribeChanges(ev => {
            if (!this.entityRegistry || !this.collisionManager) return;

            if (ev.kind === "entity-added") {
                // registerEntity now handles compilation if setupAsync has completed
                this.registerEntity(ev.entity);
            } else if (ev.kind === "entity-removed") {
                this.unregisterEntity(ev.entityId);
            } else if (ev.kind === "component-changed" && ev.componentType === "script") {
                const ent = allEntities.get(ev.entityId);
                if (ent) {
                    const hasScript = ent.hasComponent("script");
                    const registered = this.entityRegistry.hasEntity(ent.id);

                    if (hasScript && !registered) {
                        this.entityRegistry.registerEntity(ent);
                        const sc = ent.getComponent<ScriptComponent>("script");
                        if (sc) {
                            const compiledSlotIds = this.entityRegistry.compileEntity(ent, sc);
                            for (const slotId of compiledSlotIds) {
                                const slot = sc.getSlots().find(s => s.slotId === slotId);
                                if (slot) {
                                    this.collisionManager.subscribeIfNeeded(ent, sc, slot);
                                }
                            }
                        }
                    } else if (!hasScript && registered) {
                        this.unregisterEntity(ent.id);
                    }
                }
            }
        });

        this.eventBus.fire("SceneReady");
        this._resolveReady();

        CoreLogger.info("ScriptSystem", "Setup complete");
    }

    public setup(allEntities: Map<string, Entity>, scene: { subscribeChanges: (listener: (ev: SceneChangeEvent) => void) => () => void; removeEntity?: (id: string) => void }): void {
        this.setupAsync(allEntities, scene).catch(err => {
            CoreLogger.error("ScriptSystem", "failed to initialize scripting async", err);
            this._resolveReady();
        });
    }

    /**
     * Tears down the scripting system and cleans up all resources.
     */
    public teardown(): void {
        this.sceneUnsub?.();
        this.sceneUnsub = undefined;

        if (this.entityRegistry) {
            for (const entity of this.entityRegistry.getAllEntities()) {
                this.unregisterEntity(entity.id);
            }
        }

        this.runtime.teardown();
        this.eventBus.dispose();
    }
}
