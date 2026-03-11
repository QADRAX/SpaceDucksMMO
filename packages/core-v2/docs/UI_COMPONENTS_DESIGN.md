# Diseño: Componentes UI a nivel de escena

## Objetivo

Diseñar un mecanismo para soportar componentes de tipo UI en el game engine que:

- Operen a **nivel de escena** con soporte para **múltiples viewports**
- Requieran un **adapter** implementado por el cliente (no implementación simplista)
- Permitan **SPAs completas** (React, Preact, Vue, etc.) — no componentes triviales
- Sean **agnósticos de framework** — el engine no conoce React/DOM

---

## Principios de diseño

1. **El engine no renderiza UI** — solo declara *qué* UI debe mostrarse y *dónde*
2. **Adapter obligatorio** — el cliente implementa el port; sin adapter, no hay UI
3. **Descriptor opaco** — el engine almacena un payload que el adapter interpreta
4. **Viewport-aware** — cada slot puede vincularse a viewport(s) específico(s)

---

## Conceptos clave

### 1. UI Slot (ranura de UI)

Un **UI Slot** es una región declarativa que el engine gestiona. Contiene:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `slotId` | `UISlotId` | Identificador único |
| `sceneId` | `SceneId` | Escena a la que pertenece |
| `viewportId` | `ViewportId \| null` | `null` = todos los viewports de la escena |
| `rect` | `ViewportRect` | Región normalizada (0–1) dentro del viewport |
| `zIndex` | `number` | Orden de apilamiento (mayor = encima) |
| `enabled` | `boolean` | Si está activo |
| `descriptor` | `unknown` | Payload opaco para el adapter |

El **descriptor** es la clave: el engine no lo interpreta. El adapter decide su forma, por ejemplo:

```ts
// Ejemplo: adapter React
{ appUrl: '/ui/hud.js', props: { sceneId, viewportId } }

// Ejemplo: adapter con registro de componentes
{ componentId: 'GameHUD', props: { ... } }

// Ejemplo: SPA remota
{ entryUrl: 'https://cdn.example.com/hud-app/index.html', config: {...} }
```

### 2. UIRendererPort (contrato del adapter)

El engine define el **port**; el cliente lo implementa:

```ts
interface UIRendererPort {
  /**
   * Monta una UI en el contenedor dado.
   * El adapter crea/monta la SPA (React, Preact, etc.) en container.
   */
  mount(slot: UISlotView, container: HTMLElement): void | Promise<void>;

  /**
   * Desmonta la UI del slot.
   */
  unmount(slotId: UISlotId): void | Promise<void>;

  /**
   * Actualiza parámetros del slot (rect, zIndex, enabled).
   * Opcional: el adapter puede re-montar si no soporta update.
   */
  updateSlot?(slotId: UISlotId, params: Partial<UISlotView>): void | Promise<void>;
}
```

El engine **no** crea el `HTMLElement` container. Eso lo hace la infraestructura (p. ej. el renderer Three.js que crea un overlay div por viewport). El engine solo invoca al adapter con el slot y el container que le pasa otro port o la infraestructura.

### 3. ViewportOverlayProviderPort (opcional)

Para desacoplar quién provee el container:

```ts
interface ViewportOverlayProviderPort {
  /**
   * Obtiene el contenedor DOM donde montar UI para un viewport.
   * La infraestructura (p. ej. renderer) crea un div overlay por canvas.
   */
  getOverlayContainer(viewportId: ViewportId): HTMLElement | null;
}
```

El **UISubsystem** usa ambos: `ViewportOverlayProviderPort` para el container y `UIRendererPort` para montar. Si no hay `ViewportOverlayProviderPort`, el adapter podría recibir el viewport y resolver el container internamente (menos flexible).

---

