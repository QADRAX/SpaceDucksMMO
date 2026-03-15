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
| Rendering | GizmoPort | scene.scenePorts | primer sync (createPerSceneStateManager) |
| Physics | PhysicsQueryPort | scene (ctx.ports.register en createState) | instantiateSceneSubsystems |

### Side effects del orden

- **Port providers** corren antes de instanciar scene subsystems → los ports de engine están listos cuando scripting/physics hacen `ctx.ports.get()`.
- **GizmoPort** se registra en el primer frame (sync) → scripting usa `getGizmo()` dinámico para resolverlo cuando ya existe.
