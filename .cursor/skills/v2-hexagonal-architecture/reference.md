# V2 Architecture Reference

Companion to [SKILL.md](SKILL.md). Read when implementing ports, reviewing deps, or matching existing packages.

## Package map (`packages/v2`)

| Package | Role |
|---------|------|
| `core-v2` | Engine kernel (domain + application use cases + port defs + API) |
| `scripting-lua` | Scene subsystem: Lua runtime |
| `physics-rapier` | Scene subsystem: Rapier physics + `PhysicsQueryPort` |
| `animation-runtime-v2` | Scene subsystem: animation tick |
| `rendering-base-v2` | Abstract render contracts + use cases |
| `rendering-three-common-v2` | Shared Three helpers |
| `rendering-three-gl-v2` / `webgpu-v2` | Backend subsystems |
| `rendering-three-v2` | Backend-selection facade |
| `resource-coordinator-v2` | Engine subsystem: load → `ResourceCachePort` |
| `resource-persistence-v2` | Server catalog/blobs (presentation + http) |
| `scenes-yaml-v2` | YAML scene load/validate |
| `diagnostic-v2` | `DiagnosticPort` adapters / log stack |
| `input-mappings-v2` | Action mappings + `BindingStoragePort` |
| `input-*-v2` / `input-storage-*-v2` | Thin env adapters |
| `importer-gltf-v2` | GLB → ECS |
| `engine-web-v2` | Web client composition facade |
| `engine-test-harness` | Playground + e2e composition |

`packages/v1/*` is legacy parallel code. Replace, do not mix.

## Dependency rules

```
infrastructure → application → domain
domain ↛ application | infrastructure
application ↛ infrastructure   (prefer always)

adapter package → @duckengine/core-v2
core-v2 ↛ any adapter package
composition root → core + adapters
```

Cross-package: depend on another package’s **public** exports only.

### Documented exceptions (do not expand casually)

1. `core-v2` `setupEngine` (application) may use default providers from infrastructure.
2. Rare domain → generated asset imports (e.g. scripting built-in schemas) — avoid new cases.
3. Tests may import infrastructure helpers.
4. `resource-persistence-v2` places ports under `application/ports/` and adds `presentation/` + `http/`.
5. Thin single-adapter packages may be flat `src/` without full layers.

## Port triad (engine ports)

Owned by core when the contract is engine-wide:

```ts
// *Port — interface
export interface PhysicsQueryPort {
  raycast(...): ...;
}

// *PortDef — definePort + method metadata (Lua bridges, registry)
export const PHYSICS_QUERY_PORT_ID = 'io:physics-query';
export const PhysicsQueryPortDef = definePort<PhysicsQueryPort>(PHYSICS_QUERY_PORT_ID)
  .addMethod('raycast')
  // ...
  .build();
```

### Registration patterns

| Context | Pattern |
|---------|---------|
| Scene subsystem | `ctx.ports.register(PortDef, impl)` in `createState` |
| Engine subsystem | `portProviders: [provideX()]` or per-scene registration when creating scene state |
| Composition root | `PortDef.bind(impl)` in `api.setup({ customPorts })` |

Package-local ports (sandbox, storage) can be plain interfaces without `*PortDef` until they must appear in the engine registry / Lua bridges.

## Subsystem factories

Prefer flat creators for **new** packages:

```ts
createSceneSubsystem({
  id: 'physics',
  createState(ctx) { /* register ports; return state */ },
  events: { ... },
  phases: { physics(ctx) { ... } },
  dispose(state) { ... },
});

createEngineSubsystem({
  id: 'resource-coordinator',
  portProviders: [provideResourceCoordinatorPorts()],
  phases: { ... },
});
```

Use cases inside subsystems often use `defineSubsystemUseCase({ name, execute })`.
Core engine/scene ops use `defineEngineUseCase` / `defineSceneUseCase` / etc.

## Typing patterns (from core)

- Branded ids: `EntityId`, `SceneId`, … via `createEntityId()` etc. (`domain/ids`)
- `Result<T>` + `ok` / `err` (`domain/utils/result`)
- `readonly` on params and option bags
- `as const` / `as const satisfies` for kind catalogs and phase lists

## TSDoc conventions in practice

- Every public function/type: block comment describing behavior
- Facades: `@example` with realistic call sequence
- Large APIs: pair `createX.ts` + `createX.docs.ts` (declaration merging)
- Prefer English for TSDoc (matches most of the codebase); ARCHITECTURE.md may be ES or EN

There is no enforced `@public` / `@internal` tag set yet — do not invent a tag system unless the user asks.

