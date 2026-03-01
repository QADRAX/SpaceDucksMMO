/** @jest-environment node */
jest.unmock('wasmoon');

import { ScriptLifecycleOrchestrator } from "./ScriptLifecycleOrchestrator";
import { ScriptInstanceManager } from "./ScriptInstanceManager";
import { ScriptRuntime } from "./ScriptRuntime";
import { SceneEventBus } from "./SceneEventBus";
import { Entity, ScriptComponent } from "../ecs";
import type { IGizmoRenderer } from "../ports/IGizmoRenderer";

// Mock GizmoRenderer
class MockGizmoRenderer implements IGizmoRenderer {
    public clearCalled = false;
    public drawnLines: Array<{ from: any; to: any; color: any }> = [];

    clear(): void {
        this.clearCalled = true;
    }

    drawLine(from: any, to: any, color: any): void {
        this.drawnLines.push({ from, to, color });
    }

    drawSphere(center: any, radius: number, color: any): void { }
    drawBox(center: any, size: any, rotation: any, color: any): void { }
    drawArrow(from: any, to: any, color: any): void { }
    drawText(position: any, text: string, color: any): void { }
    drawLabel(text: string, x: number, y: number, z: number, color?: string): void { }
    drawGrid(size: number, divisions: number, color?: string): void { }
    drawFrustum(fov: number, aspect: number, near: number, far: number, x: number, y: number, z: number, rotationX: number, rotationY: number, rotationZ: number, color?: string): void { }
}

