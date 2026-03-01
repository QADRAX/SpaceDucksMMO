import type { Entity, ScriptComponent, ScriptSlot, IEcsComponentFactory } from "../ecs";
import type { CollisionEventsHub } from "../physics/CollisionEventsHub";
import type SceneChangeEvent from "../scene/SceneChangeEvent";
import { CoreLogger } from "../logging/CoreLogger";
import { SceneEventBus } from "./SceneEventBus";
import { ScriptRuntime } from "./ScriptRuntime";
import { ScriptInstanceManager } from "./ScriptInstanceManager";
import {
    registerInputBridge,
    registerMathBridge,
    registerPhysicsBridge,
    registerSceneBridge,
    registerEditorBridge,
    registerTimeBridge,
    registerTransformBridge,
    registerGizmoBridge,
    type BridgeContext
} from "./bridge";
import { BuiltInScripts } from "./generated/ScriptAssets";
import type { AssetResolver } from "./bridge/AssetResolver";
import type { IPrefabRegistry } from "../ports/IPrefabRegistry";
import type { IGizmoRenderer } from "../ports/IGizmoRenderer";

export class ScriptSystem {
    public readonly eventBus = new SceneEventBus();

    // The collection of entities that currently have a ScriptComponent
    private entities = new Map<string, Entity>();
    // To cleanup collision subscriptions when entities are removed
    private collisionUnsubs = new Map<string, () => void>();
    private collisionUnsubMap = new Map<string, () => void>();

    // Lua Runtime and Instance Management
    private runtime = new ScriptRuntime(this.eventBus);
    private instanceManager?: ScriptInstanceManager;

    // Reference to all entities in the scene
    private allEntities: Map<string, Entity> | null = null;
    private timeBridgeSync?: { setDelta: (dt: number) => void; getScale: () => number };

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

    public registerEntity(entity: Entity): void {
        const sc = entity.getComponent<ScriptComponent>("script");
        if (!sc) return;
        this.entities.set(entity.id, entity);
    }

    public unregisterEntity(entityId: string): void {
        const entity = this.entities.get(entityId);
        if (!entity) return;

        const sc = entity.getComponent<ScriptComponent>("script");
        if (sc && this.instanceManager) {
            for (const slot of sc.getSlots()) {
                this.eventBus.unsubscribeAll(slot.slotId);

                const instance = this.instanceManager.getInstance(slot.slotId);

                if (instance?.onDestroy) {
                    this.runtime.callHook(slot.slotId, "onDestroy");
                }

                this.instanceManager.removeSlot(slot.slotId);

                const cUnsub = this.collisionUnsubMap.get(slot.slotId);
                if (cUnsub) {
                    cUnsub();
                    this.collisionUnsubMap.delete(slot.slotId);
                }
            }
        }

        this.entities.delete(entityId);
        const unsub = this.collisionUnsubs.get(entityId);
        if (unsub) {
            unsub();
            this.collisionUnsubs.delete(entityId);
        }
    }


    private subscribeCollisionsIfNeeded(entity: Entity, scriptComponent: ScriptComponent, slot: ScriptSlot) {
        if (!this.collisionEvents) return;

        const hasPhysicsBody = entity.hasComponent("rigidBody") ||
            entity.hasComponent("sphereCollider") ||
            entity.hasComponent("boxCollider") ||
            entity.hasComponent("capsuleCollider") ||
            entity.hasComponent("cylinderCollider") ||
            entity.hasComponent("coneCollider") ||
            entity.hasComponent("terrainCollider");

        if (!hasPhysicsBody) return;

        // Check if the script *actually* implements either collision hook
        const instance = this.instanceManager?.getInstance(slot.slotId);
        if (!instance) return;

        if (!instance.onCollisionEnter && !instance.onCollisionExit) return;

        const unsub = this.collisionEvents.onEntity(entity.id, (ev) => {
            // Only fire if the slot is still enabled
            if (!slot.enabled) return;

            if (ev.kind === 'enter' && instance.onCollisionEnter) {
                if (!this.runtime.callHook(slot.slotId, "onCollisionEnter", ev.other)) {
                    slot.enabled = false;
                }
            } else if (ev.kind === 'exit' && instance.onCollisionExit) {
                if (!this.runtime.callHook(slot.slotId, "onCollisionExit", ev.other)) {
                    slot.enabled = false;
                }
            }
        });


        this.collisionUnsubMap.set(slot.slotId, unsub);
    }





    private compileScriptsForEntity(entity: Entity, scriptComponent: ScriptComponent) {
        if (!this.instanceManager) return;

        for (const slot of scriptComponent.getSlots()) {
            if (this.instanceManager.getInstance(slot.slotId)) continue;

            const instance = this.instanceManager.compileSlot(entity, slot);
            if (!instance) continue;

            if (instance.init) {
                if (!this.runtime.callHook(slot.slotId, "init")) {
                    slot.enabled = false;
                }
            }
            if (slot.enabled && instance.onEnable) {
                if (!this.runtime.callHook(slot.slotId, "onEnable")) {
                    slot.enabled = false;
                }
            }

            this.subscribeCollisionsIfNeeded(entity, scriptComponent, slot);
        }
    }