## Flujo de datos

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ENGINE (core-v2)                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  SceneState                                                              │
│    uiSlots: Map<UISlotId, UISlotState>                                   │
│                                                                          │
│  Eventos: ui-slot-added | ui-slot-removed | ui-slot-updated               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ UISubsystem (EngineSubsystem o SceneSubsystem)
                                    │ - Escucha cambios en uiSlots
                                    │ - Obtiene UIRendererPort del registry
                                    │ - Obtiene container de ViewportOverlayProviderPort
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         PORTS (inyectados por cliente)                   │
├─────────────────────────────────────────────────────────────────────────┤
│  UIRendererPort         → mount(slot, container) / unmount(slotId)        │
│  ViewportOverlayProviderPort → getOverlayContainer(viewportId)            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Cliente implementa
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    CLIENTE (app final, infraestructura)                  │
├─────────────────────────────────────────────────────────────────────────┤
│  - Crea overlay div por canvas/viewport                                  │
│  - Implementa UIRendererPort:                                             │
│      mount() → ReactDOM.createRoot(container).render(<HUD {...} />)      │
│      unmount() → root.unmount()                                           │
│  - El descriptor indica qué SPA montar (URL, componentId, etc.)          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Dónde viven los UI Slots

**Opción A: En SceneState** (recomendada)

- Los slots son por escena
- Al hacer teardown de la escena, se desmontan todos
- Coherente con `SceneSubsystem` y eventos de escena

**Opción B: En EngineState**

- Slots globales (menú, configuración)
- Menos natural para UI de gameplay por escena

**Recomendación:** Slots en `SceneState`. Para UI global, una escena "system" o un slot con `sceneId` especial.

---

## API de use cases

```ts
// Añadir slot a la escena
addUISlot(sceneId, {
  slotId: createUISlotId('hud-main'),
  viewportId: createViewportId('game-view') ?? null,
  rect: { x: 0, y: 0, w: 1, h: 0.15 },
  zIndex: 10,
  descriptor: { componentId: 'GameHUD', props: {} },
});

// Remover slot
removeUISlot(sceneId, slotId);

// Actualizar slot (rect, enabled, descriptor)
updateUISlot(sceneId, slotId, { rect: { x: 0, y: 0, w: 0.5, h: 0.2 } });
```

---

## Contexto para las SPAs

Las SPAs montadas necesitan acceso al estado del engine (escena, viewport, entidades). Opciones:

1. **Props inyectadas** — el adapter pasa `{ sceneView, viewportView, engine }` al montar
2. **Context provider** — el adapter envuelve la SPA en un provider que expone el API
3. **Custom event / message channel** — la SPA se suscribe a eventos del engine

El adapter puede usar el `createDuckEngineAPI(engine)` para obtener el API y pasarlo a la SPA. El descriptor podría incluir qué "contexto" necesita la UI.

---

## Multi-viewport

Un slot con `viewportId: null` significa "todos los viewports de esta escena". El UISubsystem:

- Para cada viewport que renderiza la escena
- Obtiene el overlay container de ese viewport
- Llama a `mount(slot, container)` — el adapter puede montar la misma SPA en múltiples containers (cada viewport tiene su instancia)

Para slots con `viewportId` específico, solo se monta en ese viewport.

---

## Integración con scripting (Lua)

### Flujo de integración

El scripting usa **bridges** que exponen APIs a Lua. El `sceneBridge` recibe `scene` (SceneState), `ports` (BridgePorts) y construye el objeto que los scripts ven como `Scene`.

Para UI slots hay dos opciones:

**Opción A: Port `UISlotOperations`** (recomendada)

1. Añadir `uiSlotOperations` a `BridgePorts` en scripting-lua
2. Registrar el port en el engine (implementación que llama a los use cases)
3. El sceneBridge delega a `ports.uiSlotOperations?.addUISlot(scene.id, params)`

**Opción B: Callback en session**

El session podría recibir `addUISlot` como callback inyectado. Menos limpio que un port.

### Implementación con Port