## Composition example

`packages/v2/engine-web-v2/src/createWebEngineClient.ts`:

1. Create diagnostic + input port bindings
2. `createEngine()` + `createDuckEngineAPI(engine)`
3. Build `engineSubsystems` / `sceneSubsystems` arrays
4. `api.setup({ customPorts, engineSubsystems, sceneSubsystems })`
5. Return a narrowed client (hide `setup` / `registerSubsystem` if desired)

## File organization (enforce)

Domain layout target:

```
domain/
  <module>/           # concern folder
    types.ts          # or dedicated type files when large
    constants.ts      # or *Specs.ts / *Kinds.ts
    somePureFn.ts     # one function concern per file
    index.ts          # re-exports only
  ports/
    fooPort.ts
    fooPortDef.ts     # only if engine-registered
```

Application: **one use case per file**; import ports/types/fns — never define them there; **never import vendors**.

Infrastructure layout target (concerns separated):

```
infrastructure/
  adapters/           # implements ports (*PortImpl)
  composition/        # createXSubsystem, portProviders, DI
  <vendor>/           # three | rapier | prisma | wasmoon | http | s3 …
  dto/                # external transfer objects
  mappers/            # dto ↔ domain (DuckEngine) translators
  testing/
  index.ts
```

Data flow at the edge:

```
vendor/API  →  DTO  →  mapper  →  domain  →  use case
use case    →  domain  →  mapper  →  DTO/vendor
```

Adapter orchestrates that edge; integration owns vendor calls; mapper owns field translation.

### Colocations to reject when writing new code

| Path smell | Why |
|------------|-----|
| Port `interface` inside `application/*.ts` use case | Ports belong in `*/ports/` |
| Pure helper defined next to `execute` / use case | Move to `domain/<module>/` |
| `import … from 'three'` (or prisma/rapier/…) in domain/application | Vendor only in infrastructure |
| Growing `types.ts` / `utils.ts` grab-bags | Split by type family / function |
| Port-like handle buried in domain `types.ts` | Own `*Port.ts` (or clear handle module) |
| Adapter file with SQL + mapping + use-case wiring | Split adapter / integration / mapper / composition |
| Domain type used as Prisma/HTTP wire shape | Dedicated DTO + mapper |
| Implementations in `index.ts` barrels | Re-export only |
| Several use cases in one application file | Split files |

Existing mild colocations (do not copy): `scripting-lua/.../bridges/types.ts` mixing bridge DTOs with port maps; large `core-v2/.../subsystems/types.ts` grab-bag; `physics-rapier` world handle next to config in `domain/types.ts`.

**Good infra split to copy:** `resource-persistence-v2/.../persistence/prismaResourcePersistence.ts` + `prismaMappers.ts`; `physics-rapier/.../physicsQueryPortImpl.ts` + `rapier/*` + `physicsSubsystem.ts`.

## Anti-patterns (reject in review)

| Anti-pattern | Do instead |
|--------------|------------|
| Port / domain type / pure fn inside a use case | Extract to `domain/` or `*/ports/` |
| Three/Prisma/Rapier/Wasmoon/HTTP in application | Port + infrastructure adapter/integration |
| Business rules in `createWebEngineClient` | Move to application use case / subsystem |
| Domain file importing Three/Rapier/Prisma | Port + infrastructure adapter |
| Application importing concrete adapter | Depend on port interface |
| Mixing DTO fields into domain entities | DTO file + mapper |
| Mapper with DB/network side effects | Keep mapper translational; I/O in integration |
| Composition embedding vendor algorithms | Call use cases / adapters / integrations |
| core importing physics/scripting/render | Register from composition root |
| Mixing `@duckengine/core` (v1) into v2 | Use `@duckengine/core-v2` |
| Dumping new code in wrong package | New package or correct owner |
| Exporting entire `src/**` from index | Export factory + public types |
| Empty root `src/ports/` | `domain/ports` or `application/ports` |
| New fluent `define*Subsystem` for externals | `create*Subsystem` |
| Copying `presentation/` everywhere | Only for app/DI facades like persistence |
| Untyped `Record<string, any>` at boundaries | Branded ids, unions, Result |
| Undocumented reusable export | Add TSDoc before merge |

## Docs to update when architecture changes

Non-trivial packages should keep `ARCHITECTURE.md` (4+1 style used by core/scripting).
Subsystem topology notes: `packages/v2/core-v2/docs/SUBSYSTEMS_ARCHITECTURE.md`.

Note: some older docs say `portDerivers`; code uses **`portProviders`** — follow the code.
