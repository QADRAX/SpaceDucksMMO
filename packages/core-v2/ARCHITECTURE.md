# @duckengine/core-v2 Architecture Guide

This document defines the architectural structure, design principles, and guidelines for developing features inside `@duckengine/core-v2`. This package adheres strictly to **Clean Architecture**, separating the application layer, domain layer, and infrastructure integrations.

## Layer Overview

### 1. Application Layer (`src/application/`)
**Purpose**: Orchestrates and coordinates the business logic. Contains **only Use Cases**.
- **Rules**:
  - No pure generic functions, types, or interfaces should be declared here. They must be imported from the Domain layer.
  - Use cases interact with domain models (like `SceneState` or `EntityState`) but don't d  - A use case represents a specific, actionable scenario (e.g., `addEntityToScene`, `updateEngine`).
efine them.
  - No state mutation without going through domain pure functions.
  
### 2. Domain Layer (`src/domain/`)
**Purpose**: Contains the core logic, domain types, and pure rules of the engine.
- **Rules**:
  - **Zero external dependencies**: The domain layer knows nothing about the outside world.
  - **No side effects**: Functions here must be pure. They either compute a value or mutate state strictly passed to them as arguments (e.g., `addComponent(entity, comp)`).
  - **Ports (`domain/ports/`)**: Defines interfaces that the infrastructure layer will implement. This is dependency inversion.

#### Domain Folder Structure (Feature-Sliced)
The domain is organized into **Feature Modules** (e.g., `ecs`, `scene`, `engine`, `math`). 
To maintain a strict separation between data shapes and logic, each module follows this structural rule:

```text
src/domain/ecs/
    ├── types.ts              # ALL interfaces, state shapes, and types for this module.
    ├── entity.ts             # Pure logic operating on entities.
    ├── transform.ts          # Pure logic operating on transforms.
    └── index.ts              # Barrel re-exporting: export * from './types'; export * from './entity';
```

**Scaling Rule (The 200-Line Limit)**
If a module's `types.ts` grows beyond ~200 lines, it must be split into a `types/` subfolder according to the `CODESTYLE.md`:
```text
src/domain/ecs/
    ├── types/                 # Replaces types.ts when types > 200 lines
    │   ├── entityState.ts     # Just the types for Entity
    │   ├── transformState.ts  # Just the types for Transform
    │   └── index.ts           # Barrel re-exporting all types
    ├── entity.ts              # Pure logic
    ├── transform.ts           # Pure logic
    └── index.ts               # Exposes: export * from './types'; export * from './entity';
```
This guarantees that **Types** and **Pure Logic** never mix within the same file, while preventing massive monolithic type files and respecting the package's line-count limits.


### 3. Infrastructure Layer (`src/infrastructure/`)
**Purpose**: Implements the Domain Ports using external libraries, tools, or browser APIs.
- **Rules**:
  - Code here acts as adapters. It handles impure operations (rendering to a screen, calculating physics with an external library).
  - Infrastructure depends on Domain, but never vice versa.

## Feature Development Flow
1. **Define the Types**: Start by modeling your state and interfaces in `domain/types/`.
2. **Implement Pure Logic**: Write the core functionality in `domain/[feature]/` as pure functions, alongside unit tests.
3. **Define Use Cases**: If the feature exposes an action to the consumer, create an Application Use Case (`application/[feature]/myUseCase.ts`) that orchestrates the domain functions.
4. **Implement Adapters**: If the feature requires external interaction (e.g., scripting, rendering), define a Port in `domain/ports/` and implement the adapter in `src/infrastructure/`.

## Maintaining Modularity
- Follow the `CODESTYLE.md`.
- Keep the boundary between Domain and Application strict.
- When creating a new domain entity, physically separate its **State/Interface** (into `domain/types/`) from its **Pure Functions** (into the feature folder).