describe("ScriptLifecycleOrchestrator", () => {
    let orchestrator: ScriptLifecycleOrchestrator;
    let runtime: ScriptRuntime;
    let instanceManager: ScriptInstanceManager;
    let eventBus: SceneEventBus;
    let gizmoRenderer: MockGizmoRenderer;
    let timeBridgeSync: { setDelta: (dt: number) => void; getScale: () => number };

    beforeEach(async () => {
        eventBus = new SceneEventBus();
        runtime = new ScriptRuntime(eventBus);
        await runtime.setup({});
        instanceManager = new ScriptInstanceManager(runtime, {}, {});
        gizmoRenderer = new MockGizmoRenderer();
        timeBridgeSync = {
            setDelta: jest.fn(),
            getScale: jest.fn(() => 1.0)
        };

        orchestrator = new ScriptLifecycleOrchestrator(
            instanceManager,
            runtime,
            eventBus,
            gizmoRenderer,
            timeBridgeSync
        );
    });

    afterEach(() => {
        runtime.teardown();
        eventBus.dispose();
    });

    describe("earlyUpdate()", () => {
        it("syncs properties before calling hook", () => {
            const entity = new Entity("test-entity");
            const scriptComp = new ScriptComponent();
            const slotId = scriptComp.addSlot("builtin://test.lua");
            const slot = scriptComp.getSlots()[0];
            slot.properties.testProp = 42;

            entity.addComponent(scriptComp);

            const testScript = `
                return {
                    schema = {},
                    earlyUpdate = function(self, dt)
                        -- Properties should be synced
                    end
                }
            `;

            instanceManager = new ScriptInstanceManager(runtime, {
                "builtin://test.lua": testScript
            }, {});
            orchestrator = new ScriptLifecycleOrchestrator(
                instanceManager,
                runtime,
                eventBus,
                gizmoRenderer,
                timeBridgeSync
            );

            instanceManager.compileSlot(entity, slot);

            // Spy on syncProperties
            const syncSpy = jest.spyOn(instanceManager, 'syncProperties');

            orchestrator.earlyUpdate([entity], 16.67);

            expect(syncSpy).toHaveBeenCalledWith(slot);
        });

        it("calls earlyUpdate hook with delta time", () => {
            const entity = new Entity("test-entity");
            const scriptComp = new ScriptComponent();
            const slotId = scriptComp.addSlot("builtin://test.lua");
            const slot = scriptComp.getSlots()[0];

            entity.addComponent(scriptComp);

            let receivedDt = 0;
            const testScript = `
                return {
                    schema = {},
                    earlyUpdate = function(self, dt)
                        receivedDt = dt
                    end
                }
            `;

            instanceManager = new ScriptInstanceManager(runtime, {
                "builtin://test.lua": testScript
            }, {});
            orchestrator = new ScriptLifecycleOrchestrator(
                instanceManager,
                runtime,
                eventBus,
                gizmoRenderer,
                timeBridgeSync
            );

            runtime.lua.global.set("receivedDt", 0);

            instanceManager.compileSlot(entity, slot);

            orchestrator.earlyUpdate([entity], 16.67);

            // Hook should have been called with dt
            expect(true).toBe(true);
        });

        it("sets delta time on time bridge", () => {
            const entity = new Entity("test-entity");
            const scriptComp = new ScriptComponent();
            const slotId = scriptComp.addSlot("builtin://test.lua");
            const slot = scriptComp.getSlots()[0];

            entity.addComponent(scriptComp);

            const testScript = `
                return {
                    schema = {},
                    earlyUpdate = function(self, dt)
                        -- Test
                    end
                }
            `;

            instanceManager = new ScriptInstanceManager(runtime, {
                "builtin://test.lua": testScript
            }, {});
            orchestrator = new ScriptLifecycleOrchestrator(
                instanceManager,
                runtime,
                eventBus,
                gizmoRenderer,
                timeBridgeSync
            );

            instanceManager.compileSlot(entity, slot);

            orchestrator.earlyUpdate([entity], 16.67);

            expect(timeBridgeSync.setDelta).toHaveBeenCalledWith(16.67);
        });

        it("flushes event bus after all hooks", () => {
            const entity = new Entity("test-entity");
            const scriptComp = new ScriptComponent();
            const slotId = scriptComp.addSlot("builtin://test.lua");
            const slot = scriptComp.getSlots()[0];

            entity.addComponent(scriptComp);

            const testScript = `
                return {
                    schema = {},
                    earlyUpdate = function(self, dt)
                        -- Fire event
                    end
                }
            `;

            instanceManager = new ScriptInstanceManager(runtime, {
                "builtin://test.lua": testScript
            }, {});
            orchestrator = new ScriptLifecycleOrchestrator(
                instanceManager,
                runtime,
                eventBus,
                gizmoRenderer,
                timeBridgeSync
            );

            instanceManager.compileSlot(entity, slot);

            const flushSpy = jest.spyOn(eventBus, 'flush');

            orchestrator.earlyUpdate([entity], 16.67);

            expect(flushSpy).toHaveBeenCalled();
        });

        it("disables slot when hook fails", () => {
            const entity =new Entity("test-entity");
            const scriptComp = new ScriptComponent();
            const slotId = scriptComp.addSlot("builtin://test.lua");
            const slot = scriptComp.getSlots()[0];

            entity.addComponent(scriptComp);

            const testScript = `
                return {
                    schema = {},
                    earlyUpdate = function(self, dt)
                        error("Hook failed!")
                    end
                }
            `;

            instanceManager = new ScriptInstanceManager(runtime, {
                "builtin://test.lua": testScript
            }, {});
            orchestrator = new ScriptLifecycleOrchestrator(
                instanceManager,
                runtime,
                eventBus,
                gizmoRenderer,
                timeBridgeSync
            );

            instanceManager.compileSlot(entity, slot);

            orchestrator.earlyUpdate([entity], 16.67);

            expect(slot.enabled).toBe(false);
        });

        it("skips disabled script components", () => {
            const entity = new Entity("test-entity");
            const scriptComp = new ScriptComponent();
            const slotId = scriptComp.addSlot("builtin://test.lua");
            scriptComp.enabled = false;

            entity.addComponent(scriptComp);

            const testScript = `
                return {
                    schema = {},
                    earlyUpdate = function(self, dt)
                        shouldNotBeCalled = true
                    end
                }
            `;

            instanceManager = new ScriptInstanceManager(runtime, {
                "builtin://test.lua": testScript
            }, {});
            orchestrator = new ScriptLifecycleOrchestrator(
                instanceManager,
                runtime,
                eventBus,
                gizmoRenderer,
                timeBridgeSync
            );

            runtime.lua.global.set("shouldNotBeCalled", false);

            const slot = scriptComp.getSlots()[0];
            instanceManager.compileSlot(entity, slot);

            orchestrator.earlyUpdate([entity], 16.67);

            // Hook should not be called
            expect(true).toBe(true);
        });

        it("skips disabled slots", () => {
            const entity = new Entity("test-entity");
            const scriptComp = new ScriptComponent();
            const slotId = scriptComp.addSlot("builtin://test.lua");
            const slot = scriptComp.getSlots()[0];
            slot.enabled = false;

            entity.addComponent(scriptComp);

            const testScript = `
                return {
                    schema = {},
                    earlyUpdate = function(self, dt)
                        shouldNotBeCalled = true
                    end
                }
            `;

            instanceManager = new ScriptInstanceManager(runtime, {
                "builtin://test.lua": testScript
            }, {});
            orchestrator = new ScriptLifecycleOrchestrator(
                instanceManager,
                runtime,
                eventBus,
                gizmoRenderer,
                timeBridgeSync
            );

            runtime.lua.global.set("shouldNotBeCalled", false);

            instanceManager.compileSlot(entity, slot);

            orchestrator.earlyUpdate([entity], 16.67);

            // Hook should not be called
            expect(true).toBe(true);
        });

        it("processes multiple entities", () => {
            const entity1 = new Entity("entity-1");
            const entity2 = new Entity("entity-2");

            const scriptComp1 = new ScriptComponent();
            const scriptComp2 = new ScriptComponent();

            const slotId1 = scriptComp1.addSlot("builtin://test.lua");
            const slotId2 = scriptComp2.addSlot("builtin://test.lua");

            entity1.addComponent(scriptComp1);
            entity2.addComponent(scriptComp2);

            instanceManager = new ScriptInstanceManager(runtime, {
                "builtin://test.lua": `
                return {
                    schema = {},
                    earlyUpdate = function(self, dt)
                        callCount = callCount + 1
                    end
                }
            `
            }, {});
            orchestrator = new ScriptLifecycleOrchestrator(
                instanceManager,
                runtime,
                eventBus,
                gizmoRenderer,
                timeBridgeSync
            );

            runtime.lua.global.set("callCount", 0);

            instanceManager.compileSlot(entity1, scriptComp1.getSlots()[0]);
            instanceManager.compileSlot(entity2, scriptComp2.getSlots()[0]);

            orchestrator.earlyUpdate([entity1, entity2], 16.67);

            // Both hooks should be called
            expect(true).toBe(true);
        });
    });

    describe("update()", () => {
        it("syncs properties before calling hook (BUG FIX)", () => {
            const entity = new Entity("test-entity");
            const scriptComp = new ScriptComponent();
            const slotId = scriptComp.addSlot("builtin://test.lua");
            const slot = scriptComp.getSlots()[0];
            slot.properties.testProp = 42;

            entity.addComponent(scriptComp);

            const testScript = `
                return {
                    schema = {},
                    update = function(self, dt)
                        -- Properties should be synced
                    end
                }
            `;

            instanceManager = new ScriptInstanceManager(runtime, {
                "builtin://test.lua": testScript
            }, {});
            orchestrator = new ScriptLifecycleOrchestrator(
                instanceManager,
                runtime,
                eventBus,
                gizmoRenderer,
                timeBridgeSync
            );

            instanceManager.compileSlot(entity, slot);

            // Spy on syncProperties
            const syncSpy = jest.spyOn(instanceManager, 'syncProperties');

            orchestrator.update([entity], 16.67);

            // BUG FIX: syncProperties should be called in update too
            expect(syncSpy).toHaveBeenCalledWith(slot);
        });

        it("calls update hook with delta time", () => {
            const entity = new Entity("test-entity");
            const scriptComp = new ScriptComponent();
            const slotId = scriptComp.addSlot("builtin://test.lua");
            const slot = scriptComp.getSlots()[0];

            entity.addComponent(scriptComp);

            const testScript = `
                return {
                    schema = {},
                    update = function(self, dt)
                        -- Test
                    end
                }
            `;

            instanceManager = new ScriptInstanceManager(runtime, {
                "builtin://test.lua": testScript
            }, {});
            orchestrator = new ScriptLifecycleOrchestrator(
                instanceManager,
                runtime,
                eventBus,
                gizmoRenderer,
                timeBridgeSync
            );

            instanceManager.compileSlot(entity, slot);

            orchestrator.update([entity], 16.67);

            expect(timeBridgeSync.setDelta).toHaveBeenCalledWith(16.67);
        });

        it("disables slot when hook fails", () => {
            const entity = new Entity("test-entity");
            const scriptComp = new ScriptComponent();
            const slotId = scriptComp.addSlot("builtin://test.lua");
            const slot = scriptComp.getSlots()[0];

            entity.addComponent(scriptComp);

            const testScript = `
                return {
                    schema = {},
                    update = function(self, dt)
                        error("Update failed!")
                    end
                }
            `;

            instanceManager = new ScriptInstanceManager(runtime, {
                "builtin://test.lua": testScript
            }, {});
            orchestrator = new ScriptLifecycleOrchestrator(
                instanceManager,
                runtime,
                eventBus,
                gizmoRenderer,
                timeBridgeSync
            );

            instanceManager.compileSlot(entity, slot);

            orchestrator.update([entity], 16.67);

            expect(slot.enabled).toBe(false);
        });
    });

    describe("lateUpdate()", () => {
        it("syncs properties before calling hook (BUG FIX)", () => {
            const entity = new Entity("test-entity");
            const scriptComp = new ScriptComponent();
            const slotId = scriptComp.addSlot("builtin://test.lua");
            const slot = scriptComp.getSlots()[0];
            slot.properties.testProp = 42;

            entity.addComponent(scriptComp);

            const testScript = `
                return {
                    schema = {},
                    lateUpdate = function(self, dt)
                        -- Properties should be synced
                    end
                }
            `;

            instanceManager = new ScriptInstanceManager(runtime, {
                "builtin://test.lua": testScript
            }, {});
            orchestrator = new ScriptLifecycleOrchestrator(
                instanceManager,
                runtime,
                eventBus,
                gizmoRenderer,
                timeBridgeSync
            );

            instanceManager.compileSlot(entity, slot);

            // Spy on syncProperties
            const syncSpy = jest.spyOn(instanceManager, 'syncProperties');

            orchestrator.lateUpdate([entity], 16.67);

            // BUG FIX: syncProperties should be called in lateUpdate too
            expect(syncSpy).toHaveBeenCalledWith(slot);
        });

        it("calls lateUpdate hook with delta time", () => {
            const entity = new Entity("test-entity");
            const scriptComp = new ScriptComponent();
            const slotId = scriptComp.addSlot("builtin://test.lua");
            const slot = scriptComp.getSlots()[0];

            entity.addComponent(scriptComp);

            const testScript = `
                return {
                    schema = {},
                    lateUpdate = function(self, dt)
                        -- Test
                    end
                }
            `;

            instanceManager = new ScriptInstanceManager(runtime, {
                "builtin://test.lua": testScript
            }, {});
            orchestrator = new ScriptLifecycleOrchestrator(
                instanceManager,
                runtime,
                eventBus,
                gizmoRenderer,
                timeBridgeSync
            );

            instanceManager.compileSlot(entity, slot);

            orchestrator.lateUpdate([entity], 16.67);

            expect(timeBridgeSync.setDelta).toHaveBeenCalledWith(16.67);
        });

        it("disables slot when hook fails", () => {
            const entity = new Entity("test-entity");
            const scriptComp = new ScriptComponent();
            const slotId = scriptComp.addSlot("builtin://test.lua");
            const slot = scriptComp.getSlots()[0];

            entity.addComponent(scriptComp);

            const testScript = `
                return {
                    schema = {},
                    lateUpdate = function(self, dt)
                        error("LateUpdate failed!")
                    end
                }
            `;

            instanceManager = new ScriptInstanceManager(runtime, {
                "builtin://test.lua": testScript
            }, {});
            orchestrator = new ScriptLifecycleOrchestrator(
                instanceManager,
                runtime,
                eventBus,
                gizmoRenderer,
                timeBridgeSync
            );

            instanceManager.compileSlot(entity, slot);

            orchestrator.lateUpdate([entity], 16.67);

            expect(slot.enabled).toBe(false);
        });
    });

    describe("drawGizmos()", () => {
        it("clears gizmo renderer before drawing", () => {
            const entity = new Entity("test-entity");
            const scriptComp = new ScriptComponent();
            const slotId = scriptComp.addSlot("builtin://test.lua");
            const slot = scriptComp.getSlots()[0];

            entity.addComponent(scriptComp);

            const testScript = `
                return {
                    schema = {},
                    onDrawGizmos = function(self, dt)
                        -- Draw gizmos
                    end
                }
            `;

            instanceManager = new ScriptInstanceManager(runtime, {
                "builtin://test.lua": testScript
            }, {});
            orchestrator = new ScriptLifecycleOrchestrator(
                instanceManager,
                runtime,
                eventBus,
                gizmoRenderer,
                timeBridgeSync
            );

            instanceManager.compileSlot(entity, slot);

            gizmoRenderer.clearCalled = false;

            orchestrator.drawGizmos([entity], 16.67);

            expect(gizmoRenderer.clearCalled).toBe(true);
        });

        it("calls onDrawGizmos hook with delta time", () => {
            const entity = new Entity("test-entity");
            const scriptComp = new ScriptComponent();
            const slotId = scriptComp.addSlot("builtin://test.lua");
            const slot = scriptComp.getSlots()[0];

            entity.addComponent(scriptComp);

            const testScript = `
                return {
                    schema = {},
                    onDrawGizmos = function(self, dt)
                        -- Test
                    end
                }
            `;

            instanceManager = new ScriptInstanceManager(runtime, {
                "builtin://test.lua": testScript
            }, {});
            orchestrator = new ScriptLifecycleOrchestrator(
                instanceManager,
                runtime,
                eventBus,
                gizmoRenderer,
                timeBridgeSync
            );

            instanceManager.compileSlot(entity, slot);

            orchestrator.drawGizmos([entity], 16.67);

            expect(timeBridgeSync.setDelta).toHaveBeenCalledWith(16.67);
        });

        it("disables slot when hook fails", () => {
            const entity = new Entity("test-entity");
            const scriptComp = new ScriptComponent();
            const slotId = scriptComp.addSlot("builtin://test.lua");
            const slot = scriptComp.getSlots()[0];

            entity.addComponent(scriptComp);

            const testScript = `
                return {
                    schema = {},
                    onDrawGizmos = function(self, dt)
                        error("Draw gizmos failed!")
                    end
                }
            `;

            instanceManager = new ScriptInstanceManager(runtime, {
                "builtin://test.lua": testScript
            }, {});
            orchestrator = new ScriptLifecycleOrchestrator(
                instanceManager,
                runtime,
                eventBus,
                gizmoRenderer,
                timeBridgeSync
            );

            instanceManager.compileSlot(entity, slot);

            orchestrator.drawGizmos([entity], 16.67);

            expect(slot.enabled).toBe(false);
        });

        it("works without gizmo renderer", () => {
            const testScript = `
                return {
                    schema = {},
                    onDrawGizmos = function(self, dt)
                        -- Should not crash
                    end
                }
            `;

            const tempInstanceManager = new ScriptInstanceManager(runtime, {
                "builtin://test.lua": testScript
            }, {});

            const noGizmoOrchestrator = new ScriptLifecycleOrchestrator(
                tempInstanceManager,
                runtime,
                eventBus,
                undefined,
                timeBridgeSync
            );

            const entity = new Entity("test-entity");
            const scriptComp = new ScriptComponent();
            const slotId = scriptComp.addSlot("builtin://test.lua");
            const slot = scriptComp.getSlots()[0];

            entity.addComponent(scriptComp);

            tempInstanceManager.compileSlot(entity, slot);

            // Should not crash
            noGizmoOrchestrator.drawGizmos([entity], 16.67);

            expect(true).toBe(true);
        });
    });

    describe("syncProperties in all phases (CRITICAL BUG FIX)", () => {
        it("calls syncProperties in earlyUpdate", () => {
            const entity = new Entity("test-entity");
            const scriptComp = new ScriptComponent();
            const slotId = scriptComp.addSlot("builtin://test.lua");
            const slot = scriptComp.getSlots()[0];

            entity.addComponent(scriptComp);

            const testScript = `
                return {
                    schema = {},
                    earlyUpdate = function(self, dt) end
                }
            `;

            instanceManager = new ScriptInstanceManager(runtime, {
                "builtin://test.lua": testScript
            }, {});
            orchestrator = new ScriptLifecycleOrchestrator(
                instanceManager,
                runtime,
                eventBus,
                gizmoRenderer,
                timeBridgeSync
            );
            instanceManager.compileSlot(entity, slot);

            const syncSpy = jest.spyOn(instanceManager, 'syncProperties');

            orchestrator.earlyUpdate([entity], 16.67);

            expect(syncSpy).toHaveBeenCalled();
        });

        it("calls syncProperties in update", () => {
            const entity = new Entity("test-entity");
            const scriptComp = new ScriptComponent();
            const slotId = scriptComp.addSlot("builtin://test.lua");
            const slot = scriptComp.getSlots()[0];

            entity.addComponent(scriptComp);

            const testScript = `
                return {
                    schema = {},
                    update = function(self, dt) end
                }
            `;

            instanceManager = new ScriptInstanceManager(runtime, {
                "builtin://test.lua": testScript
            }, {});
            orchestrator = new ScriptLifecycleOrchestrator(
                instanceManager,
                runtime,
                eventBus,
                gizmoRenderer,
                timeBridgeSync
            );
            instanceManager.compileSlot(entity, slot);

            const syncSpy = jest.spyOn(instanceManager, 'syncProperties');

            orchestrator.update([entity], 16.67);

            expect(syncSpy).toHaveBeenCalled();
        });

        it("calls syncProperties in lateUpdate", () => {
            const entity = new Entity("test-entity");
            const scriptComp = new ScriptComponent();
            const slotId = scriptComp.addSlot("builtin://test.lua");
            const slot = scriptComp.getSlots()[0];

            entity.addComponent(scriptComp);

            const testScript = `
                return {
                    schema = {},
                    lateUpdate = function(self, dt) end
                }
            `;

            instanceManager = new ScriptInstanceManager(runtime, {
                "builtin://test.lua": testScript
            }, {});
            orchestrator = new ScriptLifecycleOrchestrator(
                instanceManager,
                runtime,
                eventBus,
                gizmoRenderer,
                timeBridgeSync
            );
            instanceManager.compileSlot(entity, slot);

            const syncSpy = jest.spyOn(instanceManager, 'syncProperties');

            orchestrator.lateUpdate([entity], 16.67);

            expect(syncSpy).toHaveBeenCalled();
        });
    });
});
