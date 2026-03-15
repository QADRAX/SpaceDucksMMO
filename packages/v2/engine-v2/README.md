# @duckengine/engine-v2

Fachada del engine que compone todos los subsistemas v2 en un único punto de entrada.

## Uso

```ts
import { createDuckEngine } from '@duckengine/engine-v2';
import { createSceneId, createEntityId, createEntity } from '@duckengine/core-v2';

const api = await createDuckEngine({
  resourceLoader: myResourceLoader,
  viewportRectProvider: myViewportRectProvider, // opcional
});

api.setup({});
api.addScene({ sceneId: createSceneId('main') });
api.scene(createSceneId('main')).setupScene({});
```

## Subsistemas incluidos

- **engine:** resource-coordinator, rendering-three-webgpu
- **scene:** physics-rapier, scripting-lua

## Opciones

- `resourceLoader`: Requerido. Resuelve y carga recursos (mesh, texture, skybox, script).
- `viewportRectProvider`: Opcional. Por defecto usa un provider en memoria.
- `input`, `gizmo`, `diagnostic`: Opcionales. Por defecto no-op.
- `subsystems`: `{ resourceCoordinator?, physics?, rendering?, scripting? }` — por defecto todos.
- `customPorts`: Ports adicionales para inyección.