```ts
// domain/ports/uiSlotOperationsPort.ts (core-v2)
export interface UISlotOperationsPort {
  addUISlot(sceneId: SceneId, params: AddUISlotParams): Result<void>;
  removeUISlot(sceneId: SceneId, slotId: UISlotId): Result<void>;
  updateUISlot(sceneId: SceneId, slotId: UISlotId, params: Partial<UISlotParams>): Result<void>;
}
```

```ts
// scripting-lua: BridgePorts
export interface BridgePorts {
  physicsQuery?: ...;
  gizmo?: ...;
  input?: ...;
  uiSlotOperations?: UISlotOperationsPort;  // nuevo
}

// SCRIPTING_BRIDGE_PORT_KEYS
uiSlotOperations: 'io:ui-slot-operations',
```

```ts
// sceneBridge.ts - añadir al objeto retornado
addUISlot(params: { slotId: string; viewportId?: string; rect: {...}; descriptor: unknown }) {
  return ports.uiSlotOperations?.addUISlot(scene.id, params);
},
removeUISlot(slotId: string) {
  return ports.uiSlotOperations?.removeUISlot(scene.id, slotId);
},
updateUISlot(slotId: string, params: Partial<...>) {
  return ports.uiSlotOperations?.updateUISlot(scene.id, slotId, params);
},
```

```ts
// Cliente: implementación del port (tiene engine)
const uiSlotOperationsPort = {
  addUISlot: (sceneId, params) => api.scene(sceneId).addUISlot(params),
  removeUISlot: (sceneId, slotId) => api.scene(sceneId).removeUISlot({ slotId }),
  updateUISlot: (sceneId, slotId, params) => api.scene(sceneId).updateUISlot({ slotId, ...params }),
};
// Registrar en portDeriver o setupEngine
```

### Uso desde Lua

```lua
-- En init() o cualquier hook de un script
Scene.addUISlot({
  slotId = "hud-main",
  viewportId = nil,  -- nil = todos los viewports de la escena
  rect = { x = 0, y = 0, w = 1, h = 0.15 },
  zIndex = 10,
  descriptor = { componentId = "GameHUD", props = {} }
})

-- Más tarde, actualizar o remover
Scene.updateUISlot("hud-main", { rect = { x = 0, y = 0, w = 0.5, h = 0.2 } })
Scene.removeUISlot("hud-main")
```

### Tipos Lua (scene.d.lua)

```lua
---Añade un slot de UI a la escena actual.
---@param params { slotId: string, viewportId?: string, rect: { x: number, y: number, w: number, h: number }, zIndex?: number, descriptor: table }
function Scene.addUISlot(params) end

---Remueve un slot de UI.
---@param slotId string
function Scene.removeUISlot(slotId) end

---Actualiza un slot existente.
---@param slotId string
---@param params { rect?: table, zIndex?: number, enabled?: boolean, descriptor?: table }
function Scene.updateUISlot(slotId, params) end
```

### Notas

- El bridge tiene `scene` en su factory, así que conoce `scene.id` y no necesita que el script pase el sceneId
- Si `uiSlotOperations` no está registrado (cliente sin UI), las llamadas son no-ops o retornan error controlado
- Los scripts pueden añadir slots en `init()`, `earlyUpdate()`, o en respuesta a eventos (`onEvent`)

---

## Eventos: UI ↔ Engine ↔ Scripting

### Canal unificado: ScriptEventBus

El scripting ya usa un **ScriptEventBus** (in-frame): `fire(name, data)` encola eventos y `flush()` los entrega a los suscriptores tras `earlyUpdate`. Es el canal natural para comunicación entre UI, engine y scripting.

```
┌─────────────┐     fire()      ┌──────────────────┐     flush()      ┌─────────────┐
│   Scripting │ ──────────────► │  ScriptEventBus  │ ──────────────► │     UI      │
│  (Lua)      │                 │  (por escena)    │                 │  (React)    │
└─────────────┘                 └──────────────────┘                 └─────────────┘
       ▲                                ▲                                    │
       │                                │                                    │
       │         on(slotId, name, cb)   │         fire(name, data)            │
       └────────────────────────────────┴────────────────────────────────────┘
```

