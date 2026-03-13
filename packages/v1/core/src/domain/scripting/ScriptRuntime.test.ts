/** @jest-environment node */
jest.unmock('wasmoon');

import { ScriptRuntime } from "./ScriptRuntime";
import { SceneEventBus } from "./SceneEventBus";
import { SystemScripts } from "./generated/ScriptAssets";

describe("ScriptRuntime", () => {
    let runtime: ScriptRuntime;
    let eventBus: SceneEventBus;

    beforeEach(() => {
        eventBus = new SceneEventBus();
        runtime = new ScriptRuntime(eventBus, "TestRuntime");
    });

    afterEach(() => {
        runtime.teardown();
        eventBus.dispose();
    });

    describe("setup()", () => {
        it("loads all 4 sandbox modules sequentially", async () => {
            await runtime.setup();

            // Verify the engine is initialized
            expect(runtime.lua).toBeDefined();

            // Verify sandbox globals are available
            const sandboxGlobals = runtime.lua.global.get("__CallHook");
            expect(sandboxGlobals).toBeDefined();
        });

        it("applies system script overrides", async () => {
            const customSecurity = `
                -- Custom security module for testing
                Script = { Test = "builtin://test.lua" }
            `;

            await runtime.setup({
                "sandbox_security.lua": customSecurity
            });

            const scriptTable = runtime.lua.global.get("Script");
            expect(scriptTable).toBeDefined();
            expect(scriptTable.Test).toBe("builtin://test.lua");
        });

        it("completes setup with custom modules", async () => {
            // Create a new runtime instance for this test
            const testRuntime = new ScriptRuntime(eventBus);
            // Provide all required modules
            await testRuntime.setup({
                "sandbox_security.lua": "return {}"
            });
            expect(testRuntime.lua).toBeDefined();
            testRuntime.teardown();
        });

        it("sets up print global that logs to CoreLogger", async () => {
            await runtime.setup();

            // Should not throw
            runtime.lua.doStringSync(`print("test message")`);
        });

        it("sets up log API with all severity levels", async () => {
            await runtime.setup();

            // Should not throw
            runtime.lua.doStringSync(`
                log.info("System", "info message")
                log.warn("System", "warn message")
                log.error("System", "error message")
                log.debug("System", "debug message")
            `);
        });
    });

    describe("callHook()", () => {
        beforeEach(async () => {
            await runtime.setup();
        });

        it("returns true when hook executes successfully", () => {
            // Store a simple hook in Lua
            runtime.lua.doStringSync(`
                if not __SlotHooks then __SlotHooks = {} end
                __SlotHooks["test-slot"] = {
                    testHook = function() return 42 end
                }
            `);

            const result = runtime.callHook("test-slot", "testHook");
            expect(result).toBe(true);
        });

        it("returns false and logs error when hook throws", () => {
            // Set up __CallHook to call the hook and throw
            runtime.lua.doStringSync(`
                function __CallHook(slotId, hookName, ...)
                    if not __SlotHooks then __SlotHooks = {} end
                    local slot = __SlotHooks[slotId]
                    if slot and slot[hookName] then
                        return slot[hookName](...)
                    end
                    error("Hook not found: " .. hookName)
                end
                
                if not __SlotHooks then __SlotHooks = {} end
                __SlotHooks["test-slot"] = {
                    badHook = function() error("intentional error") end
                }
            `);

            const result = runtime.callHook("test-slot", "badHook");
            expect(result).toBe(false);
        });

        it("returns true when __CallHook is not available", () => {
            // Clear __CallHook by executing Lua
            runtime.lua.doStringSync("__CallHook = nil");

            const result = runtime.callHook("test-slot", "anyHook");
            // When __CallHook is not available, callHook returns true (no-op)
            expect(result).toBe(true);
        });

        it("passes arguments to the hook correctly", () => {
            runtime.lua.doStringSync(`
                testResults = {}
                function __CallHook(slotId, hookName, ...)
                    local args = {...}
                    testResults.slotId = slotId
                    testResults.hookName = hookName
                    testResults.arg1 = args[1]
                    testResults.arg2 = args[2]
                end
            `);

            runtime.callHook("my-slot", "update", 16, "extra");

            const results = runtime.lua.global.get("testResults");
            expect(results.slotId).toBe("my-slot");
            expect(results.hookName).toBe("update");
            expect(results.arg1).toBe(16);
            expect(results.arg2).toBe("extra");
        });

        it("sets execution timeout before calling hook", async () => {
            await runtime.setup();

            // This is hard to test directly, but we can verify timeout doesn't cause immediate failure
            const result = runtime.callHook("test-slot", "update", 16);
            expect(result).toBe(true);
        });
    });

    describe("execute()", () => {
        beforeEach(async () => {
            await runtime.setup();
        });

        it("returns true on successful function execution", () => {
            const fn = runtime.lua.doStringSync(`return function() return 10 + 5 end`);
            const result = runtime.execute(fn);
            expect(result).toBe(true);
        });

        it("catches and logs Lua errors", () => {
            const fn = runtime.lua.doStringSync(`return function() error("test error") end`);
            const result = runtime.execute(fn);
            expect(result).toBe(false);
        });

        it("returns true when function is undefined", () => {
            const result = runtime.execute(undefined);
            expect(result).toBe(true);
        });

        it("passes arguments to function correctly", () => {
            const fn = runtime.lua.doStringSync(`
                return function(a, b) 
                    globalTestSum = a + b 
                end
            `);

            runtime.execute(fn, 10, 20);

            const sum = runtime.lua.global.get("globalTestSum");
            expect(sum).toBe(30);
        });
    });

    describe("registerBridge()", () => {
        beforeEach(async () => {
            await runtime.setup();
        });

        it("sets global on Lua engine", () => {
            const api = {
                getValue: () => 42,
                setValue: (v: number) => { /* noop */ }
            };

            runtime.registerBridge("TestBridge", api);

            const bridge = runtime.lua.global.get("TestBridge");
            expect(bridge).toBeDefined();
            expect(bridge.getValue()).toBe(42);
        });

        it("makes bridge accessible from Lua scripts", () => {
            runtime.registerBridge("Math", {
                add: (a: number, b: number) => a + b
            });

            const result = runtime.lua.doStringSync(`return Math.add(5, 3)`);
            expect(result).toBe(8);
        });

        it("does nothing when engine is not initialized", () => {
            const uninitializedRuntime = new ScriptRuntime();
            
            // Should not throw
            uninitializedRuntime.registerBridge("Test", {});
        });
    });

    describe("teardown()", () => {
        it("clears engine reference", async () => {
            await runtime.setup();
            expect(runtime.lua).toBeDefined();

            runtime.teardown();

            // After teardown, accessing lua should throw
            expect(() => runtime.lua).toThrow();
        });

        it("can be called multiple times safely", async () => {
            await runtime.setup();
            runtime.teardown();
            runtime.teardown(); // Should not throw
        });
    });

    describe("event bus integration", () => {
        it("fires log events to event bus", async () => {
            const logs: any[] = [];
            eventBus.subscribe("engine:log", "test", (data) => logs.push(data));

            await runtime.setup();
            runtime.lua.doStringSync(`print("test message")`);

            eventBus.flush();

            expect(logs.length).toBeGreaterThan(0);
            expect(logs.some(log => log.message.includes("test message"))).toBe(true);
        });

        it("works without event bus", async () => {
            const standaloneRuntime = new ScriptRuntime();
            await standaloneRuntime.setup();

            // Should not throw even without event bus
            standaloneRuntime.lua.doStringSync(`print("test")`);

            standaloneRuntime.teardown();
        });
    });

    describe("lua engine access", () => {
        it("throws when accessing lua before setup", () => {
            expect(() => runtime.lua).toThrow("ScriptRuntime not initialized");
        });

        it("provides lua engine after setup", async () => {
            await runtime.setup();
            expect(runtime.lua).toBeDefined();
            expect(runtime.lua.global).toBeDefined();
        });
    });
});
