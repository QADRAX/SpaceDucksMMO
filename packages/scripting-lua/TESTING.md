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

## Test Helpers

Located in `infrastructure/testing/testHelpers.ts`:

- `waitForSlotInit(ms)` — Wait for async slot initialization
- `runFrames(api, count, dt)` — Run N update frames
- `createScene(api, sceneId)` — Create a scene
- `addSceneWithEntity(api, sceneId, entityId)` — Add scene + entity
- `addEntityWithScripts(api, sceneId, entityId, scripts)` — Add script component
- `createScriptingTestFixtures(options?)` — Full fixtures with chained setup

## Co-location

Per CODESTYLE, unit tests are co-located with source files (e.g. `slots.test.ts` next to `slots.ts`). Integration tests live in `infrastructure/` and use shared helpers.