### Flujos de eventos

| Origen | Destino | Cómo |
|--------|---------|------|
| **Scripting → UI** | Script llama `Scene.fireEvent("ShowHealthBar", { value: 80 })` | `eventBus.fire()` → `flush()` → UI suscrita recibe |
| **UI → Scripting** | Usuario hace click, UI llama `emitEvent("InventoryClosed", {})` | Adapter llama `eventBus.fire()` → `flush()` → scripts con `onEvent` reciben |
| **Engine → UI** | Subsystem emite evento de dominio | Mismo bus o `SceneChangeEvent` (canal distinto) |

### SceneEventBusProviderPort

Para que la UI acceda al bus, se usa un port que el **scripting subsystem** registra al hacer setup de la escena:

```ts
// domain/ports/sceneEventBusProviderPort.ts
export interface SceneEventBusProviderPort {
  /** Registra el event bus de una escena (scripting subsystem lo llama en scene-setup). */
  registerSceneBus(sceneId: SceneId, bus: ScriptEventBus): void;
  /** Desregistra al teardown. */
  unregisterSceneBus(sceneId: SceneId): void;
  /** Obtiene el bus para una escena (UI adapter lo usa al montar). */
  getEventBus(sceneId: SceneId): ScriptEventBus | undefined;
}
```

- **Scripting subsystem**: en `scene-setup` llama `registerSceneBus(scene.id, eventBus)`, en `dispose` llama `unregisterSceneBus`.
- **UI adapter**: al montar un slot, llama `getEventBus(slot.sceneId)` y pasa `emit`/`subscribe` a la SPA.

### Qué recibe la SPA montada

El adapter inyecta un **UIContext** en la SPA:

```ts
interface UIContext {
  /** Emitir evento (llega a scripting y otros suscriptores). */
  emit(eventName: string, payload?: Record<string, unknown>): void;
  /** Suscribirse a eventos (scripting, engine, otras UIs). */
  subscribe(eventName: string, callback: (data: Record<string, unknown>) => void): () => void;
  /** API del engine (opcional, para queries). */
  api?: DuckEngineAPI;
  /** Vista de escena/viewport actual. */
  sceneView?: SceneView;
  viewportView?: ViewportView;
}
```

### Ejemplo: UI → Scripting

```tsx
// Componente React
function InventoryPanel({ emit }: { emit: (name: string, data?: object) => void }) {
  const handleClose = () => emit('InventoryClosed', {});
  return <button onClick={handleClose}>Cerrar</button>;
}
```

```lua
-- Script Lua
Scene.onEvent(self, "InventoryClosed", function(data)
  -- Reaccionar al cierre del inventario
  self.inventoryOpen = false
end)
```

### Ejemplo: Scripting → UI

```lua
-- Script Lua: notificar cambio de vida
Scene.fireEvent("HealthChanged", { entityId = self.id, value = 75 })
```

```tsx
// Componente React
function HealthBar({ subscribe }: { subscribe: (name: string, cb: (d: any) => void) => () => void }) {
  const [health, setHealth] = useState(100);
  useEffect(() => {
    return subscribe('HealthChanged', (data) => setHealth(data.value));
  }, [subscribe]);
  return <div>{health}%</div>;
}
```

### Convención de nombres

Para evitar colisiones, se recomienda un prefijo por dominio:

| Prefijo | Origen | Ejemplo |
|---------|--------|---------|
| `ui:` | UI emite | `ui:InventoryClosed`, `ui:ButtonClicked` |
| (sin prefijo) | Scripting/Engine | `HealthChanged`, `PlayerDied` |

La UI puede suscribirse a ambos; los scripts suelen usar nombres sin prefijo.

### Engine → UI (estado de escena)

Para cambios estructurales (entidades, componentes), la UI puede usar:

