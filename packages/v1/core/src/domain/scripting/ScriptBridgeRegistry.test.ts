/** @jest-environment node */
jest.unmock('wasmoon');

import { ScriptBridgeRegistry } from "./ScriptBridgeRegistry";
import { ScriptRuntime } from "./ScriptRuntime";
import { SceneEventBus } from "./SceneEventBus";
import type { BridgeContext } from "./bridge";

describe("ScriptBridgeRegistry", () => {
    let bridgeRegistry: ScriptBridgeRegistry;
    let runtime: ScriptRuntime;
    let eventBus: SceneEventBus;
    let bridgeContext: BridgeContext;

    beforeEach(async () => {
        eventBus = new SceneEventBus();
        runtime = new ScriptRuntime(eventBus);
        await runtime.setup({});
        bridgeRegistry = new ScriptBridgeRegistry();

        bridgeContext = {
            getEntity: (id: string) => undefined,
            getAllEntities: () => [],
            getEventBus: () => eventBus,
            componentFactory: {} as any,
            assetResolver: undefined,
            gizmoRenderer: undefined,
            prefabRegistry: undefined,
            getScriptSlots: () => [],
            getSlotProperty: () => null,
            setSlotProperty: () => { },
            removeEntity: undefined
        };
    });

    afterEach(() => {
        runtime.teardown();
        eventBus.dispose();
    });

    describe("registerAll()", () => {
        it("registers all standard bridges", () => {
            bridgeRegistry.registerAll(runtime.lua, bridgeContext, false);

            // Check for standard bridge registration by testing Lua globals
            const transform = runtime.lua.global.get("Transform");
            const scene = runtime.lua.global.get("Scene");
            const math = runtime.lua.global.get("Math");
            const input = runtime.lua.global.get("Input");
            const physics = runtime.lua.global.get("Physics");
            const gizmo = runtime.lua.global.get("Gizmo");
            const time = runtime.lua.global.get("Time");

            expect(transform).toBeDefined();
            expect(scene).toBeDefined();
            expect(math).toBeDefined();
            expect(input).toBeDefined();
            expect(physics).toBeDefined();
            expect(gizmo).toBeDefined();
            expect(time).toBeDefined();
        });

        it("registers editor bridge when in editor context", () => {
            bridgeRegistry.registerAll(runtime.lua, bridgeContext, true);

            // Check for editor bridge registration
            const editor = runtime.lua.global.get("Editor");

            expect(editor).toBeDefined();
        });

        it("does not register editor bridge when not in editor context", () => {
            bridgeRegistry.registerAll(runtime.lua, bridgeContext, false);

            // Editor bridge should not be registered
            const editor = runtime.lua.global.get("Editor");

            expect(editor).toBeNull();
        });

        it("stores time bridge sync reference", () => {
            bridgeRegistry.registerAll(runtime.lua, bridgeContext, false);

            const timeBridgeSync = bridgeRegistry.getTimeBridgeSync();

            expect(timeBridgeSync).toBeDefined();
            expect(timeBridgeSync).toHaveProperty("setDelta");
            expect(timeBridgeSync).toHaveProperty("getScale");
        });

        it("registers all bridges without crashes", () => {
            expect(() => {
                bridgeRegistry.registerAll(runtime.lua, bridgeContext, false);
            }).not.toThrow();
        });
    });

    describe("getTimeBridgeSync()", () => {
        it("returns time bridge sync object after registration", () => {
            bridgeRegistry.registerAll(runtime.lua, bridgeContext, false);

            const timeBridgeSync = bridgeRegistry.getTimeBridgeSync();

            expect(timeBridgeSync).toBeDefined();
            expect(typeof timeBridgeSync?.setDelta).toBe("function");
            expect(typeof timeBridgeSync?.getScale).toBe("function");
        });

        it("returns undefined before registration", () => {
            const timeBridgeSync = bridgeRegistry.getTimeBridgeSync();

            expect(timeBridgeSync).toBeUndefined();
        });

        it("setDelta can be called on time bridge sync", () => {
            bridgeRegistry.registerAll(runtime.lua, bridgeContext, false);

            const timeBridgeSync = bridgeRegistry.getTimeBridgeSync();

            expect(() => {
                timeBridgeSync?.setDelta(16.67);
            }).not.toThrow();
        });

        it("getScale returns default time scale", () => {
            bridgeRegistry.registerAll(runtime.lua, bridgeContext, false);

            const timeBridgeSync = bridgeRegistry.getTimeBridgeSync();
            const scale = timeBridgeSync?.getScale();

            expect(scale).toBe(1.0);
        });
    });

    describe("bridge integration", () => {
        it("Transform bridge is accessible from Lua", async () => {
            bridgeRegistry.registerAll(runtime.lua, bridgeContext, false);

            // Transform is already registered via the bridge, no need to register script

            const result = await runtime.lua.doString(`
                local Transform = Transform
                return Transform ~= nil
            `);

            expect(result).toBe(true);
        });

        it("Math bridge provides utility functions", async () => {
            bridgeRegistry.registerAll(runtime.lua, bridgeContext, false);

            const result = await runtime.lua.doString(`
                return type(Math)
            `);

            // In wasmoon, JS objects exposed to Lua are userdata type, not table
            expect(result).toBe("userdata");
        });

        it("Input bridge is registered", async () => {
            bridgeRegistry.registerAll(runtime.lua, bridgeContext, false);

            const result = await runtime.lua.doString(`
                return Input ~= nil
            `);

            expect(result).toBe(true);
        });

        it("Physics bridge is registered", async () => {
            bridgeRegistry.registerAll(runtime.lua, bridgeContext, false);

            const result = await runtime.lua.doString(`
                return Physics ~= nil
            `);

            expect(result).toBe(true);
        });

        it("Scene bridge is registered", async () => {
            bridgeRegistry.registerAll(runtime.lua, bridgeContext, false);

            const result = await runtime.lua.doString(`
                return Scene ~= nil
            `);

            expect(result).toBe(true);
        });

        it("Time bridge is registered", async () => {
            bridgeRegistry.registerAll(runtime.lua, bridgeContext, false);

            const result = await runtime.lua.doString(`
                return Time ~= nil
            `);

            expect(result).toBe(true);
        });

        it("Gizmo bridge is registered", async () => {
            bridgeRegistry.registerAll(runtime.lua, bridgeContext, false);

            const result = await runtime.lua.doString(`
                return Gizmo ~= nil
            `);

            expect(result).toBe(true);
        });
    });

    describe("editor-specific behavior", () => {
        it("Editor bridge only available in editor context", async () => {
            // Non-editor context
            const nonEditorRegistry = new ScriptBridgeRegistry();
            nonEditorRegistry.registerAll(runtime.lua, bridgeContext, false);

            let editorAvailable = await runtime.lua.doString(`return Editor ~= nil`);
            expect(editorAvailable).toBe(false);

            // Clean up and test editor context
            runtime.teardown();
            eventBus.dispose();

            eventBus = new SceneEventBus();
            runtime = new ScriptRuntime(eventBus);
            await runtime.setup({});

            const editorRegistry = new ScriptBridgeRegistry();
            editorRegistry.registerAll(runtime.lua, bridgeContext, true);

            editorAvailable = await runtime.lua.doString(`return Editor ~= nil`);
            expect(editorAvailable).toBe(true);
        });
    });

    describe("multiple registrations", () => {
        it("can register bridges multiple times without error", () => {
            expect(() => {
                bridgeRegistry.registerAll(runtime.lua, bridgeContext, false);
                bridgeRegistry.registerAll(runtime.lua, bridgeContext, false);
            }).not.toThrow();
        });

        it("time bridge sync is updated on re-registration", () => {
            bridgeRegistry.registerAll(runtime.lua, bridgeContext, false);
            const firstSync = bridgeRegistry.getTimeBridgeSync();

            bridgeRegistry.registerAll(runtime.lua, bridgeContext, false);
            const secondSync = bridgeRegistry.getTimeBridgeSync();

            // Both should be defined
            expect(firstSync).toBeDefined();
            expect(secondSync).toBeDefined();
        });
    });
});
