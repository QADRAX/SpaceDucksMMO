# Arquitectura de subsistemas v2

Análisis de la composición de subsistemas, tipos y consistencia en los paquetes v2.

---

## 1. Tipos de subsistemas

| Tipo | Alcance | Cuándo se instancia | Ejemplo |
|------|---------|---------------------|---------|
| **SceneSubsystem** | Por escena | Una instancia por escena al añadirla al engine | Physics, Scripting |
| **EngineSubsystem** | Global | Una instancia para todo el engine | Rendering, ResourceCoordinator |

---

## 2. create vs define

### Scene subsystems

| API | Estilo | Uso actual |
|-----|--------|------------|
| **createSceneSubsystem** | Config plano `{ id, createState, events, engineEvents, phases, dispose }` | Physics, Scripting |
| **defineSceneSubsystem** | Builder fluido `.withPorts().withState().onEvent().build()` | UI (core interno) |

**Recomendación:** Usar `createSceneSubsystem` para paquetes externos (physics, scripting). Es más declarativo y evita anidación.

### Engine subsystems

| API | Estilo | Uso actual |
|-----|--------|------------|
| **createEngineSubsystem** | Config plano `{ id, createState, engineEvents, sceneEvents, phases, portProviders, dispose }` | Rendering, ResourceCoordinator |
| **defineEngineSubsystem** | Builder fluido `.withState().onPreRender().onRender().build()` | — (legacy) |

**Recomendación:** Usar `createEngineSubsystem` para consistencia con scene subsystems.

---

## 3. Registro de ports

### Physics (scene subsystem)

```ts
// physicsSubsystem.ts
createState(ctx) {
  const state = createPhysicsWorldState(...);
  const impl = createPhysicsQueryPortImpl(state);
  ctx.ports.register(PhysicsQueryPortDef, impl);  // ← directo en ctx
  return state;
}
```

- `ctx.ports` = merged registry (scene + engine)
- `ctx.ports.register` escribe en **scene.scenePorts**
- El port queda disponible para scripting en esa escena

### Rendering (engine subsystem)

```ts
// createGizmoScenePortRegistration.ts (rendering-three-common-v2)
const onSceneStateCreated = (scene, state) => {
  const drawer = createGizmoDrawer(state.threeScene);
  scene.scenePorts.set(GizmoPortDef.id, drawer);           // ← directo en scene
  scene.scenePortDefinitions.set(GizmoPortDef.id, GizmoPortDef);
  drawerCache.set(scene.id, drawer);
};
```

- El rendering es **engine-level**: no tiene `ctx` con scene cuando corre
- Crea estado por escena internamente en `createPerSceneStateManager`
- Cuando crea estado, llama `onSceneStateCreated(scene, state)`
- Registra en `scene.scenePorts` directamente (mismo destino que `ctx.ports.register`)

**Equivalencia:** `ctx.ports.register(def, impl)` en scene subsystem ≈ `scene.scenePorts.set(def.id, impl)` en engine subsystem cuando crea estado por escena.

---

## 4. Uso actual por paquete

| Paquete | Tipo | API | Ports |
|---------|------|-----|-------|
| physics-rapier | Scene | createSceneSubsystem | PhysicsQueryPort en createState |
| scripting-lua | Scene | createSceneSubsystem | Consume ports, no registra |
| rendering-three-* | Engine | defineEngineSubsystem | GizmoPort vía onSceneStateCreated, ViewportRectProvider vía portProvider |
| resource-coordinator-v2 | Engine | defineEngineSubsystem | ResourceCachePort vía portProvider |

---

## 5. Use cases

Todos los use cases siguen el patrón:

```ts
defineSubsystemUseCase<State, Params, Output>({
  name: 'subsystem/action',
  execute(state, params) { ... }
})
```

**Params por contexto:**

| Contexto | Params |
|----------|--------|
| Scene event | `SubsystemEventParams` (scene, event) |
| Engine event (desde scene) | `SubsystemEngineEventParams` (engine, event, scene?) |
| Phase (scene) | `SubsystemUpdateParams` (scene, dt) |
| Phase (engine) | `EngineSubsystemUpdateParams` (engine, dt, ports) |
| Scene event (engine) | `EngineSubsystemSceneEventParams` (engine, scene, event) |

---

## 6. Flujo de composición

```
createSceneSubsystem(config)
  → factory(ctx) 
    → state = createState(ctx)
    → composeSceneSubsystem(state)
      → .on(event, useCase)
      → .onEngineEvent(kind, useCase)
      → .onEarlyUpdate(useCase) ... 
      → .build() 
    → SceneSubsystem

defineEngineSubsystem(name)
  → .withState(factory)
  → .onPreRender(useCase)
  → .onRender(useCase)
  → .build()
  → EngineSubsystem
```

---

## 7. Consistencia alcanzada

1. **createEngineSubsystem** — Implementado con config plano. Rendering y resource-coordinator migrados.