1. **SceneChangeEvent** — `api.scene(id).subscribe(listener)` para `entity-added`, `component-changed`, etc.
2. **Eventos de dominio en el bus** — subsystems que emiten `EntityDamaged`, `ScoreUpdated` al ScriptEventBus para que la UI reaccione sin polling.

### Resumen de integración de eventos

| Componente | Cómo emite | Cómo recibe |
|------------|------------|-------------|
| **Scripting** | `Scene.fireEvent(name, data)` → `eventBus.fire()` | `Scene.onEvent(self, name, cb)` → `eventBus.on()` |
| **UI** | `emit(name, data)` inyectado → `eventBus.fire()` | `subscribe(name, cb)` inyectado → `eventBus.on()` |
| **Engine/subsystems** | Opcional: inyectar `eventBus` y llamar `fire()` | N/A (o suscripción a SceneChange) |

### Wiring en scripting-lua

El scripting subsystem debe registrar su event bus al recibir `scene-setup`:

```ts
// En handleSceneEvent del scripting subsystem
if (event.kind === 'scene-setup') {
  const provider = ports.get(SceneEventBusProviderPortDef);
  provider?.registerSceneBus(scene.id, session.eventBus);
}
// En dispose
provider?.unregisterSceneBus(scene.id);
```

El cliente registra la implementación del port (con un `Map<SceneId, ScriptEventBus>`) en el engine setup.

---

## Resumen de archivos a crear/modificar

| Ubicación | Acción |
|-----------|--------|
| `domain/ids/ids.ts` | Añadir `UISlotId`, `createUISlotId` |
| `domain/ui/types.ts` | Nuevo: `UISlotState`, `UISlotView`, `UISlotDescriptor` |
| `domain/ports/uiRendererPort.ts` | Nuevo: interface + PortDef |
| `domain/ports/viewportOverlayProviderPort.ts` | Nuevo: interface + PortDef (opcional) |
| `domain/ports/sceneEventBusProviderPort.ts` | Nuevo: interface + PortDef (eventos UI↔scripting) |
| `domain/ports/enginePorts.ts` | Añadir `uiRenderer`, `viewportOverlayProvider` |
| `domain/scene/types.ts` | Añadir `uiSlots` a SceneState, eventos |
| `domain/subsystems/` | UISubsystem (EngineSubsystem que reacciona a slots) |
| `application/scene/addUISlot.ts` | Use case |
| `application/scene/removeUISlot.ts` | Use case |
| `application/scene/updateUISlot.ts` | Use case |

---

## Ejemplo de adapter (cliente)

```ts
// En el cliente (p. ej. packages/game-client)
const uiRendererAdapter = definePortImplementation<UIAdapterState, UIRendererPort>(UIRendererPortDef)
  .withState(() => ({ roots: new Map() }))
  .withMethod('mount', (state, [slot, container]) => {
    const descriptor = slot.descriptor as { componentId: string; props?: object };
    const root = createRoot(container);
    root.render(
      <EngineProvider api={createDuckEngineAPI(engine)}>
        <ComponentRegistry id={descriptor.componentId} {...descriptor.props} />
      </EngineProvider>
    );
    state.roots.set(slot.slotId, root);
  })
  .withMethod('unmount', (state, [slotId]) => {
    const root = state.roots.get(slotId);
    if (root) {
      root.unmount();
      state.roots.delete(slotId);
    }
  })
  .build(engine);

// En setupEngine
setupEngine(engine, {
  ports: {
    uiRenderer: uiRendererAdapter,
    viewportOverlayProvider: myOverlayProvider,
  },
});
```

---

## Conclusión

Este diseño:

- Mantiene el engine **agnóstico** de React/DOM
- Exige un **adapter** por parte del cliente
- Permite **SPAs completas** con cualquier framework
- Encaja con **viewports** y **escenas** existentes
- Sigue el patrón de **ports** ya usado (ResourceLoader, Diagnostic)
- Es extensible vía **descriptor opaco**
