# Testing Guide — scripting-lua

## Overview

Tests follow a pyramid structure: unit tests at the base, integration tests in the middle, and E2E/integration tests at the top.

## Running Tests

```bash
npm test
```

This runs typecheck (`tsc --noEmit`) followed by Jest.

## Test Pyramid

### Unit Tests (domain)

| File | Coverage |
|------|----------|
| `domain/properties/properties.test.ts` | `diffProperties`, `applyPropertyChanges`, `shallowEqual` |
| `domain/properties/normalizePropertyValue.test.ts` | `normalizeVec3Like` |
| `domain/componentAccessors/createComponentAccessorPair.test.ts` | Component getter/setter with `fireComponentChanged` |
| `domain/slots/slots.test.ts` | `createScriptSlot`, `slotKey`, `syncSlotPropertiesFromScene` |

### Application Tests (with mocks)

| File | Coverage |
|------|----------|
| `application/reconcileSlots.test.ts` | Slot creation, destruction, enable/disable, component accessor binding |
| `application/runFrameHooks.test.ts` | Time state, property sync, frame hooks, dirty flush, hook failure handling |
| `application/destroyEntitySlots.test.ts` | Entity removal, slot teardown, onDisable/onDestroy, other entities preserved |
| `application/syncProperties.test.ts` | ECS → Lua property sync, enabled/disabled slots, multiple slots |
| `application/teardownSession.test.ts` | Session teardown, slot lifecycle, event bus dispose |

### Infrastructure Tests

| File | Coverage |
|------|----------|
| `infrastructure/wasmoon/wasmoonSandbox.test.ts` | Lua sandbox lifecycle, hooks, error handling |
| `infrastructure/builtin/move_to_point.test.ts` | Built-in move_to_point script |
| `infrastructure/builtin/waypoint_path.test.ts` | Built-in waypoint_path script |

### Integration Tests

| File | Coverage |
|------|----------|
| `infrastructure/scriptingSubsystem.test.ts` | Full engine integration, custom ports, property sync |
| `infrastructure/testing/componentIsolation.test.ts` | Script isolation levels 0–4 |

### Test Scenarios

| File | Scenario |
|------|----------|
| `infrastructure/testing/scenarios/dynamicEntityWithScript.scenario.test.ts` | Add entity at runtime with Lua script resolved via ResourceLoader; register script after scene setup |
| `infrastructure/testing/scenarios/portsUsage.scenario.test.ts` | System ports (Input, Gizmo, Physics) via bridges; custom ports via `engine_ports` |

## Test Helpers

Located in `infrastructure/testing/testHelpers.ts`:

- `waitForSlotInit(ms)` — Wait for async slot initialization
- `runFrames(api, count, dt)` — Run N update frames
- `createScene(api, sceneId)` — Create a scene
- `addSceneWithEntity(api, sceneId, entityId)` — Add scene + entity
- `addEntityToScene(api, sceneId, entityId)` — Add entity to existing scene (runtime spawn)
- `addEntityWithScripts(api, sceneId, entityId, scripts)` — Add script component
- `createScriptingTestFixtures(options?)` — Full fixtures with chained setup

## Test Scenarios

Scenarios live in `infrastructure/testing/scenarios/` and test end-to-end flows:

- **Dynamic entity with runtime script**: Add entities at runtime; register Lua scripts via ResourceLoader; verify scripts run after reconcile and slot init.
- **Ports usage**: System ports via `Engine` namespace (`Engine.Input`, `Engine.Gizmo`, `Engine.Physics`, `Engine.Time`); custom ports via `engine_ports[portId]` (e.g. `engine_ports['game:analytics'].trackEvent(...)`).

To add a scenario:

1. Create `*.scenario.test.ts` in `scenarios/`.
2. Use `setupScriptingIntegrationTest()` and `registerScript()` for runtime-resolved scripts.
3. Use `addEntityToScene()` for entities added after initial setup.

## Co-location

Per CODESTYLE, unit tests are co-located with source files (e.g. `slots.test.ts` next to `slots.ts`). Integration tests live in `infrastructure/` and use shared helpers.
