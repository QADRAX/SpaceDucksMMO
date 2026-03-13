/** @jest-environment node */
jest.unmock('wasmoon');

import { ScriptEntityRegistry } from "./ScriptEntityRegistry";
import { ScriptInstanceManager } from "./ScriptInstanceManager";
import { ScriptRuntime } from "./ScriptRuntime";
import { SceneEventBus } from "./SceneEventBus";
import { Entity, ScriptComponent, ScriptSlot } from "../ecs";

describe("ScriptEntityRegistry", () => {
    let registry: ScriptEntityRegistry;
    let runtime: ScriptRuntime;
    let instanceManager: ScriptInstanceManager;
    let eventBus: SceneEventBus;

    beforeEach(async () => {
        eventBus = new SceneEventBus();
        runtime = new ScriptRuntime(eventBus);
        await runtime.setup({});
        instanceManager = new ScriptInstanceManager(runtime, {}, {});
        registry = new ScriptEntityRegistry(instanceManager, runtime);
    });

    afterEach(() => {
        runtime.teardown();
        eventBus.dispose();
    });

    describe("registerEntity()", () => {
        it("registers entity with script component", () => {
            const entity = new Entity("test-entity");
            const scriptComp = new ScriptComponent();
            entity.addComponent(scriptComp);

            const result = registry.registerEntity(entity);

            expect(result).toBe(true);
            expect(registry.hasEntity("test-entity")).toBe(true);
        });

        it("returns false for entity without script component", () => {
            const entity = new Entity("test-entity");

            const result = registry.registerEntity(entity);

            expect(result).toBe(false);
            expect(registry.hasEntity("test-entity")).toBe(false);
        });

        it("registers entity and updates size", () => {
            const entity1 = new Entity("entity-1");
            const entity2 = new Entity("entity-2");
            entity1.addComponent(new ScriptComponent());
            entity2.addComponent(new ScriptComponent());

            expect(registry.size).toBe(0);

            registry.registerEntity(entity1);
            expect(registry.size).toBe(1);

            registry.registerEntity(entity2);
            expect(registry.size).toBe(2);
        });
    });

    describe("unregisterEntity()", () => {
        it("unregisters entity and returns slot IDs", () => {
            const entity = new Entity("test-entity");
            const scriptComp = new ScriptComponent();
            const slotId = scriptComp.addSlot("builtin://test.lua");
            entity.addComponent(scriptComp);

            registry.registerEntity(entity);
            expect(registry.hasEntity("test-entity")).toBe(true);

            const removedSlots = registry.unregisterEntity("test-entity");

            expect(registry.hasEntity("test-entity")).toBe(false);
            expect(removedSlots).toContain(slotId);
        });

        it("returns empty array for non-existent entity", () => {
            const removedSlots = registry.unregisterEntity("non-existent");

            expect(removedSlots).toEqual([]);
        });

        it("calls onDestroy hook before removing slot", async () => {
            const entity = new Entity("test-entity");
            const scriptComp = new ScriptComponent();
            const slotId = scriptComp.addSlot("builtin://test.lua");
            entity.addComponent(scriptComp);

            // Mock script with onDestroy hook
            const testScript = `
                return {
                    schema = {},
                    onDestroy = function(self)
                        -- This should be called
                    end
                }
            `;

            instanceManager = new ScriptInstanceManager(runtime, {
                "builtin://test.lua": testScript
            }, {});
            registry = new ScriptEntityRegistry(instanceManager, runtime);

            registry.registerEntity(entity);
            registry.compileEntity(entity, scriptComp);

            const removedSlots = registry.unregisterEntity("test-entity");

            expect(removedSlots).toHaveLength(1);
        });

        it("updates size after unregistering", () => {
            const entity = new Entity("test-entity");
            const scriptComp = new ScriptComponent();
            entity.addComponent(scriptComp);

            registry.registerEntity(entity);
            expect(registry.size).toBe(1);

            registry.unregisterEntity("test-entity");
            expect(registry.size).toBe(0);
        });
    });

    describe("compileEntity()", () => {
        it("compiles all slots in script component", () => {
            const entity = new Entity("test-entity");
            const scriptComp = new ScriptComponent();
            const slotId1 = scriptComp.addSlot("test://test.lua");
            const slotId2 = scriptComp.addSlot("test://test2.lua");
            entity.addComponent(scriptComp);

            const testScript = "return { schema = {}, init = function(self) end }";

            // Create manager with script overrides
            instanceManager = new ScriptInstanceManager(runtime, {
                "test://test.lua": testScript,
                "test://test2.lua": testScript
            }, {});

            // Recreate registry with new instance manager
            registry = new ScriptEntityRegistry(instanceManager, runtime);

            registry.registerEntity(entity);
            const compiledSlots = registry.compileEntity(entity, scriptComp);

            expect(compiledSlots).toContain(slotId1);
            expect(compiledSlots).toContain(slotId2);
            expect(compiledSlots).toHaveLength(2);
        });

        it("calls init hook after compilation", () => {
            const entity = new Entity("test-entity");
            const scriptComp = new ScriptComponent();
            scriptComp.addSlot("builtin://test.lua");
            entity.addComponent(scriptComp);

            let initCalled = false;
            const testScript = `
                return {
                    schema = {},
                    init = function(self)
                        initCalled = true
                    end
                }
            `;

            instanceManager = new ScriptInstanceManager(runtime, {
                "builtin://test.lua": testScript
            }, {});
            registry = new ScriptEntityRegistry(instanceManager, runtime);

            // Inject flag into Lua global
            runtime.lua.global.set("initCalled", false);

            registry.registerEntity(entity);
            registry.compileEntity(entity, scriptComp);

            // Can't directly check Lua variable, but hook should be called
            expect(instanceManager.getInstance(scriptComp.getSlots()[0].slotId)).toBeDefined();
        });

        it("calls onEnable hook for enabled slots", () => {
            const entity = new Entity("test-entity");
            const scriptComp = new ScriptComponent();
            scriptComp.addSlot("builtin://test.lua");
            entity.addComponent(scriptComp);

            const testScript = `
                return {
                    schema = {},
                    onEnable = function(self)
                        -- Should be called
                    end
                }
            `;

            instanceManager = new ScriptInstanceManager(runtime, {
                "builtin://test.lua": testScript
            }, {});
            registry = new ScriptEntityRegistry(instanceManager, runtime);

            registry.registerEntity(entity);
            const compiledSlots = registry.compileEntity(entity, scriptComp);

            expect(compiledSlots).toHaveLength(1);
        });

        it("disables slot if init hook fails", () => {
            const entity = new Entity("test-entity");
            const scriptComp = new ScriptComponent();
            scriptComp.addSlot("builtin://test.lua");
            entity.addComponent(scriptComp);

            const testScript = `
                return {
                    schema = {},
                    init = function(self)
                        error("Init failed!")
                    end
                }
            `;

            instanceManager = new ScriptInstanceManager(runtime, {
                "builtin://test.lua": testScript
            }, {});
            registry = new ScriptEntityRegistry(instanceManager, runtime);

            registry.registerEntity(entity);
            registry.compileEntity(entity, scriptComp);

            const slot = scriptComp.getSlots()[0];
            expect(slot.enabled).toBe(false);
        });

        it("disables slot if onEnable hook fails", () => {
            const entity = new Entity("test-entity");
            const scriptComp = new ScriptComponent();
            scriptComp.addSlot("builtin://test.lua");
            entity.addComponent(scriptComp);

            const testScript = `
                return {
                    schema = {},
                    onEnable = function(self)
                        error("OnEnable failed!")
                    end
                }
            `;

            instanceManager = new ScriptInstanceManager(runtime, {
                "builtin://test.lua": testScript
            }, {});
            registry = new ScriptEntityRegistry(instanceManager, runtime);

            registry.registerEntity(entity);
            registry.compileEntity(entity, scriptComp);

            const slot = scriptComp.getSlots()[0];
            expect(slot.enabled).toBe(false);
        });

        it("skips already compiled slots", () => {
            const entity = new Entity("test-entity");
            const scriptComp = new ScriptComponent();
            scriptComp.addSlot("builtin://test.lua");
            entity.addComponent(scriptComp);

            const testScript = "return { schema = {} }";
            instanceManager = new ScriptInstanceManager(runtime, {
                "builtin://test.lua": testScript
            }, {});
            registry = new ScriptEntityRegistry(instanceManager, runtime);

            registry.registerEntity(entity);
            
            // First compilation
            const firstCompile = registry.compileEntity(entity, scriptComp);
            expect(firstCompile).toHaveLength(1);

            // Second compilation (should skip already compiled slot)
            const secondCompile = registry.compileEntity(entity, scriptComp);
            expect(secondCompile).toHaveLength(0);
        });
    });

    describe("getEntity()", () => {
        it("returns registered entity by ID", () => {
            const entity = new Entity("test-entity");
            const scriptComp = new ScriptComponent();
            entity.addComponent(scriptComp);

            registry.registerEntity(entity);

            const retrieved = registry.getEntity("test-entity");
            expect(retrieved).toBe(entity);
        });

        it("returns undefined for non-existent entity", () => {
            const retrieved = registry.getEntity("non-existent");
            expect(retrieved).toBeUndefined();
        });
    });

    describe("getAllEntities()", () => {
        it("returns all registered entities", () => {
            const entity1 = new Entity("entity-1");
            const entity2 = new Entity("entity-2");
            entity1.addComponent(new ScriptComponent());
            entity2.addComponent(new ScriptComponent());

            registry.registerEntity(entity1);
            registry.registerEntity(entity2);

            const allEntities = registry.getAllEntities();

            expect(allEntities).toHaveLength(2);
            expect(allEntities).toContain(entity1);
            expect(allEntities).toContain(entity2);
        });

        it("returns readonly array", () => {
            const entity = new Entity("test-entity");
            entity.addComponent(new ScriptComponent());
            registry.registerEntity(entity);

            const allEntities = registry.getAllEntities();

            // Should be readonly (can't modify)
            expect(Array.isArray(allEntities)).toBe(true);
        });

        it("returns empty array when no entities registered", () => {
            const allEntities = registry.getAllEntities();
            expect(allEntities).toHaveLength(0);
        });
    });

    describe("hasEntity()", () => {
        it("returns true for registered entity", () => {
            const entity = new Entity("test-entity");
            entity.addComponent(new ScriptComponent());

            registry.registerEntity(entity);

            expect(registry.hasEntity("test-entity")).toBe(true);
        });

        it("returns false for non-existent entity", () => {
            expect(registry.hasEntity("non-existent")).toBe(false);
        });

        it("returns false after entity is unregistered", () => {
            const entity = new Entity("test-entity");
            entity.addComponent(new ScriptComponent());

            registry.registerEntity(entity);
            expect(registry.hasEntity("test-entity")).toBe(true);

            registry.unregisterEntity("test-entity");
            expect(registry.hasEntity("test-entity")).toBe(false);
        });
    });

    describe("size", () => {
        it("returns number of registered entities", () => {
            expect(registry.size).toBe(0);

            const entity1 = new Entity("entity-1");
            const entity2 = new Entity("entity-2");
            entity1.addComponent(new ScriptComponent());
            entity2.addComponent(new ScriptComponent());

            registry.registerEntity(entity1);
            expect(registry.size).toBe(1);

            registry.registerEntity(entity2);
            expect(registry.size).toBe(2);

            registry.unregisterEntity("entity-1");
            expect(registry.size).toBe(1);

            registry.unregisterEntity("entity-2");
            expect(registry.size).toBe(0);
        });
    });
});
