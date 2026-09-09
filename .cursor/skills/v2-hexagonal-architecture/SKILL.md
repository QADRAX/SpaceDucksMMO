---
name: v2-hexagonal-architecture
description: >-
  Enforces hexagonal/clean architecture for DuckEngine packages/v2: domain,
  application, infrastructure layers; vendor libs only in infrastructure;
  adapters/composition/integrations/DTOs/mappers kept separate; one-scope-per-file;
  Port/Adapter; TSDoc; strong typing; composition facades. Use when creating or
  editing packages under packages/v2, use cases, domain modules, ports, adapters,
  mappers, DTOs, subsystems, facades, or reviewing architecture drift.
  Do not apply to packages/v1 (legacy, pending removal).
---

# V2 Hexagonal / Clean Architecture

Apply this skill for **any** work under `packages/v2/`. Goal: keep packages
composable, testable, and typed so facades stay thin and problems stay isolated.

Read deeper material only when needed:
- [reference.md](reference.md) — ports, deps, examples, known exceptions
- [new-package.md](new-package.md) — checklist for a new package/subsystem

## Non-negotiables

1. **v2 only** — Never import `@duckengine/*` from `packages/v1`. Do not extend v1; it will be deleted when v2 replacements exist.
2. **Layers (canonical names)** — `domain/`, `application/`, `infrastructure/` (lowercase, full words). Never `app/`, `infra/`, `Domain/`, `Infra/`.
3. **Dependency direction** — `infrastructure → application → domain`. Domain never imports application or infrastructure. Application never imports infrastructure (except documented core exceptions; see reference).
4. **core-v2 is the shared kernel** — Owns ECS, scenes, port registry, use-case builders. Adapters depend on core; **core never depends on adapters**.
5. **Port / Adapter** — Cross-boundary contracts are ports; implementations are adapters in infrastructure (or sibling adapter packages).
6. **Vendors only in infrastructure** — Three, Rapier, Wasmoon, Prisma, HTTP/SDKs, fs, etc. never enter `domain/` or `application/`. Inside infrastructure, split **adapter / composition / integration / DTO / mapper** — do not mix them in one file.
7. **One scope per file** — A file owns one kind of thing. Never leave a port interface, pure domain type, or domain function inside a use-case file (or dump unrelated kinds together). See [File scope](#file-scope--module-layout).
8. **Strong typing** — Prefer branded ids, `Result`/`ok`/`err`, `readonly` params/DTOs, discriminated unions. Avoid `any` and untyped bags.
9. **TSDoc on every export** — Public and module-local reusable exports get `/** … */`. Large facade APIs may use `*.docs.ts` declaration merging.
10. **Narrow public API** — Adapter packages export factories (`createXSubsystem`) + needed types, not internal layers.

## Ecosystem model

```
core-v2                    ← shared domain + application use cases + port defs
  ↑
adapter packages           ← physics, scripting, rendering, input, resources…
  ↑
composition roots          ← engine-web-v2, engine-test-harness (facades)
```

| Role | Responsibility |
|------|----------------|
| **core-v2** | Common domain (ECS, scenes, math, ids, Result), engine/scene use cases, `*Port` / `*PortDef`, subsystem factories |
| **Adapter package** | One engine concern (physics, Lua, render backend…). Own domain/application/infrastructure for that concern |
| **Composition root** | Wire ports + subsystems into a ready client; no business rules |
| **Thin adapter** | Single-file env adapters (`input-browser-v2`, etc.) may skip full layers |

Each package owns **one** responsibility in the game engine. Prefer a new package over growing an unrelated one.

## Package layers

### `domain/`

- Types, value objects, pure functions, constants of the package concern
- Package-local ports (interfaces) when the contract is owned by this package
- Organized as **modules** (folders) with kinds split into separate files — see below
- No I/O, no Three/Rapier/Wasmoon/Prisma, no React/Next, no filesystem/network
- May depend on `@duckengine/core-v2` domain types when integrating with the engine

### `application/`

- Business / use-case logic **only** — orchestration that imports domain + ports
- One use case per file (`addEntityToPhysics.ts`, `reconcileSlots.ts`)
- **Forbidden in a use-case file:** `interface`/`type` of a port, reusable domain types, pure domain helpers/constants (define those under `domain/` or `*/ports/` and import them)
- Use-case-only param/result aliases are allowed **only** if tiny and not reused elsewhere; if reused or non-trivial → move to domain (or a dedicated `application/types` only when they are use-case DTOs, not domain concepts)
- **No vendor / integration imports** — never `three`, `@dimforge/rapier3d-*`, `wasmoon`, `@prisma/client`, HTTP/SDK clients, Node `fs`, etc. Application talks to the outside world **only through ports**

### `infrastructure/`

**Only place** for vendor SDKs, I/O, and wiring. May import application + domain.

Recognize and **keep separate** these concerns (separate folders/files — do not mix in one module):

| Concern | Role | Typical location |
|---------|------|------------------|
| **Adapters** | Implement port interfaces; call use cases / domain / mappers | `infrastructure/adapters/` or `*PortImpl.ts` |
| **Composition** | Wire adapters + use cases outward (`createXSubsystem`, providers, DI roots) | `infrastructure/composition/` or top-level `createX*.ts` |
| **Integrations** | Raw talk to a lib/service (Three scene graph, Prisma queries, Rapier world, S3, HTTP) | `infrastructure/<vendor>/` or `integrations/<vendor>/` |
| **DTOs** | Shapes of the external world (Prisma rows, glTF JSON, HTTP bodies, vendor structs we own as data) | `infrastructure/dto/` or next to the integration as `*Dto.ts` |
| **Mappers / translators** | Pure-ish maps **DTO ↔ domain** (DuckEngine types). No business rules beyond field mapping | `infrastructure/mappers/` or `*Mappers.ts` (see `prismaMappers.ts`) |
| **Testing** | Integration tests | `infrastructure/testing/` |

**Rules:**
- Port **interfaces** stay in `domain/ports` (or `application/ports`) — infrastructure only **implements** them
- Adapters must not become dumping grounds: if an adapter grows Three/Prisma details, extract an integration module + mapper
- Integrations must not export DuckEngine domain types as their primary API — return DTOs or call mappers at the boundary
- Mappers must not open DB connections, touch Three objects with side effects, or embed use-case orchestration
- Composition files wire; they do not implement physics/render/SQL logic inline
- Domain objects are **imported** into infrastructure, not redefined there

Thin packages may flatten names (`physicsQueryPortImpl.ts`, `rapier/`, `createPhysicsSubsystem.ts`) but the **same separation of concerns** must remain obvious from file names.

### Optional extras (only when needed)

| Folder | When |
|--------|------|
| `presentation/` | DI facade for non-engine apps (e.g. resource-persistence API) |
| `http/` | HTTP handlers over a presentation/application API |
| `tests/integration/` | core-v2 cross-cutting integration suite |

Do **not** invent empty `src/ports/` at package root. Ports live in `domain/ports/` (engine packages) or `application/ports/` (app-style packages with many use-case ports).

## File scope & module layout

**Rule:** each file has one scope (one primary kind + one concern). Prefer many small, reusable, documented modules over grab-bags.

### Domain modules

Group by concern under `domain/<module>/` (e.g. `math/`, `slots/`, `bridges/`, `collider/`). Inside a module, **split by kind**:

| Kind | Typical files | Contains |
|------|---------------|----------|
| **types** | `types.ts`, or `foo.ts` when one type family is large | `type` / `interface` / branded aliases |
| **functions** | `vec3.ts`, `normalizePropertyValue.ts`, one concern per file | Pure functions |
| **constants** | `constants.ts`, or `fooSpecs.ts` / `fooKinds.ts` | Literals, catalogs, maps, `as const` tables |
| **ports** | `domain/ports/<name>Port.ts` (+ `*PortDef.ts` when engine-registered) | Port interfaces and defs only |

**Split further when size grows:**
- One large type family → its own file (`rigPose.ts`, not buried in `types.ts`)
- One non-trivial function (or cohesive function set) → its own file
- Do not grow a `types.ts` / `utils.ts` grab-bag past a small cohesive set

**Barrels (`index.ts`):** re-export only — no implementations, no types defined in the barrel.

**Minimal exception:** a tiny cohesive unit (e.g. branded id + its `create*` factory) may share one small file. Still document every export. Do **not** use this exception for ports or use cases.

### What must not live together

| Never colocate | Put instead |
|----------------|-------------|
| Port interface inside a use case | `domain/ports/` or `application/ports/` |
| Domain pure function inside a use case | `domain/<module>/` |
| Domain type reused by others inside a use case | `domain/<module>/types` (or dedicated type file) |
| Constants mixed into a large functions file | `constants.ts` / dedicated specs file |
| `*Port` + adapter impl in the same file | port in domain; impl in infrastructure |
| Several unrelated use cases in one file | one file per use case |
| Vendor import in `domain/` or `application/` | `infrastructure/` only |
| Adapter + raw Prisma/Three/Rapier bulk + mapping in one file | split **adapter / integration / dto / mapper** |
| Domain entity reshaped as HTTP/Prisma row inside domain | integration DTO + mapper |
| Composition inventing SQL/render/physics logic | call use cases + adapters |

### Infrastructure modules

When the package has real I/O, prefer an explicit split:

```
infrastructure/
  adapters/           # *PortImpl — fulfill ports
  composition/        # createXSubsystem, providers, DI wiring
  <vendor>/           # three | rapier | prisma | wasmoon | http | s3 …
  dto/                # external transfer shapes (optional folder)
  mappers/            # dto ↔ domain translators
  testing/
  index.ts            # re-exports public factories only
```

Smaller packages can use file prefixes instead of folders (`physicsQueryPortImpl.ts`, `prismaMappers.ts`, `rapierBodies.ts`) — same boundaries.

### Naming

- Files: camelCase matching the export (`addEntityToPhysics.ts`, `colliderResolution.ts`)
- Prefer named exports; default exports only when the package already does so for that pattern
- Every exported symbol: TSDoc stating purpose; keep modules importable without reading call sites

### Good references

```
core-v2/src/domain/math/{types,vec3,quat,index}.ts
core-v2/src/domain/components/types/… + components/constants/…
core-v2/src/domain/ports/external/{inputPort,inputPortDef}.ts
physics-rapier/src/application/{addEntityToPhysics,stepPhysics}.ts
physics-rapier/src/domain/{colliderResolution,localPose}.ts
physics-rapier/src/infrastructure/{physicsQueryPortImpl,physicsSubsystem}.ts
physics-rapier/src/infrastructure/rapier/…
resource-persistence-v2/src/infrastructure/persistence/{prismaResourcePersistence,prismaMappers}.ts
scripting-lua/src/domain/ports/scriptSandbox.ts
```

## Ports and adapters

### Inside a package

- Application depends on port **interfaces** only (no vendor types in port method signatures when avoidable — prefer domain types)
- Infrastructure **adapters** implement those interfaces
- Adapters translate at the edge: vendor/DTO → mapper → domain → use case (and back)
- Wire adapters in **composition** — not in domain, not inside unrelated integration modules

### Across the engine (core ↔ subsystems)

- Ports owned by the kernel live in `core-v2/src/domain/ports/`
- Engine-facing ports use the triad: `*Port` + `*PortDef` (`definePort`) + `*_PORT_ID`
- Register implementations via `ctx.ports.register(PortDef, impl)`, `portProviders`, or composition-root `PortDef.bind(impl)` in `api.setup({ customPorts })`
- New external packages: prefer **`createSceneSubsystem` / `createEngineSubsystem`** (flat config). Treat fluent `define*Subsystem` as legacy/internal unless extending existing fluent code

## Composition and facades

- Composition roots: `engine-web-v2` (`createWebEngineClient`), `engine-test-harness` (`createHarnessEngine`)
- Wire **new** subsystems/ports there (or a new facade package) — **never** by adding adapter imports into `core-v2`
- Facades should: construct engine, bind ports, pass subsystem factories, optionally strip `setup` / expose a smaller client type
- Keep facades free of domain rules

## Typing and TSDoc

- Reuse core branded ids (`EntityId`, `SceneId`, …) and `Result` / `ok` / `err`
- Mark DTO fields `readonly`; prefer `ReadonlyArray` / `Readonly<T>` at boundaries
- Document **every** exported symbol (factories, ports, types, functions, constants) with TSDoc so modules stay reusable without reading call sites
- Put oversized API docs in `*.docs.ts` next to the implementation when the surface is large

## Testing

| Kind | Location |
|------|----------|
| Domain/application unit | Colocated `*.test.ts` |
| Subsystem / cross-layer integration | `infrastructure/testing/*.integration.test.ts` |
| Core API / isolation | `core-v2/src/tests/integration/` |
| E2E playground | `engine-test-harness/tests/e2e/` |

Integration tests between packages are encouraged: they protect the Port/Adapter contracts.

## Agent workflow (every v2 change)

Copy and track:

```
Architecture check:
- [ ] Touches only packages/v2 (no v1)
- [ ] Correct layer for new code
- [ ] Import direction valid
- [ ] No vendor imports in domain/application
- [ ] Ports for cross-boundary deps
- [ ] Each new/changed file has one scope (no port/type/fn dump in use cases)
- [ ] Domain: module folder + types/functions/constants split as needed
- [ ] Infrastructure concerns split (adapter / composition / integration / dto / mapper)
- [ ] Exports reusable, localized, TSDoc’d
- [ ] Strong types + narrow public API
- [ ] Wired at composition root if new subsystem/port
- [ ] Tests at the right layer
```

If the change fights the layer model or file-scope rules, **stop and extract** (new domain file, port file, mapper, integration module, or package) instead of “just making it work” in the use case.

## Golden references

| Pattern | Package |
|---------|---------|
| Kernel + ports | `packages/v2/core-v2` |
| Scene subsystem adapter | `packages/v2/physics-rapier`, `packages/v2/scripting-lua` |
| Small clean package | `packages/v2/scenes-yaml-v2` |
| Web composition facade | `packages/v2/engine-web-v2` |
| App-style + presentation/http | `packages/v2/resource-persistence-v2` (exceptional shape; do not copy unless needed) |