    public earlyUpdate(dt: number): void {
        if (!this.instanceManager) return;
        this.timeBridgeSync?.setDelta(dt);

        for (const entity of this.entities.values()) {
            const sc = entity.getComponent<ScriptComponent>("script");
            if (!sc || !sc.enabled) continue;
            for (const slot of sc.getSlots()) {
                if (!slot.enabled) continue;
                this.instanceManager.syncProperties(slot);

                const instance = this.instanceManager.getInstance(slot.slotId);
                if (instance?.earlyUpdate) {
                    if (!this.runtime.callHook(slot.slotId, "earlyUpdate", dt)) {
                        slot.enabled = false;
                    }
                }
            }
        }
    }

    public update(dt: number): void {
        if (!this.instanceManager) return;
        this.timeBridgeSync?.setDelta(dt);

        for (const entity of this.entities.values()) {
            const sc = entity.getComponent<ScriptComponent>("script");
            if (!sc || !sc.enabled) continue;
            for (const slot of sc.getSlots()) {
                if (!slot.enabled) continue;
                const instance = this.instanceManager.getInstance(slot.slotId);
                if (instance?.update) {
                    if (!this.runtime.callHook(slot.slotId, "update", dt)) {
                        slot.enabled = false;
                    }
                }
            }
        }
        this.eventBus.flush();
    }

    public lateUpdate(dt: number): void {
        if (!this.instanceManager) return;
        this.timeBridgeSync?.setDelta(dt);
        for (const entity of this.entities.values()) {
            const sc = entity.getComponent<ScriptComponent>("script");
            if (!sc || !sc.enabled) continue;
            for (const slot of sc.getSlots()) {
                if (!slot.enabled) continue;
                const instance = this.instanceManager.getInstance(slot.slotId);
                if (instance?.lateUpdate) {
                    if (!this.runtime.callHook(slot.slotId, "lateUpdate", dt)) {
                        slot.enabled = false;
                    }
                }
            }
        }
    }

    public drawGizmos(dt: number): void {
        if (!this.instanceManager) return;
        this.gizmoRenderer?.clear();
        this.timeBridgeSync?.setDelta(dt);

        for (const entity of this.entities.values()) {
            const sc = entity.getComponent<ScriptComponent>("script");
            if (!sc || !sc.enabled) continue;
            for (const slot of sc.getSlots()) {
                if (!slot.enabled) continue;
                const instance = this.instanceManager.getInstance(slot.slotId);
                if (instance?.onDrawGizmos) {
                    if (!this.runtime.callHook(slot.slotId, "onDrawGizmos", dt)) {
                        slot.enabled = false;
                    }
                }
            }
        }
    }

    private sceneUnsub?: () => void;


    public async setupAsync(allEntities: Map<string, Entity>, scene: { subscribeChanges: (listener: (ev: SceneChangeEvent) => void) => () => void; removeEntity?: (id: string) => void }): Promise<void> {
        CoreLogger.info("ScriptSystem", `Starting setupAsync with ${allEntities.size} entities...`);

        await this.runtime.setup(this.systemScriptOverrides);
        this.instanceManager = new ScriptInstanceManager(this.runtime, this.scriptOverrides, this.systemScriptOverrides);

        this.allEntities = allEntities;

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

        // Standard Bridge Registration
        registerTransformBridge(this.runtime.lua, bridgeCtx);
        registerSceneBridge(this.runtime.lua, bridgeCtx);
        if (this.isEditorContext) {
            registerEditorBridge(this.runtime.lua, bridgeCtx);
        }
        registerMathBridge(this.runtime.lua);
        registerInputBridge(this.runtime.lua);
        registerPhysicsBridge(this.runtime.lua);
        registerGizmoBridge(this.runtime.lua, bridgeCtx);
        this.timeBridgeSync = registerTimeBridge(this.runtime.lua);

        // Initial Registration
        for (const entity of allEntities.values()) {
            if (entity.hasComponent("script")) {
                this.registerEntity(entity);
            }
        }

        for (const entity of this.entities.values()) {
            const sc = entity.getComponent<ScriptComponent>("script");
            if (sc) this.compileScriptsForEntity(entity, sc);
        }

        this.sceneUnsub = scene.subscribeChanges(ev => {
            if (ev.kind === "entity-added") {
                this.registerEntity(ev.entity);
            } else if (ev.kind === "entity-removed") {
                this.unregisterEntity(ev.entityId);
            } else if (ev.kind === "component-changed" && ev.componentType === "script") {
                const ent = allEntities.get(ev.entityId);
                if (ent) {
                    const hasScript = ent.hasComponent("script");
                    const registered = this.entities.has(ent.id);
                    if (hasScript && !registered) {
                        this.registerEntity(ent);
                        const sc = ent.getComponent<ScriptComponent>("script");
                        if (sc) this.compileScriptsForEntity(ent, sc);
                    }
                    else if (!hasScript && registered) this.unregisterEntity(ent.id);
                }
            }
        });

        this.eventBus.fire("SceneReady");
        this._resolveReady();
    }

    public setup(allEntities: Map<string, Entity>, scene: { subscribeChanges: (listener: (ev: SceneChangeEvent) => void) => () => void; removeEntity?: (id: string) => void }): void {
        this.setupAsync(allEntities, scene).catch(err => {
            CoreLogger.error("ScriptSystem", "failed to initialize scripting async", err);
            this._resolveReady();
        });
    }

    public teardown(): void {
        this.sceneUnsub?.();
        this.sceneUnsub = undefined;

        for (const entityId of Array.from(this.entities.keys())) {
            this.unregisterEntity(entityId);
        }
        this.runtime.teardown();
        this.eventBus.dispose();
    }
}
