import type { Entity, ScriptComponent, ScriptSlot } from "@duckengine/ecs";
import type { CollisionEventsHub } from "../physics/CollisionEventsHub";
import type SceneChangeEvent from "../scene/SceneChangeEvent";
import { SceneEventBus } from "./SceneEventBus";
import { LuaSandbox, type LuaScriptInstance } from "./LuaSandbox";
import { LuaSelfFactory, type LuaSelfInstance } from "./LuaSelfFactory";
import type { LuaEngine } from "wasmoon";
import {
    registerInputBridge,
    registerPhysicsBridge,
    registerSceneBridge,
    registerTimeBridge,
    registerTransformBridge
} from "./bridge";
import { BuiltInScripts } from "./BuiltInScripts";

export class ScriptSystem {
    public readonly eventBus = new SceneEventBus();

    // The collection of entities that currently have a ScriptComponent
    private entities = new Map<string, Entity>();
    // To cleanup collision subscriptions when entities are removed
    private collisionUnsubs = new Map<string, () => void>();
    private collisionUnsubMap = new Map<string, () => void>();

    // Lua Sandbox
    private sandbox = new LuaSandbox();
    private luaEngine: LuaEngine | null = null;

    // Per-slot compiled scripts and state context
    private scriptInstances = new Map<string, LuaScriptInstance>();
    private scriptContexts = new Map<string, LuaSelfInstance>();
    private lastProperties = new Map<string, string>(); // JSON stringified properties for change detection

    private timeBridgeSync?: { setDelta: (dt: number) => void };

    constructor(private collisionEvents?: CollisionEventsHub) { }

    public registerEntity(entity: Entity): void {
        const sc = entity.getComponent<ScriptComponent>("script");
        if (!sc) return;
        this.entities.set(entity.id, entity);
    }

    public unregisterEntity(entityId: string): void {
        const entity = this.entities.get(entityId);
        if (!entity) return;

        const sc = entity.getComponent<ScriptComponent>("script");
        if (sc) {
            for (const slot of sc.getSlots()) {
                this.eventBus.unsubscribeAll(slot.slotId);

                const instance = this.scriptInstances.get(slot.slotId);
                const ctx = this.scriptContexts.get(slot.slotId);
                if (this.luaEngine && instance && ctx && instance.onDestroy) {
                    this.sandbox.pcall(this.luaEngine, instance.onDestroy, ctx);
                }

                this.scriptInstances.delete(slot.slotId);
                this.scriptContexts.delete(slot.slotId);
                this.lastProperties.delete(slot.slotId);

                // clear slot specific collision handlers
                const cUnsub = this.collisionUnsubMap.get(slot.slotId);
                if (cUnsub) {
                    cUnsub();
                    this.collisionUnsubMap.delete(slot.slotId);
                }
            }
        }

        this.entities.delete(entityId);

        // Cleanup physics subscription
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
        const instance = this.scriptInstances.get(slot.slotId);
        if (!instance) return;

        if (!instance.onCollisionEnter && !instance.onCollisionExit) return;

        const unsub = this.collisionEvents.onEntity(entity.id, (ev) => {
            if (!this.luaEngine) return;
            // Only fire if the slot is still enabled
            if (!slot.enabled) return;

            const ctx = this.scriptContexts.get(slot.slotId);
            if (!ctx) return;

            if (ev.kind === 'enter' && instance.onCollisionEnter) {
                if (!this.sandbox.pcall(this.luaEngine, instance.onCollisionEnter, ctx, ev.other)) {
                    slot.enabled = false;
                }
            } else if (ev.kind === 'exit' && instance.onCollisionExit) {
                if (!this.sandbox.pcall(this.luaEngine, instance.onCollisionExit, ctx, ev.other)) {
                    slot.enabled = false;
                }
            }
        });

        this.collisionUnsubMap.set(slot.slotId, unsub);
    }

    private compileScriptsForEntity(entity: Entity, scriptComponent: ScriptComponent) {
        if (!this.luaEngine) return;

        for (const slot of scriptComponent.getSlots()) {
            if (this.scriptInstances.has(slot.slotId)) continue; // Already compiled

            // Fetch source code. Fallback to an empty script if not found.
            const source = BuiltInScripts[slot.scriptId] || `return {} -- Script not found: ${slot.scriptId}`;

            try {
                const instance = this.sandbox.compile(this.luaEngine, source);
                const ctx = LuaSelfFactory.create(entity, slot);

                this.scriptInstances.set(slot.slotId, instance);
                this.scriptContexts.set(slot.slotId, ctx);

                if (instance.init) {
                    if (!this.sandbox.pcall(this.luaEngine, instance.init, ctx)) {
                        slot.enabled = false;
                    }
                }
                if (slot.enabled && instance.onEnable) {
                    if (!this.sandbox.pcall(this.luaEngine, instance.onEnable, ctx)) {
                        slot.enabled = false;
                    }
                }

                // Initial property snapshot
                this.lastProperties.set(slot.slotId, JSON.stringify(slot.properties));

                // Now wire collisions based on if the script defined the hooks
                this.subscribeCollisionsIfNeeded(entity, scriptComponent, slot);
            } catch (err) {
                console.error(`[ScriptSystem] Failed to compile script for slot ${slot.slotId}:`, err);
            }
        }
    }

