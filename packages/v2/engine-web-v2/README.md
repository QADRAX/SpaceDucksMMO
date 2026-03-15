# @duckengine/engine-web-v2

Fachada web del engine para apps en el navegador. Cliente listo para usar.

**No expone** `setup` ni `registerSubsystem` — el setup se ejecuta internamente. Incluye `logStack` para inspección de logs.

## Uso

```ts
import { createWebEngineClient } from '@duckengine/engine-web-v2';
import { createSceneId } from '@duckengine/core-v2';

const client = await createWebEngineClient({
  resourceLoader: myWebLoader,
  viewportRectProvider: myLayoutProvider, // opcional
  sinks: [(e) => console.log(`[${e.level}]`, e.message)], // opcional, default: console
});

client.addScene({ sceneId: createSceneId('main') });
client.scene(createSceneId('main')).setupScene({});
client.update({});
const entries = client.logStack.getEntries();
```

## Opciones

- `resourceLoader`: Requerido.
- `viewportRectProvider`: Opcional.
- `input`: Opcional. Default: no-op.
- `sinks`: Opcional. LogSink[] para redirigir logs. Default: [createConsoleSink()].
- `customPorts`: Opcional.

## Subsistemas (fijos)

- **engine:** resource-coordinator, rendering-three (WebGPU/WebGL auto)
- **scene:** physics-rapier, scripting-lua
