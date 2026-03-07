# @duckengine/rendering-base

Base package for Duck Engine rendering system. Provides domain abstractions, application orchestration, and shared infrastructure for concrete rendering implementations (WebGPU, WebGL, etc).

## Architecture

Follows Clean Architecture with explicit layers:

### Domain (70%)
- **Ports**: Core interfaces defining rendering contracts (`IRenderingEngine`, `IRenderSyncSystem`, `IRenderFeature`, etc)
- **Entities**: Value objects for rendering concepts (`RenderObject`, `RenderPass`, `TextureSpec`)
- **Types**: Shared type definitions (`RenderContext`, `RenderHooks`)
- **Exceptions**: Domain-level errors

### Application (25%)
- **Coordinators**: Orchestrates domain operations (`RenderFeatureRouter`, `RenderSyncOrchestrator`, `LoadingCoordinator`)
- **Use Cases**: Defines rendering flows
- **DTOs**: Data transfer objects for requests/responses

### Infrastructure (5%)
- **Resources**: Engine resource resolution
- **Graphics/Loaders**: Shared asset loaders (glTF, geometry)
- **UI**: Default UI implementations (loading overlays)

## Usage

```typescript
import { IRenderingEngine, RenderContext } from '@duckengine/rendering-base';
import { RenderFeatureRouter, RenderSyncOrchestrator } from '@duckengine/rendering-base/application';

// Use ports from domain
const renderer: IRenderingEngine = // ... create from concrete implementation
const syncSystem: IRenderSyncSystem = // ... create from concrete implementation
```

## Dependencies

- `@duckengine/core` - Core engine abstractions

## Exports

- **Default**: Domain ports, exceptions, and application coordinators
- **./domain**: Domain-layer exports only
- **./application**: Application-layer exports only