    private checkPropertyChanges() {
        if (!this.luaEngine) return;
        for (const entity of this.entities.values()) {
            const sc = entity.getComponent<ScriptComponent>("script");
            if (!sc) continue;
            for (const slot of sc.getSlots()) {
                const instance = this.scriptInstances.get(slot.slotId);
                const ctx = this.scriptContexts.get(slot.slotId);
                if (!instance?.onPropertyChanged || !ctx) continue;

                const currentProps = JSON.stringify(slot.properties);
                const lastPropsStr = this.lastProperties.get(slot.slotId);

                if (currentProps !== lastPropsStr) {
                    const lastProps = lastPropsStr ? JSON.parse(lastPropsStr) : {};
                    // Find which specific keys changed
                    for (const key of Object.keys(slot.properties)) {
                        if (slot.properties[key] !== lastProps[key]) {
                            this.sandbox.pcall(this.luaEngine, instance.onPropertyChanged, ctx, key, slot.properties[key]);
                        }
                    }
                    this.lastProperties.set(slot.slotId, currentProps);
                }
            }
        }
    }

    public earlyUpdate(dt: number): void {
        if (!this.luaEngine) return;
        this.checkPropertyChanges();
        this.timeBridgeSync?.setDelta(dt);
        for (const entity of this.entities.values()) {
            const sc = entity.getComponent<ScriptComponent>("script");
            if (!sc || !sc.enabled) continue;
            for (const slot of sc.getSlots()) {
                if (!slot.enabled) continue;
                const instance = this.scriptInstances.get(slot.slotId);
                const ctx = this.scriptContexts.get(slot.slotId);
                if (instance?.earlyUpdate && ctx) {
                    if (!this.sandbox.pcall(this.luaEngine, instance.earlyUpdate, ctx, dt)) {
                        slot.enabled = false;
                    }
                }
            }
        }
    }

    public update(dt: number): void {
        if (!this.luaEngine) return;
        this.timeBridgeSync?.setDelta(dt);
        for (const entity of this.entities.values()) {
            const sc = entity.getComponent<ScriptComponent>("script");
            if (!sc || !sc.enabled) continue;
            for (const slot of sc.getSlots()) {
                if (!slot.enabled) continue;
                const instance = this.scriptInstances.get(slot.slotId);
                const ctx = this.scriptContexts.get(slot.slotId);
                if (instance?.update && ctx) {
                    if (!this.sandbox.pcall(this.luaEngine, instance.update, ctx, dt)) {
                        slot.enabled = false;
                    }
                }
            }
        }
    }

    public lateUpdate(dt: number): void {
        if (!this.luaEngine) return;
        this.timeBridgeSync?.setDelta(dt);
        for (const entity of this.entities.values()) {
            const sc = entity.getComponent<ScriptComponent>("script");
            if (!sc || !sc.enabled) continue;
            for (const slot of sc.getSlots()) {
                if (!slot.enabled) continue;
                const instance = this.scriptInstances.get(slot.slotId);
                const ctx = this.scriptContexts.get(slot.slotId);
                if (instance?.lateUpdate && ctx) {
                    if (!this.sandbox.pcall(this.luaEngine, instance.lateUpdate, ctx, dt)) {
                        slot.enabled = false;
                    }
                }
            }
        }
    }

    private sceneUnsub?: () => void;

    public async setupAsync(allEntities: Map<string, Entity>, scene: { subscribeChanges: (listener: (ev: SceneChangeEvent) => void) => () => void }): Promise<void> {
        this.luaEngine = await this.sandbox.createEngine();

        const getEntity = (id: string) => allEntities.get(id);
        const getAllEntities = () => Array.from(allEntities.values());
        const getEventBus = () => this.eventBus;

        const bridgeCtx = { getEntity, getAllEntities, getEventBus };
        registerTransformBridge(this.luaEngine, bridgeCtx);
        registerSceneBridge(this.luaEngine, bridgeCtx);
        registerInputBridge(this.luaEngine);
        registerPhysicsBridge(this.luaEngine);
        this.timeBridgeSync = registerTimeBridge(this.luaEngine);

        // 1. Initial registering of entities
        for (const entity of allEntities.values()) {
            if (entity.hasComponent("script")) {
                this.registerEntity(entity);
            }
        }

        // 2. Compile hooks for already registered entities
        for (const entity of this.entities.values()) {
            const sc = entity.getComponent<ScriptComponent>("script");
            if (sc) {
                this.compileScriptsForEntity(entity, sc);
            }
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
                        this.compileScriptsForEntity(ent, ent.getComponent<ScriptComponent>("script")!);
                    }
                    else if (!hasScript && registered) this.unregisterEntity(ent.id);
                }
            }
        });

        this.eventBus.fire("SceneReady");
    }

    public setup(allEntities: Map<string, Entity>, scene: { subscribeChanges: (listener: (ev: SceneChangeEvent) => void) => () => void }): void {
        this.setupAsync(allEntities, scene).catch(err => {
            console.error("[ScriptSystem] failed to initialize wasmoon async", err);
        });
    }

    public teardown(): void {
        this.sceneUnsub?.();
        this.sceneUnsub = undefined;

        for (const entityId of Array.from(this.entities.keys())) {
            this.unregisterEntity(entityId);
        }
        this.eventBus.dispose();
    }
}
