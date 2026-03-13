# Code Style Guide — @duckengine/scripting-lua

Inherits all rules from `@duckengine/core-v2/CODESTYLE.md`. This document adds scripting-specific clarifications and overrides nothing.

## Files and Structure

- **File names**: `camelCase.ts` (`transformBridge.ts`, `slotKey.ts`, `eventBus.ts`)
- **Test files**: co-located next to source (`properties.test.ts` beside `properties.ts`)
- **Max 200 lines** per `.ts` file. If it grows, split into a subfolder with a barrel
- Every folder has an `index.ts` barrel that re-exports all public symbols
- Barrel files are allowed **only** as `index.ts` inside their own folder
- **Zero default exports** — always `export function`, `export interface`, `export type`, `export const`
- One file = one responsibility. Subfolders by responsibility
- **Domain Separation**: Types/interfaces in `types.ts`, pure logic in named files. See `ARCHITECTURE.md`.

## Naming

| Thing             | Convention         | Example                                      |
| ----------------- | ------------------ | -------------------------------------------- |
| Files             | `camelCase.ts`     | `transformBridge.ts`, `eventBus.ts`          |
| Types / Interfaces| `PascalCase`       | `ScriptSlotState`, `BridgeDeclaration`       |
| Functions         | `camelCase`        | `createScriptSlot`, `diffProperties`         |
| Constants         | `UPPER_SNAKE_CASE` | `FRAME_HOOKS`, `LIFECYCLE_ORDER`             |
| Bridge factories  | `<name>Bridge`     | `transformBridge`, `physicsBridge`           |
| Bridge creators   | `create*BridgeDeclaration` | `createSceneBridgeDeclaration`      |
| Lua modules       | `UPPER_SNAKE_CASE` | `SANDBOX_SECURITY_LUA`, `MATH_EXT_LUA`      |
| Use cases         | `camelCase`        | `initScriptSlot`, `reconcileScriptSlots`     |

**No `I` prefix** on interfaces. `ScriptSandbox` not `IScriptSandbox`.

## Documentation

- **TSDoc** required on every exported `interface`, `type`, and `function`
- Use `@param`, `@returns`, `@example` where they add value
- **Forbidden**: redundant comments, `// TODO`, agent dev notes, decorative separators
- Documentation describes **what** and **why**, never **how**

## Code Rules

All rules from core-v2 apply. Key reminders:

| Rule                          | Detail                                                            |
| ----------------------------- | ----------------------------------------------------------------- |
| No classes                    | Factories return typed objects. State via closures or plain objects|
| No `this`                     | Every function takes explicit parameters                          |
| No `any`                      | Use `unknown` + type guards or generics                           |
| No inheritance                | Composition only                                                  |
| No side-effects on import     | An `import` never executes code. Factories are called explicitly  |
| No circular barrel re-exports | Barrels only re-export direct children                            |
| Result over throw             | `Result<T>` for fallible operations. Never `throw` in domain     |

## Scripting-Specific Rules

| Rule | Detail |
|---|---|
| Bridges are domain | Bridge factories are pure functions → `domain/bridges/`. Not application, not infrastructure |
| Ports in domain | `ScriptSandbox` interface lives in `domain/ports/`. Infrastructure implements it |
| Use cases are the only application residents | `src/application/` contains **only** use case files + their test files. No helpers, no factories, no generic functions |
| Use case pattern | Every use case follows `UseCase<TState, TParams, TOutput>` with a `define*UseCase` helper |
| `*Like` interfaces for port surfaces | Minimal port-facing interfaces (`PhysicsQueryLike`, `GizmoLike`, `InputStateLike`) live in `domain/bridges/types.ts` |
| Lua template strings | Exported as `const UPPER_SNAKE: string` from `infrastructure/wasmoon/modules/`. Never in domain |
| No sandbox in domain | Sandbox _interface_ is a port (domain). Sandbox _implementation_ is infrastructure |
| `createScriptingAdapter` is infrastructure | It's the composition root, not a use case. It wires domain + ports + sandbox |

## Imports

- **No inline or dynamic imports** — Never use `as import('@duckengine/core-v2').X` or `import(...)` inside expressions. All imports must be at the top of the file.
- **Within a domain module**: relative (`./types`, `./slots`)
- **Between domain modules**: by barrel (`../slots`, `../bridges`, `../ports`)
- **From core-v2**: always `import type { ... } from '@duckengine/core-v2'` for types, named import for functions
- **Application → Domain**: by barrel (`../domain/slots`, `../domain/bridges`)
- **Infrastructure → Domain**: by barrel (`../domain`, `../domain/ports`)
- **Never import a deep path** from another module (`../bridges/types` is wrong, `../bridges` is right)
- Always `import type` for type-only imports

## Patterns

- **Discriminated unions** for events (SceneChangeEvent kinds)
- **Factory + compose** for bridge contexts (createScriptBridgeContext composes bridge factories)
- **Named params** when > 2 parameters
- **Feature-sliced domain** with `types.ts` + logic files + `index.ts` barrel per module
