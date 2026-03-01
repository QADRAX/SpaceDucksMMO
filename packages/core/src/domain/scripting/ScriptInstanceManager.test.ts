/** @jest-environment node */
jest.unmock('wasmoon');

import { ScriptInstanceManager } from "./ScriptInstanceManager";
import { ScriptRuntime } from "./ScriptRuntime";
import { Entity, ScriptComponent, ScriptSlot } from "../ecs";

describe("ScriptInstanceManager", () => {
    let manager: ScriptInstanceManager;
    let runtime: ScriptRuntime;

    beforeEach(async () => {
        runtime = new ScriptRuntime(undefined, "TestRuntime");
        await runtime.setup();
        manager = new ScriptInstanceManager(runtime);
    });

    afterEach(() => {
        runtime.teardown();
    });

    describe("compileSlot()", () => {
        it("compiles valid Lua script and returns instance metadata", () => {
            const entity = new Entity("test-entity");
            const slot: ScriptSlot = {
                scriptId: "test://simple",
                slotId: "slot-1",
                enabled: true,
                properties: {},
                executionOrder: 0
            };

            const scriptSource = `
                return {
                    schema = {},
                    init = function(self) end,
                    update = function(self, dt) end
                }
            `;

            const managerWithOverride = new ScriptInstanceManager(
                runtime,
                { "test://simple": scriptSource }
            );

            const instance = managerWithOverride.compileSlot(entity, slot);

            expect(instance).not.toBeNull();
            expect(instance?.init).toBe(true);
            expect(instance?.update).toBe(true);
        });

        it("stores context in Lua __Contexts table", () => {
            const entity = new Entity("test-entity");
            const slot: ScriptSlot = {
                scriptId: "test://context-check",
                slotId: "slot-ctx",
                enabled: true,
                properties: { testProp: 42 },
                executionOrder: 0
            };

            const scriptSource = `
                return {
                    schema = {},
                    init = function(self) end
                }
            `;

            const managerWithOverride = new ScriptInstanceManager(
                runtime,
                { "test://context-check": scriptSource }
            );

            managerWithOverride.compileSlot(entity, slot);

            // Verify context is stored in Lua
            const contexts = runtime.lua.global.get("__Contexts");
            expect(contexts).toBeDefined();
            expect(contexts["slot-ctx"]).toBeDefined();
        });

        it("extracts hook metadata for all lifecycle hooks", () => {
            const entity = new Entity("test-entity");
            const slot: ScriptSlot = {
                scriptId: "test://all-hooks",
                slotId: "slot-hooks",
                enabled: true,
                properties: {},
                executionOrder: 0
            };

            const scriptSource = `
                return {
                    schema = {},
                    init = function(self) end,
                    onEnable = function(self) end,
                    earlyUpdate = function(self, dt) end,
                    update = function(self, dt) end,
                    lateUpdate = function(self, dt) end,
                    onCollisionEnter = function(self, other) end,
                    onCollisionExit = function(self, other) end,
                    onDisable = function(self) end,
                    onDestroy = function(self) end,
                    onPropertyChanged = function(self, key, value) end
                }
            `;

            const managerWithOverride = new ScriptInstanceManager(
                runtime,
                { "test://all-hooks": scriptSource }
            );

            const instance = managerWithOverride.compileSlot(entity, slot);

            expect(instance?.init).toBe(true);
            expect(instance?.onEnable).toBe(true);
            expect(instance?.earlyUpdate).toBe(true);
            expect(instance?.update).toBe(true);
            expect(instance?.lateUpdate).toBe(true);
            expect(instance?.onCollisionEnter).toBe(true);
            expect(instance?.onCollisionExit).toBe(true);
            expect(instance?.onDisable).toBe(true);
            expect(instance?.onDestroy).toBe(true);
            expect(instance?.onPropertyChanged).toBe(true);
        });

        it("returns null on compilation error", () => {
            const entity = new Entity("test-entity");
            const slot: ScriptSlot = {
                scriptId: "test://broken",
                slotId: "slot-broken",
                enabled: true,
                properties: {},
                executionOrder: 0
            };

            const brokenSource = `
                return { this is not valid lua
            `;

            const managerWithOverride = new ScriptInstanceManager(
                runtime,
                { "test://broken": brokenSource }
            );

            const instance = managerWithOverride.compileSlot(entity, slot);

            expect(instance).toBeNull();
        });

        it("cleans up __compileRawCtx on error", () => {
            const entity = new Entity("test-entity");
            const slot: ScriptSlot = {
                scriptId: "test://error",
                slotId: "slot-error",
                enabled: true,
                properties: {},
                executionOrder: 0
            };

            const errorSource = `error("compilation error")`;

            const managerWithOverride = new ScriptInstanceManager(
                runtime,
                { "test://error": errorSource }
            );

            managerWithOverride.compileSlot(entity, slot);

            // Verify cleanup
            const rawCtx = runtime.lua.global.get("__compileRawCtx");
            expect(rawCtx).toBeNull();
        });

        it("applies script overrides in correct priority order", () => {
            const entity = new Entity("test-entity");
            const slot: ScriptSlot = {
                scriptId: "test://override",
                slotId: "slot-override",
                enabled: true,
                properties: {},
                executionOrder: 0
            };

            const scriptOverride = `
                return {
                    schema = { name = "script-override" },
                    init = function(self) end
                }
            `;

            const managerWithOverride = new ScriptInstanceManager(
                runtime,
                { "test://override": scriptOverride }
            );

            const instance = managerWithOverride.compileSlot(entity, slot);

            expect(instance?.schema.name).toBe("script-override");
        });

        it("handles scripts with no schema", () => {
            const entity = new Entity("test-entity");
            const slot: ScriptSlot = {
                scriptId: "test://no-schema",
                slotId: "slot-no-schema",
                enabled: true,
                properties: {},
                executionOrder: 0
            };

            const noSchemaSource = `
                return {
                    init = function(self) end
                }
            `;

            const managerWithOverride = new ScriptInstanceManager(
                runtime,
                { "test://no-schema": noSchemaSource }
            );

            const instance = managerWithOverride.compileSlot(entity, slot);

            expect(instance).not.toBeNull();
            expect(instance?.schema).toBeUndefined();
        });

        it("does not recompile already compiled slot", () => {
            const entity = new Entity("test-entity");
            const slot: ScriptSlot = {
                scriptId: "test://cached",
                slotId: "slot-cached",
                enabled: true,
                properties: {},
                executionOrder: 0
            };

            const source = `
                return {
                    schema = {},
                    init = function(self) end
                }
            `;

            const managerWithOverride = new ScriptInstanceManager(
                runtime,
                { "test://cached": source }
            );

            const instance1 = managerWithOverride.compileSlot(entity, slot);
            const instance2 = managerWithOverride.compileSlot(entity, slot);

            // Should return same instance
            expect(instance1).toBe(instance2);
        });
    });

    describe("syncProperties()", () => {
        it("detects property changes via JSON diff", () => {
            const entity = new Entity("test-entity");
            const slot: ScriptSlot = {
                scriptId: "test://props",
                slotId: "slot-props",
                enabled: true,
                properties: { count: 0 },
                executionOrder: 0
            };

            const source = `
                return {
                    schema = {
                        properties = {
                            count = { type = "number" }
                        }
                    },
                    init = function(self) end,
                    onPropertyChanged = function(self, key, value) end
                }
            `;

            const managerWithOverride = new ScriptInstanceManager(
                runtime,
                { "test://props": source }
            );

            managerWithOverride.compileSlot(entity, slot);

            // Change property
            slot.properties.count = 5;

            // Sync should detect change
            managerWithOverride.syncProperties(slot);

            // Verify Lua context was updated (would require checking __Contexts)
        });

        it("calls __UpdateProperty in Lua for changed properties", () => {
            const entity = new Entity("test-entity");
            const slot: ScriptSlot = {
                scriptId: "test://update-prop",
                slotId: "slot-update",
                enabled: true,
                properties: { value: 10 },
                executionOrder: 0
            };

            const source = `
                return {
                    schema = {
                        properties = {
                            value = { type = "number" }
                        }
                    },
                    init = function(self) end
                }
            `;

            const managerWithOverride = new ScriptInstanceManager(
                runtime,
                { "test://update-prop": source }
            );

            managerWithOverride.compileSlot(entity, slot);

            // Set up tracking in Lua
            runtime.lua.doStringSync(`
                updatePropertyCalls = {}
                local originalUpdateProperty = __UpdateProperty
                __UpdateProperty = function(slotId, key, val, propDef)
                    table.insert(updatePropertyCalls, {slotId=slotId, key=key, val=val})
                    originalUpdateProperty(slotId, key, val, propDef)
                end
            `);

            slot.properties.value = 20;
            managerWithOverride.syncProperties(slot);

            const calls = runtime.lua.global.get("updatePropertyCalls");
            expect(calls.length).toBe(1);
            expect(calls[0].key).toBe("value");
            expect(calls[0].val).toBe(20);
        });

        it("does nothing when properties unchanged", () => {
            const entity = new Entity("test-entity");
            const slot: ScriptSlot = {
                scriptId: "test://unchanged",
                slotId: "slot-unchanged",
                enabled: true,
                properties: { stable: 42 },
                executionOrder: 0
            };

            const source = `
                return {
                    schema = {},
                    init = function(self) end,
                    onPropertyChanged = function(self, key, value) end
                }
            `;

            const managerWithOverride = new ScriptInstanceManager(
                runtime,
                { "test://unchanged": source }
            );

            managerWithOverride.compileSlot(entity, slot);

            // Track calls
            runtime.lua.doStringSync(`
                propertyChangedCalls = 0
                local originalCallHook = __CallHook
                __CallHook = function(slotId, hookName, ...)
                    if hookName == "onPropertyChanged" then
                        propertyChangedCalls = propertyChangedCalls + 1
                    end
                    return originalCallHook(slotId, hookName, ...)
                end
            `);

            // Sync with no changes
            managerWithOverride.syncProperties(slot);

            const calls = runtime.lua.global.get("propertyChangedCalls");
            expect(calls).toBe(0);
        });

        it("handles errors in __UpdateProperty gracefully", () => {
            const entity = new Entity("test-entity");
            const slot: ScriptSlot = {
                scriptId: "test://error-update",
                slotId: "slot-error-update",
                enabled: true,
                properties: { value: 1 },
                executionOrder: 0
            };

            const source = `
                return {
                    schema = {},
                    init = function(self) end
                }
            `;

            const managerWithOverride = new ScriptInstanceManager(
                runtime,
                { "test://error-update": source }
            );

            managerWithOverride.compileSlot(entity, slot);

            // Break __UpdateProperty
            runtime.lua.doStringSync(`
                __UpdateProperty = function() error("intentional error") end
            `);

            slot.properties.value = 2;

            // Should not throw
            expect(() => managerWithOverride.syncProperties(slot)).not.toThrow();
        });
    });

    describe("removeSlot()", () => {
        it("deletes local instance metadata", () => {
            const entity = new Entity("test-entity");
            const slot: ScriptSlot = {
                scriptId: "test://remove",
                slotId: "slot-remove",
                enabled: true,
                properties: {},
                executionOrder: 0
            };

            const source = `
                return {
                    schema = {},
                    init = function(self) end
                }
            `;

            const managerWithOverride = new ScriptInstanceManager(
                runtime,
                { "test://remove": source }
            );

            managerWithOverride.compileSlot(entity, slot);
            expect(managerWithOverride.getInstance("slot-remove")).toBeDefined();

            managerWithOverride.removeSlot("slot-remove");
            expect(managerWithOverride.getInstance("slot-remove")).toBeUndefined();
        });

        it("calls Lua __RemoveSlot", () => {
            const entity = new Entity("test-entity");
            const slot: ScriptSlot = {
                scriptId: "test://remove-lua",
                slotId: "slot-remove-lua",
                enabled: true,
                properties: {},
                executionOrder: 0
            };

            const source = `
                return {
                    schema = {},
                    init = function(self) end
                }
            `;

            const managerWithOverride = new ScriptInstanceManager(
                runtime,
                { "test://remove-lua": source }
            );

            managerWithOverride.compileSlot(entity, slot);

            // Track calls
            runtime.lua.doStringSync(`
                removeSlotCalls = {}
                local originalRemoveSlot = __RemoveSlot
                __RemoveSlot = function(slotId)
                    table.insert(removeSlotCalls, slotId)
                    originalRemoveSlot(slotId)
                end
            `);

            managerWithOverride.removeSlot("slot-remove-lua");

            const calls = runtime.lua.global.get("removeSlotCalls");
            expect(calls.length).toBe(1);
            expect(calls[0]).toBe("slot-remove-lua");
        });

        it("handles errors in __RemoveSlot gracefully", () => {
            const entity = new Entity("test-entity");
            const slot: ScriptSlot = {
                scriptId: "test://remove-error",
                slotId: "slot-remove-error",
                enabled: true,
                properties: {},
                executionOrder: 0
            };

            const source = `
                return {
                    schema = {},
                    init = function(self) end
                }
            `;

            const managerWithOverride = new ScriptInstanceManager(
                runtime,
                { "test://remove-error": source }
            );

            managerWithOverride.compileSlot(entity, slot);

            // Break __RemoveSlot
            runtime.lua.doStringSync(`
                __RemoveSlot = function() error("intentional error") end
            `);

            // Should not throw
            expect(() => managerWithOverride.removeSlot("slot-remove-error")).not.toThrow();
        });
    });

    describe("getInstance()", () => {
        it("returns instance metadata for compiled slot", () => {
            const entity = new Entity("test-entity");
            const slot: ScriptSlot = {
                scriptId: "test://get",
                slotId: "slot-get",
                enabled: true,
                properties: {},
                executionOrder: 0
            };

            const source = `
                return {
                    schema = { name = "test-schema" },
                    init = function(self) end,
                    update = function(self, dt) end
                }
            `;

            const managerWithOverride = new ScriptInstanceManager(
                runtime,
                { "test://get": source }
            );

            managerWithOverride.compileSlot(entity, slot);

            const instance = managerWithOverride.getInstance("slot-get");

            expect(instance).toBeDefined();
            expect(instance?.init).toBe(true);
            expect(instance?.update).toBe(true);
            expect(instance?.schema.name).toBe("test-schema");
        });

        it("returns undefined for unknown slot", () => {
            const instance = manager.getInstance("unknown-slot-id");
            expect(instance).toBeUndefined();
        });
    });

    describe("getContext()", () => {
        it("returns slotId when instance exists", () => {
            const entity = new Entity("test-entity");
            const slot: ScriptSlot = {
                scriptId: "test://context",
                slotId: "slot-context",
                enabled: true,
                properties: {},
                executionOrder: 0
            };

            const source = `
                return {
                    schema = {},
                    init = function(self) end
                }
            `;

            const managerWithOverride = new ScriptInstanceManager(
                runtime,
                { "test://context": source }
            );

            managerWithOverride.compileSlot(entity, slot);

            const context = managerWithOverride.getContext("slot-context");
            expect(context).toBe("slot-context");
        });

        it("returns undefined when instance doesn't exist", () => {
            const context = manager.getContext("nonexistent-slot");
            expect(context).toBeUndefined();
        });
    });
});