2. **createSceneSubsystem** — API preferida para scene subsystems (physics, scripting).

3. **defineEngineSubsystem / defineSceneSubsystem** — Quedan para casos que necesiten el builder fluido (ej. withPorts tipado).

---

## 8. Ports: binding y orden de setup

### Orden de setup (setupEngine)

1. **customPorts** → se registran en `engine.subsystemRuntime.ports`
2. **portProviders** (default + params + de cada engine subsystem) → se ejecutan en orden
3. Cada port provider escribe en `engine.subsystemRuntime.ports` (registry del engine)
4. **Scene subsystem factories** se registran
5. Para cada escena existente: `instantiateSceneSubsystems` → cada factory recibe `ctx` con `ports` merged

### Cómo los subsistemas consumen ports

**Scene subsystems** (scripting, physics) reciben `ctx.ports` en `createState(ctx)`:

```ts
// createScriptingSessionState.ts
const resourceCache = ctx.ports.get(ResourceCachePortDef);  // del engine
const diagnostic = ctx.ports.get(DiagnosticPortDef);        // del engine
```

`ctx.ports` es un **merged registry**: scene primero, luego engine. Las escrituras van a scene. Así:
- **ResourceCachePort**, **DiagnosticPort** → vienen del engine (port providers de resource-coordinator, customPorts)
- **PhysicsQueryPort**, **GizmoPort** → vienen del scene (physics y rendering los registran por escena)

### Cómo los subsistemas registran ports

| Subsistema | Port | Dónde | Cuándo |
|------------|------|-------|--------|
| ResourceCoordinator | ResourceCachePort | engine (port provider) | setupEngine |
| Rendering | ViewportRectProviderPort | engine (provideRenderingPorts) | setupEngine |
| Rendering | GizmoPort | scene.scenePorts | onSceneAdded (antes de instantiateSceneSubsystems) |
| Physics | PhysicsQueryPort | scene (ctx.ports.register en createState) | instantiateSceneSubsystems |

### Side effects del orden

- **Port providers** corren antes de instanciar scene subsystems → los ports de engine están listos cuando scripting/physics hacen `ctx.ports.get()`.
- **GizmoPort** se registra en `onSceneAdded` (antes de instanciar scene subsystems) → disponible en `createState` sin depender del primer tick.

---

## 9. Patrón genérico: engine subsystem en un archivo

Para tener todos los bindings visibles en un mismo fichero, usa `createEngineSubsystem` con config plano:

```ts
// createRenderingSubsystem.ts — todo en un lugar
export function createRenderingSubsystem(opts: CreateRenderingSubsystemOptions): EngineSubsystem {
  return createEngineSubsystem<RenderEngineState>({
    id: 'rendering-three-gl',
    createState: ({ engine }) => createRenderingState({ engine }),
    portProviders: [provideRenderingPorts(opts.viewportRectProvider)],  // engine ports
    onSceneAdded: (state, engine, scene) => state.ensureSceneReady?.(engine, scene.id),  // scene ports
    engineEvents: { 'resource-loaded': reconcilePendingRenderablesForKey },
    phases: { preRender: syncRender, render: renderFrame },
    dispose: disposeRender,
  });
}
```

**Resumen de bindings:**

| Qué | Dónde | Cuándo |
|-----|-------|--------|
| ViewportRectProviderPort | portProviders | setupEngine |
| GizmoPort | onSceneAdded → ensureSceneReady | addScene / setupEngine (antes de scene subsystems) |

---

## 10. Engine subsystems: per-scene vs engine-level

No todos los engine subsystems tienen estado por escena:

| Subsistema | Estado | Usa createPerSceneStateManager |
|------------|--------|--------------------------------|
| **Rendering** | Engine + per-scene (Three.js scene, GizmoPort por escena) | Sí |
| **ResourceCoordinator** | Solo engine (cache global, loader) | No |

**ResourceCoordinator** reacciona a scene events (entity-added, component-changed) pero no mantiene estado por escena: el cache es global, las cargas son desencadenadas por eventos.

**Rendering** necesita estado por escena (Three.js Scene, registry, GizmoPort). Usa `createPerSceneStateManager` de core-v2:

```ts
// core-v2: genérico
createPerSceneStateManager<TState>(engine, {
  createSceneState: (engine, scene) => TState,
  onSceneStateCreated: (scene, state) => void,
}) => { perScene, getOrCreateSceneState }
```

Los paquetes (rendering-three-common) implementan la factory `createSceneState` con su lógica específica; core orquesta el Map y el callback.

---

## 11. Análisis: Engine vs Scene — modelo mental y coherencia

### Diferencia real (no solo "global vs por escena")

