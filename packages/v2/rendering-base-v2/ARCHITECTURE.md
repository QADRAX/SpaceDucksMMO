# Rendering Packages Architecture

Patrón app/domain/infra alineado con resource-coordinator, scripting-lua y physics-rapier.

---

## Estructura por package

### rendering-base-v2

Base abstracta. Define contratos y use cases genéricos.

| Capa | Contenido |
|------|-----------|
| **domain** | `RenderFeature`, `RenderContextBase`, `RenderEngineState` |
| **application** | `syncRender`, `renderFrame`, `disposeRender`, `reconcilePendingRenderablesForKey` |
| **infra** | — (no hay createSubsystem; lo implementan gl/webgpu) |

**Use cases:**
- `syncRender` — preRender: sync ECS → render tree
- `renderFrame` — render: dibujar viewports
- `disposeRender` — dispose: liberar recursos
- `reconcilePendingRenderablesForKey` — resource-loaded: re-sync cuando carga mesh/texture/skybox

---

### rendering-three-common-v2

Librería compartida Three.js. No tiene subsystem propio.

| Capa | Contenido |
|------|-----------|
| **domain** | features, helpers, `syncSceneToRenderTree`, `createDefaultRenderFeatures`, registry, resolvers |
| **application** | — (vacío; lógica en domain) |
| **infra** | `createTextureResolversFromRawCache` |

---

### rendering-three-gl-v2 / rendering-three-webgpu-v2

Engine subsystem. Export principal: `createRenderingSubsystem`.

| Capa | Contenido |
|------|-----------|
| **domain** | — (usa common + base) |
| **application** | — (use cases en base) |
| **infra** | `createRenderingSubsystem`, `createRenderingState` |

**Exports:** `createRenderingSubsystem`, `createRenderingState`

---

## Dependencias

```
rendering-base-v2          (core-v2)
       ↑
rendering-three-common-v2  (base-v2, core-v2)
       ↑
rendering-three-gl-v2     (base-v2, common-v2, core-v2)
rendering-three-webgpu-v2 (base-v2, common-v2, core-v2)
```
