# New V2 Package / Subsystem Workflow

Use with [SKILL.md](SKILL.md). Track progress explicitly.

```
New package progress:
- [ ] 1. Decide role and name
- [ ] 2. Scaffold layers
- [ ] 3. Domain modules (types / functions / constants / ports split)
- [ ] 4. Application use cases (no ports/types/fns/vendors inline)
- [ ] 5. Infrastructure: adapters + composition + integrations + dto/mappers
- [ ] 6. Public index exports
- [ ] 7. Tests
- [ ] 8. Wire composition root
- [ ] 9. ARCHITECTURE.md (if non-trivial)
- [ ] 10. Architecture + file-scope check from SKILL.md
```

## 1. Decide role and name

Ask:

- Is this a **scene** subsystem, **engine** subsystem, **thin env adapter**, **loader/util**, or **composition facade**?
- Does an existing package already own this concern?
- npm name: `@duckengine/<name>-v2` (follow neighbors; physics folder is `physics-rapier` but package is `physics-rapier-v2`)

Depend on `@duckengine/core-v2` (+ vendor libs only). No v1 packages.

## 2. Scaffold

```
packages/v2/<name>/
  package.json
  tsconfig.json
  src/
    domain/
    application/
    infrastructure/
    index.ts
```

Skip empty layers only for thin adapters (single `createXPort` file is OK).

## 3. Domain (modules + kind split)

Scaffold by **module** (concern), then by **kind**:

```
src/domain/
  <module>/
    types.ts          # small cohesive types only
    constants.ts      # if any
    <pureFn>.ts       # one concern per file; split when large
    index.ts          # re-exports only
  ports/
    <name>Port.ts     # package-owned ports (interfaces only)
```

- Every export gets TSDoc
- Large type families or functions → their own files (do not pile into `types.ts` / `utils.ts`)
- If exposing an **engine-wide** port: add `*Port` + `*PortDef` in **core-v2** `domain/ports/external/`, implement adapter here

## 4. Application (use cases only)

- **One use case per file**
- Import domain types/functions and port interfaces — **do not define** ports, reusable domain types, or pure domain helpers in the use-case file
- Tiny use-case-only param aliases OK if not reused; otherwise extract
- Accept `readonly` params; return `Result` or typed outputs
- Call ports — never vendor SDKs

## 5. Infrastructure (split concerns)

```
src/infrastructure/
  adapters/           # *PortImpl
  composition/        # createXSubsystem / providers
  <vendor>/           # three | rapier | prisma | …
  dto/                # external transfer shapes
  mappers/            # dto ↔ domain
  testing/
```

- **Adapters** implement ports; orchestrate mapper + integration + use cases
- **Composition** wires outward — no inline vendor algorithms
- **Integrations** own SDK/API calls; prefer returning DTOs
- **DTOs** describe the external world; **mappers** translate to DuckEngine domain types
- Do not redefine domain types here — import them
- Flat file names OK in small packages if concerns stay obvious (`physicsQueryPortImpl.ts`, `prismaMappers.ts`, `rapierBodies.ts`)

## 6. Public API (`index.ts`)

```ts
/**
 * @duckengine/<name>-v2
 * One-sentence package purpose.
 */
export { createXSubsystem } from './infrastructure';
export type { PublicType } from './domain';
```

Do not re-export infrastructure internals.

## 7. Tests

- Pure domain/application: colocated `*.test.ts`
- Engine wiring / multi-package: `*.integration.test.ts`
- Prefer testing through ports where that is the contract

## 8. Wire composition

Add the factory to:

- `packages/v2/engine-web-v2` (product web client), and/or
- `packages/v2/engine-test-harness` (playground / e2e)

Pass any required port bindings via `customPorts` or subsystem `portProviders`.

## 9. Document

For non-trivial packages, add `ARCHITECTURE.md` (Logical / Process / Development / Physical + scenarios), matching `core-v2` / `scripting-lua` style.

## Package-type shortcuts

| Type | Minimum shape |
|------|----------------|
| Scene subsystem | domain + application + `createSceneSubsystem` in infrastructure |
| Engine subsystem | domain (optional) + application (optional) + `createEngineSubsystem` |
| Thin Input/Storage adapter | single module exporting `create…Port` |
| YAML/loader util | domain validation + infrastructure load |
| Facade | flat `src/create….ts` composing other packages only |
| Server app (persistence-like) | application ports + presentation + optional http |

## Done when

- Layers and imports comply with the skill
- No vendor imports in domain/application
- Each file has one scope; domain kinds split; use cases do not embed ports/domain
- Infrastructure separates adapter / composition / integration / dto / mapper
- Public API is narrow and every export is TSDoc’d
- At least one test covers the main contract
- Composition root can construct a working engine with the new piece
- No v1 imports
