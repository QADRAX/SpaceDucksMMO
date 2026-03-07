# Code Style Guide — @duckengine/core-v2

Rules for all code in this package. No exceptions.

## Files and Structure

- **File names**: `camelCase.ts` (`transform.ts`, `collisionEvents.ts`, `boxGeometry.ts`)
- **Test files**: co-located next to source (`transform.test.ts` beside `transform.ts`)
- **Max 200 lines** per `.ts` file. If it grows, split into a subfolder with a barrel
- Every folder has an `index.ts` barrel that re-exports all public symbols
- Barrel files are allowed **only** as `index.ts` inside their own folder
- **Zero default exports** — always `export function`, `export interface`, `export type`, `export const`
- One file = one responsibility. Subfolders by responsibility

## Naming

| Thing             | Convention         | Example                                      |
| ----------------- | ------------------ | -------------------------------------------- |
| Files             | `camelCase.ts`     | `sceneEvents.ts`, `boxGeometry.ts`           |
| Types / Interfaces| `PascalCase`       | `Scene`, `RenderingEngine`, `BoxGeometry`    |
| Functions         | `camelCase`        | `createEntity`, `addComponent`, `setupScene` |
| Constants         | `UPPER_SNAKE_CASE` | `PROFILE_STABLE`, `MATERIAL_RESOURCE_KINDS`  |
| Type parameters   | Single or prefix   | `T`, `K`, `TComponent`                       |
| Factory functions | `create*`          | `createTransform()`, `createScene()`         |

**No `I` prefix** on interfaces. `Scene` not `IScene`. `RenderingEngine` not `IRenderingEngine`.

## Documentation

- **TSDoc** required on every exported `interface`, `type`, and `function`
- Use `@param`, `@returns`, `@example` where they add value
- **Forbidden**: redundant comments (`// set the position` above `setPosition()`), `// TODO`, agent dev notes, decorative separators (`// =========`)
- Documentation describes **what** and **why**, never **how**

## Code Rules

| Rule                          | Detail                                                            |
| ----------------------------- | ----------------------------------------------------------------- |
| No classes                    | Factories return typed objects. State via closures or plain objects|
| No `this`                     | Every function takes explicit parameters                          |
| No `any`                      | Use `unknown` + type guards or generics                           |
| No `globalThis`               | Module-scoped `let` with explicit `set`/`get`/`clear`            |
| No inheritance                | Zero `extends`, zero `abstract class`. Composition only           |
| No side-effects on import     | An `import` never executes code. Factories are called explicitly  |
| No circular barrel re-exports | Barrels only re-export direct children, never parents or siblings |
| Immutability                  | Components are `Readonly<T>`. Compile-time only, no `Object.freeze()` |
| Result over throw             | `Result<T>` for fallible operations. Never `throw` in domain     |

## Patterns

- **Discriminated unions** with `type` field for components
- **Factory + API object** for stateful modules (collision hub, logger, registry)
- **Named params** when > 2 parameters: `createEntity({ id?, transform? })`
- Always `import type` for type-only imports

## Imports

- Relative within the same module: `./transform`
- By barrel for other modules: `../types`, `../ports`
- Never import a deep path from another module: `../types/math` is wrong, `../types` is right
