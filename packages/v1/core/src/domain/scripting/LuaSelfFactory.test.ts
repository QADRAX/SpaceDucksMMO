/** @jest-environment node */

import { LuaSelfFactory } from "./LuaSelfFactory";
import { Entity, ScriptSlot } from "../ecs";
import { NameComponent } from "../ecs/components/NameComponent";

describe("LuaSelfFactory", () => {
    describe("create()", () => {
        it("creates object with entity id and slotId", () => {
            const entity = new Entity("test-entity-123");
            const slot: ScriptSlot = {
                scriptId: "builtin://test.lua",
                slotId: "slot-456",
                enabled: true,
                properties: {},
                executionOrder: 0
            };

            const self = LuaSelfFactory.create(entity, slot);

            expect(self.id).toBe("test-entity-123");
            expect(self.slotId).toBe("slot-456");
        });

        it("initializes empty state object", () => {
            const entity = new Entity("test-entity");
            const slot: ScriptSlot = {
                scriptId: "builtin://test.lua",
                slotId: "slot-1",
                enabled: true,
                properties: {},
                executionOrder: 0
            };

            const self = LuaSelfFactory.create(entity, slot);

            expect(self.state).toBeDefined();
            expect(typeof self.state).toBe("object");
            expect(Object.keys(self.state).length).toBe(0);
        });

        it("copies properties from slot", () => {
            const entity = new Entity("test-entity");
            const slot: ScriptSlot = {
                scriptId: "builtin://test.lua",
                slotId: "slot-1",
                enabled: true,
                properties: {
                    speed: 10,
                    enabled: true,
                    name: "TestScript"
                },
                executionOrder: 0
            };

            const self = LuaSelfFactory.create(entity, slot);

            expect(self.properties).toBeDefined();
            expect(self.properties.speed).toBe(10);
            expect(self.properties.enabled).toBe(true);
            expect(self.properties.name).toBe("TestScript");
        });

        it("provides getComponent() function", () => {
            const entity = new Entity("test-entity");

            const slot: ScriptSlot = {
                scriptId: "builtin://test.lua",
                slotId: "slot-1",
                enabled: true,
                properties: {},
                executionOrder: 0
            };

            const self = LuaSelfFactory.create(entity, slot);

            expect(self.getComponent).toBeDefined();
            expect(typeof self.getComponent).toBe("function");
        });

        it("getComponent returns component snapshot when present", () => {
            const entity = new Entity("test-entity");
            const nameComp = new NameComponent();
            nameComp.value = "Test Entity Name";
            entity.addComponent(nameComp);

            const slot: ScriptSlot = {
                scriptId: "builtin://test.lua",
                slotId: "slot-1",
                enabled: true,
                properties: {},
                executionOrder: 0
            };

            const self = LuaSelfFactory.create(entity, slot);
            const snapshot = self.getComponent("name");

            expect(snapshot).not.toBeNull();
            expect(snapshot.value).toBe("Test Entity Name");
        });

        it("getComponent returns null for missing component", () => {
            const entity = new Entity("test-entity");

            const slot: ScriptSlot = {
                scriptId: "builtin://test.lua",
                slotId: "slot-1",
                enabled: true,
                properties: {},
                executionOrder: 0
            };

            const self = LuaSelfFactory.create(entity, slot);
            const missing = self.getComponent("nonexistent");

            expect(missing).toBeNull();
        });

        it("getComponent filters internal component fields", () => {
            const entity = new Entity("test-entity");
            const nameComp = new NameComponent();
            nameComp.value = "Test";
            entity.addComponent(nameComp);

            const slot: ScriptSlot = {
                scriptId: "builtin://test.lua",
                slotId: "slot-1",
                enabled: true,
                properties: {},
                executionOrder: 0
            };

            const self = LuaSelfFactory.create(entity, slot);
            const snapshot = self.getComponent("name");

            // Internal fields should not be exposed
            expect(snapshot.type).toBeUndefined();
            expect(snapshot.metadata).toBeUndefined();
            expect(snapshot.entity).toBeUndefined();
            expect(snapshot.isDisposed).toBeUndefined();
        });

        it("getComponent copies primitives (number, string, boolean)", () => {
            const entity = new Entity("test-entity");
            const nameComp = new NameComponent();
            nameComp.value = "test";

            // Add some custom primitive fields
            (nameComp as any).customNumber = 42;
            (nameComp as any).customString = "test";
            (nameComp as any).customBoolean = true;

            entity.addComponent(nameComp);

            const slot: ScriptSlot = {
                scriptId: "builtin://test.lua",
                slotId: "slot-1",
                enabled: true,
                properties: {},
                executionOrder: 0
            };

            const self = LuaSelfFactory.create(entity, slot);
            const snapshot = self.getComponent("name");

            expect(snapshot.value).toBe("test");
            expect(snapshot.customNumber).toBe(42);
            expect(snapshot.customString).toBe("test");
            expect(snapshot.customBoolean).toBe(true);
        });

        it("getComponent shallow-copies plain objects", () => {
            const entity = new Entity("test-entity");
            const nameComp = new NameComponent();
            nameComp.value = "test";
            
            // Add a plain object property
            (nameComp as any).config = { x: 10, y: 20 };

            entity.addComponent(nameComp);

            const slot: ScriptSlot = {
                scriptId: "builtin://test.lua",
                slotId: "slot-1",
                enabled: true,
                properties: {},
                executionOrder: 0
            };

            const self = LuaSelfFactory.create(entity, slot);
            const snapshot = self.getComponent("name");

            expect(snapshot.config).toBeDefined();
            expect(snapshot.config.x).toBe(10);
            expect(snapshot.config.y).toBe(20);

            // Verify it's a copy, not a reference
            expect(snapshot.config).not.toBe((nameComp as any).config);
        });

        it("does not include non-primitive, non-plain-object values", () => {
            const entity = new Entity("test-entity");
            const nameComp = new NameComponent();
            nameComp.value = "test";

            // Add various types that should be filtered
            (nameComp as any).arrayField = [1, 2, 3];
            (nameComp as any).functionField = () => {};
            (nameComp as any).classInstance = new Date();

            entity.addComponent(nameComp);

            const slot: ScriptSlot = {
                scriptId: "builtin://test.lua",
                slotId: "slot-1",
                enabled: true,
                properties: {},
                executionOrder: 0
            };

            const self = LuaSelfFactory.create(entity, slot);
            const snapshot = self.getComponent("name");

            // These should not be included
            expect(snapshot.arrayField).toBeUndefined();
            expect(snapshot.functionField).toBeUndefined();
            expect(snapshot.classInstance).toBeUndefined();
        });

        it("creates fresh state object for each call", () => {
            const entity = new Entity("test-entity");
            const slot1: ScriptSlot = {
                scriptId: "builtin://test.lua",
                slotId: "slot-1",
                enabled: true,
                properties: {},
                executionOrder: 0
            };
            const slot2: ScriptSlot = {
                scriptId: "builtin://test.lua",
                slotId: "slot-2",
                enabled: true,
                properties: {},
                executionOrder: 0
            };

            const self1 = LuaSelfFactory.create(entity, slot1);
            const self2 = LuaSelfFactory.create(entity, slot2);

            // State objects should be different instances
            expect(self1.state).not.toBe(self2.state);

            // Modifying one should not affect the other
            self1.state.test = "value1";
            expect(self2.state.test).toBeUndefined();
        });

        it("does not expose scripts property on JS object", () => {
            const entity = new Entity("test-entity");
            const slot: ScriptSlot = {
                scriptId: "builtin://test.lua",
                slotId: "slot-1",
                enabled: true,
                properties: {},
                executionOrder: 0
            };

            const self = LuaSelfFactory.create(entity, slot);

            // scripts should NOT be on the JS object
            // (it's handled by Lua metatables)
            expect(self.scripts).toBeUndefined();
        });

        it("allows dynamic properties via indexer", () => {
            const entity = new Entity("test-entity");
            const slot: ScriptSlot = {
                scriptId: "builtin://test.lua",
                slotId: "slot-1",
                enabled: true,
                properties: {},
                executionOrder: 0
            };

            const self = LuaSelfFactory.create(entity, slot);

            // Dynamic assignment should work
            self.customProp = 123;
            expect(self.customProp).toBe(123);
        });
    });

    describe("interface contract", () => {
        it("always includes id, slotId, state, properties, getComponent", () => {
            const entity = new Entity("test-entity");
            const slot: ScriptSlot = {
                scriptId: "builtin://test.lua",
                slotId: "slot-1",
                enabled: true,
                properties: { test: 1 },
                executionOrder: 0
            };

            const self = LuaSelfFactory.create(entity, slot);

            // These are mandatory
            expect(self).toHaveProperty("id");
            expect(self).toHaveProperty("slotId");
            expect(self).toHaveProperty("state");
            expect(self).toHaveProperty("properties");
            expect(self).toHaveProperty("getComponent");
        });

        it("state is always a fresh object, never null", () => {
            const entity = new Entity("test-entity");
            const slot: ScriptSlot = {
                scriptId: "builtin://test.lua",
                slotId: "slot-1",
                enabled: true,
                properties: {},
                executionOrder: 0
            };

            const self = LuaSelfFactory.create(entity, slot);

            expect(self.state).not.toBeNull();
            expect(typeof self.state).toBe("object");
            expect(Array.isArray(self.state)).toBe(false);
        });
    });
});