| Aspecto | SceneSubsystem | EngineSubsystem |
|---------|----------------|-----------------|
| **Instancias** | Una por escena | Una por engine |
| **Contexto createState** | `ctx: { engine, scene, ports }` | `ctx: { engine }` |
| **Quién itera** | Core itera `scene.subsystems` por fase | Core itera `engine.engineSubsystems` por fase |
| **Fase render** | No tiene | Sí (único que dibuja) |
| **Visibilidad** | Una escena | Todas las escenas |
| **Ports** | `ctx.ports.register` → scene.scenePorts | portProviders → engine; onSceneAdded → scene.scenePorts |

**Conclusión:** Engine = visibilidad cross-scene + fase render. Scene = una escena, sin render.

---

### Rendering: ¿por qué no es un SceneSubsystem?

Rendering necesita:
1. **Fase render** — solo engine subsystems la tienen.
2. **Visibilidad cross-scene** — viewports pueden apuntar a distintas escenas; el render itera viewports.
3. **Estado por escena** — Three.js Scene, GizmoPort por escena.

Si fuera SceneSubsystem: no tendría fase render. El "render" tendría que vivir en otro sitio (engine). Y el engine necesitaría acceder al estado de rendering de cada escena. Eso implica que el engine tendría que conocer la estructura interna de un scene subsystem concreto → acoplamiento fuerte.

**Patrón actual:** Engine subsystem con estado interno por escena (`createPerSceneStateManager`). El engine subsystem, en su preRender, itera escenas y hace sync. En su render, itera viewports y dibuja. El estado por escena es detalle de implementación, no un SceneSubsystem registrado en core.

---

### ¿Engine compone Scene?

**Idea:** Un engine subsystem que internamente crea/orquestra scene subsystems.

**Problemas:**
1. **Doble registro:** Los scene subsystems se crean en `instantiateSceneSubsystems` desde `sceneSubsystemFactories`. Si rendering inyectara los suyos, habría dos flujos de creación.
2. **Orden:** GizmoPort debe existir antes de que scripting corra onDrawGizmos. Hoy `onSceneAdded` corre antes de `instantiateSceneSubsystems`. Si rendering aportara scene subsystems, su orden respecto a scripting tendría que ser explícito.
3. **Fase render:** El "per-scene" de rendering no tiene fase render. El render es engine-level (iterar viewports). Un scene subsystem de rendering solo tendría preRender (sync). El engine seguiría necesitando su fase render. La composición no simplifica el flujo.

**Recomendación:** Mantener el patrón actual. `createPerSceneStateManager` + `onSceneAdded` es suficiente. El estado por escena es interno al engine subsystem; no hace falta formalizarlo como SceneSubsystem.

---

### Capas: use case, domain, infra (Rendering)

| Capa | Qué | Dónde |
|------|-----|-------|
| **Domain** | `RenderEngineState` (sync, render, ensureSceneReady, dispose) | rendering-base-v2/domain |
| **Application** | `syncRender`, `renderFrame`, `ensureSceneReady`, `disposeRender` | rendering-base-v2/application |
| **Infrastructure** | `createRenderingState`, `createPerSceneStateManager`, `syncSceneToRenderTree`, `renderViewports`, `createGizmoScenePortRegistration` | rendering-three-gl, rendering-three-common |

**Flujo:** Use case (thin) → `state.sync()` / `state.render()` → implementación en infra.

El use case es un adaptador: traduce la fase del subsystem al contrato del state. La lógica real está en la implementación del state (infra). El domain es el contrato; no contiene lógica de negocio.

**Posible confusión:** Parece que "perdemos" el use case porque solo delega. Pero el patrón es correcto: Application adapta, Domain define contrato, Infra implementa. La orquestación (iterar escenas, sync, render) vive en infra porque depende de Three.js, viewports, etc.

---

### Duplicidades y consistencia

| Patrón | Estado | Acción |
|--------|--------|--------|
| createPerSceneStateManager | Core (genérico) + rendering-three-common (wrapper) | OK — delegación clara |
| define vs create | defineEngineSubsystem, defineSceneSubsystem vs create* | Preferir create*; migrar UI cuando toque |
| Port providers | provideRenderingPorts, provideResourceCoordinatorPorts | Mismo patrón; opcional: helper genérico |
| Use case → phase | Todos usan defineSubsystemUseCase | Consistente |

---

### Modelo mental final

1. **Scene subsystem:** Una instancia por escena. Core lo crea, lo adjunta, lo invoca por fase. Recibe `ctx.ports` (merged). Registra ports en scene.

2. **Engine subsystem:** Una instancia por engine. Core lo invoca por fase (incl. render). Puede tener:
   - Solo estado engine (ResourceCoordinator)
   - Estado engine + estado por escena interno (Rendering, vía createPerSceneStateManager)

3. **Estado por escena en engine:** Es detalle de implementación. El engine subsystem usa un Map interno; no es un SceneSubsystem. Core no lo conoce.

4. **Capas:** Domain = contrato. Application = use cases (adaptadores). Infra = implementación.
