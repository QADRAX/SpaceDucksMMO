# ViewportRectProviderPort — dónde se implementa

El **ViewportRectProviderPort** es el puerto que proporciona las dimensiones (rect) de cada viewport para el rendering. El engine no conoce el layout; el consumidor lo implementa.

## Implementación por defecto

- **`createDefaultViewportRectProvider()`** — `@duckengine/core-v2`
  - Ruta: `packages/v2/core-v2/src/domain/viewport/createDefaultViewportRectProvider.ts`
  - Implementación in-memory: `getRect(id)` y `setRect(id, rect)`
  - Rect normalizado: `{ x, y, w, h }` en rango 0–1 (ej. `FULL_RECT = { x:0, y:0, w:1, h:1 }`)

## Flujo en el harness

1. **createHarnessEngine** crea el engine y usa `createDefaultViewportRectProvider()` si no se pasa uno.
2. **initHarnessScene** llama a `api.addViewport()` y luego `viewportRectProvider.setRect(viewportId, FULL_RECT)` para dar dimensiones al viewport.
3. **Rendering** (renderViewports en `rendering-three-common-v2`) usa `ViewportRectProviderPortDef` para obtener el rect y `computeViewportScissor()` convierte el rect normalizado a píxeles del canvas.

## Dónde se usa

| Componente | Uso |
|------------|-----|
| `createHarnessEngine` | Pasa viewportRectProvider al rendering subsystem |
| `createHarnessApp` / `initHarnessScene` | Llama `setRect` tras `addViewport` |
| `createWebEngineClient` | Igual: viewportRectProvider opcional, default in-memory |
| `renderViewports.ts` | Obtiene rect vía `ViewportRectProviderPortDef.id` |
| `addViewport.ts` | Si se pasa `rect` en params, lo aplica al port |

## Para apps reales

En una app web o Electron, implementa tu propio `ViewportRectProviderPort` que:
- `getRect(id)`: devuelve el rect actual según tu layout (ResizeObserver, etc.)
- `setRect(id, rect)`: actualiza el rect cuando cambia el layout

El engine solo pide el rect cuando renderiza; tú decides de dónde viene.
