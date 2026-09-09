# Duck Engine V2 — Scene Editor Backend (Design)

> Documento de diseño del **backend del editor de escenas** para Duck Engine v2.
> Define problema, alcance, requisitos y forma del package. **No** describe UI React ni el producto visual completo.
>
> Estado: **borrador de diseño** (pre-implementación).
> Package objetivo (propuesto): `@duckengine/editor-session-v2`
> Ubicación prevista: `packages/v2/editor-session-v2/`

---

## 1. Propósito

El editor de escenas debe **editar la misma escena de juego** que corre el runtime (`core-v2` + rendering + subsystems), con fidelity 1:1 (WYSIWYP), pero la **forma de editar** depende del juego:

| Juego A | Juego B | Juego C |
|---------|---------|---------|
| Cámara libre + transform gizmo | Click coloca tiles procedurales | Drag-and-drop de prefabs con reglas de snap |

El backend del editor es la capa que:

1. Orquesta una **sesión de edición** sobre `DuckEngineAPI` (selección, viewports, play/edit, historial).
2. Expone un **kernel genérico de tools/commands** reutilizable.
3. Permite que cada juego (o pack) aporte **modos de edición** sin forkear el kernel — vía tools TypeScript y, opcionalmente, scripts Lua con un **host surface de editor** (patrón [Microverse.ts](https://github.com/QADRAX/Microverse.ts): DSL del host + capabilities + slots aislados).

**Microverse / Lua de editor no es el objetivo del package**; es el mecanismo previsto para extensibilidad por dominio. El objetivo es el **session/tooling backend**.

---

## 2. Contexto en el ecosistema v2

```
core-v2                         ← ECS, escenas, ports, DuckEngineAPI, inspector metadata
  ↑
adapter packages                ← rendering, physics, scripting-lua, scenes-yaml, resources…
  ↑
editor-session-v2  (nuevo)      ← sesión, commands, tools, editor entities, (surface editor)
  ↑
composition / UI hosts          ← playground, web editor app (fuera de este doc)
```

### Qué ya existe y se reutiliza

| Pieza | Rol para el editor |
|-------|--------------------|
| `DuckEngineAPI` + `SceneChangeEvent` | Fuente de verdad y mutación de la escena |
| `ComponentSpec.metadata.inspector` | Generar inspector sin hardcodear campos |
| Multi-viewport / multi-canvas (rendering) | Vista de edición + game view |
| `GizmoPort` | Debug draw / feedback de tools |
| `scenes-yaml-v2` | Load de escenas (**save aún no existe**) |
| `scripting-lua` | Scripts de **juego** en entidades |
| `resource-coordinator-v2` / persistence | Assets (meshes, materials, scripts) |
| v1 `editor-core` (referencia histórica) | Misma escena + editor entities no serializadas + EditorApiBridge — **no se porta; se rediseña sobre v2** |

### Qué no es este package

- UI (hierarchy, inspector React, dock layout).
- Sustituto de `scripting-lua` para lógica de juego.
- Un segundo motor o una “sub-escena” paralela.
- Dependencias de `packages/v1`.

---

## 3. Goals y non-goals

### Goals

- **G1** — Editar la escena de juego real vía `DuckEngineAPI` (sin API de mutación paralela).
- **G2** — Separar entidades/herramientas de editor de datos serializables del juego.
- **G3** — Session API agnóstica de UI (selección, game state, viewports, dirty, events).
- **G4** — Tools pluggables (builtins mínimos + packs por juego).
- **G5** — Commands con undo/redo como camino canónico de mutación desde tools.
- **G6** — Host surface de editor (bridges + capabilities) para scripts de tools, distinto del surface de juego.
- **G7** — Round-trip de escena (load **y** save) filtrando editor-owned.
- **G8** — Play-in-editor (`edit | play | pause`) con aislamiento claro de tools vs scripts de juego.

### Non-goals (fase inicial)

- UI visual del workbench.
- Visual scripting / node graphs.
- Registro dinámico de nuevos `ComponentType` desde el editor.
- Paridad feature-complete con Unity/Unreal.
- Sustituir Microverse como producto; solo adoptar el **patrón** donde aporte.
- Hot-reload completo de tools/scripts en todos los hosts (puede llegar después).

---

## 4. Modelo conceptual

### 4.1 Tres capas

| Capa | Responsabilidad | Quién la define |
|------|-----------------|-----------------|
| **Runtime de escena** | ECS, render, physics, Lua de juego | `core-v2` + adapters |
| **Editor session (genérico)** | Selection, history, play/edit, editor entities, tool registry, serialize filter | `editor-session-v2` |
| **Editor tools / packs (por juego)** | Free-cam, paint brush, procedural DnD, click→acción | Host TS y/o Lua + editor surface |

### 4.2 Misma escena, dos capas de entidades

Filosofía (heredada de v1 `editor-core`, adaptada a v2):

- Todos los viewports observan la **misma** `SceneState` de juego.
- **Editor entities**: entidades ECS normales (cámara libre, grid, gizmo, ghost de preview) inyectadas en la escena, **tracked por la session** y **excluidas del save**.
- Al cerrar un viewport, la session destruye las editor entities asociadas a ese viewport.

### 4.3 Session

La session es el root del “ahora” del editor:

- Escena activa (`SceneId`)
- `gameState`: `edit | play | pause`
- Selection (single/multi)
- Viewports de editor (ligados a canvas + cámara entity)
- Tool activo + registry de tools
- History (undo/redo)
- Dirty flag / document identity
- Event bus de session (selection, tool, gameState, dirty) — **además** de `SceneChangeEvent`

La UI consume session + engine; el backend no conoce paneles.

### 4.4 Commands

Toda mutación originada por tools (y preferiblemente por UI de inspector/hierarchy) pasa por **commands** ejecutables/invertibles:

Ejemplos: `CreateEntity`, `DeleteEntity`, `ReparentEntity`, `SetTransform`, `SetComponentField`, `AddComponent`, `RemoveComponent`, `DuplicateSubtree`.

- Garantizan undo/redo coherente.
- Pueden componerse en macros (brush stroke = N spawns).
- La session valida contexto (`edit` vs `play`).

### 4.5 Tools

Un **tool** es un plugin de interacción, no una feature fija del kernel:

| Campo | Descripción |
|-------|-------------|
| `id` | Identificador estable |
| `activation` | `exclusive` (reemplaza tool activo) u `overlay` |
| `onActivate` / `onDeactivate` | Lifecycle |
| `onPointer*` / `onKey*` / tick | Input (vía puertos, no DOM directo en domain) |
| Efectos | Solo vía **commands** (+ spawn de editor entities transient) |
| Opcional | Script Lua de editor con capabilities declaradas |

**Builtins del kernel** (pocos): Select, Translate, Rotate, Scale (y opcionalmente Orbit/Pan camera como tool o viewport feature).

Todo lo demas (procedural place, biome paint, dialogue node drop) = **tool pack** del juego.

### 4.6 Dos surfaces de scripting

| Surface | Audience | Ejemplos | Cuándo corre |
|---------|----------|----------|--------------|
| **Game** (`scripting-lua` actual) | Lógica de entidades en runtime | `Transform`, `Scene`, `Input`, `Physics` | Play (+ edit si scripts de juego están enabled — política a decidir) |
| **Editor** (nuevo, opcional) | Tools / extensions de edición | `Editor.selection`, `Editor.commands`, `Editor.raycast`, `Editor.spawnTransient`, `Viewport.*` | Solo en `edit` (o con allowlist explícita) |

Patrón Microverse aplicado al editor:

- Host object = session + engine ports acotados.
- Surface spec = bridges tipados + capabilities (`editor:select`, `editor:spawn`, `editor:mutate-transform`, …).
- Cada tool/script = slot aislado con allowlist.
- **No** unificar bridges de juego y editor en una sola tabla global.

La implementación del sandbox puede:

- Reutilizar piezas de `scripting-lua` / Wasmoon, o
- Adoptar `@microverse.ts/microverse-lua` más adelante,

sin acoplar el **dominio** de `editor-session-v2` a un vendor concreto (port `EditorScriptSandbox`).

---

## 5. Requisitos

### Session y estado

| ID | Requisito |
|----|-----------|
| **REQ-SES-01** | Existe `EditorSession` creada sobre un engine ya configurado (`DuckEngineAPI`) y un `SceneId` de trabajo. |
| **REQ-SES-02** | `gameState ∈ { edit, play, pause }` con transiciones explícitas y eventos. |
| **REQ-SES-03** | Selection: set de `EntityId`; APIs set/clear/toggle; eventos `selection-changed`. |
| **REQ-SES-04** | Dirty tracking: mutaciones de documento (no de editor entities) marcan dirty. |
| **REQ-SES-05** | Session events propios, desacoplados de UI. |

### Editor entities y viewports

| ID | Requisito |
|----|-----------|
| **REQ-EE-01** | La session puede spawn/destroy editor entities en la escena de juego. |
| **REQ-EE-02** | Editor entities están marcadas de forma que el serializer las excluye (flag en entity y/o registro en session — ver decisiones abiertas). |
| **REQ-EE-03** | Cada viewport de editor puede poseer un conjunto de editor entities (p. ej. su cámara); al dispose del viewport se limpian. |
| **REQ-EE-04** | Viewports usan el modelo v2 (`ViewportState` + canvas + `cameraEntityId`). |

### Commands e historial

| ID | Requisito |
|----|-----------|
| **REQ-CMD-01** | Mutaciones de tools pasan por `EditorCommand` con `execute` / `undo`. |
| **REQ-CMD-02** | History stack con undo/redo; política clara en `play` (típicamente history congelada o rama descartable). |
| **REQ-CMD-03** | Commands fallidos no dejan historial a medias (`Result`). |

### Tools

| ID | Requisito |
|----|-----------|
| **REQ-TOOL-01** | Registry: register / unregister / setActive. |
| **REQ-TOOL-02** | Builtins: Select + transform (T/R/S) como mínimo viable. |
| **REQ-TOOL-03** | Tools de juego se registran sin modificar el package kernel. |
| **REQ-TOOL-04** | Input de tools llega por puertos (`InputPort` / picking), no por acoplamiento a React. |

### Persistencia de escena

| ID | Requisito |
|----|-----------|
| **REQ-SER-01** | Save de escena (YAML y/o JSON) a partir de `EntityState` / definición, **excluyendo** editor-owned. |
| **REQ-SER-02** | Load reutiliza o complementa `scenes-yaml-v2` (round-trip estable). |
| **REQ-SER-03** | Definir si la escena es `ResourceKind` o documento aparte en persistence (ver abiertas). |

### Play-in-editor

| ID | Requisito |
|----|-----------|
| **REQ-PLAY-01** | Enter play: desactiva tools de edición (o los aísla); scripts de juego corren según política. |
| **REQ-PLAY-02** | Stop: restaura estado de edición (snapshot/clone — ver abiertas). |
| **REQ-PLAY-03** | Input: viewport de juego vs edición no pelean el mismo consumer sin reglas. |

### Extensibilidad / surface de editor

| ID | Requisito |
|----|-----------|
| **REQ-EXT-01** | Extensions/tools registrables en TypeScript (path primario). |
| **REQ-EXT-02** | Port `EditorScriptSandbox` para slots Lua de editor (path secundario). |
| **REQ-EXT-03** | Capabilities por script/tool; denegación por defecto fuera de allowlist. |
| **REQ-EXT-04** | Bridges de editor **no** exponen IO arbitrario ni OS/network. |

### Arquitectura de package

| ID | Requisito |
|----|-----------|
| **REQ-ARCH-01** | Hexagonal v2: `domain/` / `application/` / `infrastructure/`; vendors solo en infrastructure. |
| **REQ-ARCH-02** | Depende de `@duckengine/core-v2`; **no** de v1. |
| **REQ-ARCH-03** | core-v2 no depende del editor; wiring en composition roots (`engine-web-v2`, harness, o facade editor). |
| **REQ-ARCH-04** | API pública estrecha: `createEditorSession` (+ types necesarios). |

---

## 6. Forma del package (propuesta)

### Nombre y rol

- **npm:** `@duckengine/editor-session-v2`
- **Rol:** package de aplicación/sesión sobre el engine (no scene subsystem de física/render). Orquesta use cases; no dibuja UI.
- **Analogía:** más cercano a un host de sesión que a `physics-rapier`; el rendering sigue siendo el adapter de siempre.

### Layout inicial

```
packages/v2/editor-session-v2/
  package.json
  tsconfig.json
  ARCHITECTURE.md          # cuando deje de ser borrador
  src/
    domain/
      session/             # types, gameState, selection, dirty
      commands/            # EditorCommand types + pure helpers
      tools/               # ToolDescriptor, activation kinds
      editorEntities/      # ownership / non-serialize markers
      viewports/           # editor viewport model (si no es solo core Viewport)
      ports/
        editorScriptSandbox.ts
        sceneDocumentPort.ts   # load/save document (opcional; o usar packages yaml)
    application/
      createSession.ts
      executeCommand.ts
      undoRedo.ts
      setSelection.ts
      setGameState.ts
      registerTool.ts
      setActiveTool.ts
      spawnEditorEntity.ts
      # …
    infrastructure/
      composition/
        createEditorSession.ts
      adapters/            # sandbox impl, document adapter
      # vendors solo si hay Wasmoon/Microverse aquí
    index.ts
```

### Dependencias previstas

- `@duckengine/core-v2` (obligatoria)
- Opcional más adelante: `scenes-yaml-v2` (save/load), `scripting-lua` o microverse (adapter del sandbox)
- **No** React, **no** Three directo en domain/application (picking/gizmos vía ports ya expuestos por core/rendering)

### Composition

El editor **no** se mete dentro de `createWebEngineClient` como regla de negocio. Opciones:

1. Facade `createEditorEngineClient` que compone web engine + session, o
2. Host llama `createWebEngineClient` / harness y luego `createEditorSession({ api, sceneId, … })`.

Preferencia inicial: **(2)** — session como capa explícita sobre un client ya listo.

---

## 7. Flujos clave

### 7.1 Abrir escena para editar

```
Host → createEngine client
    → addScene + setupScene
    → loadScene (yaml/json)
    → createEditorSession({ api, sceneId })
    → create editor viewport + spawn editor camera entity
    → setActiveTool('select')
```

### 7.2 Tool interactúa

```
Pointer event (host/adapter) → session.dispatchInput
  → activeTool.onPointerDown
  → executeCommand(SetTransform | CreateEntity | …)
  → DuckEngineAPI mutates scene
  → SceneChangeEvent + session dirty + history push
```

### 7.3 Save

```
session.requestSave
  → collect entities excluding editor-owned
  → SceneDocumentPort.serialize
  → host persiste bytes/URL
```

### 7.4 Play / Stop

```
edit → play:
  snapshot (o clone) del documento
  deactivate tools / editor scripts
  (opcional) hide editor-only visuals
  run frame loop with game scripts

play → stop:
  restore snapshot
  reactivate edit tools
```

---

## 8. Relación con Microverse.ts

| Idea Microverse | Uso en el editor |
|-----------------|------------------|
| Host-defined API (DSL) | `Editor.*` bridges, no OS/network |
| Capabilities por instancia | Allowlist por tool/script |
| Isolated slots | Un sandbox handle por tool script |
| Zod / typed boundaries | Validar args de bridges en el adapter |
| Component hooks | Opcional: `onSelectionChanged`, `onToolActivate` en Lua |

**Fuera de alcance inmediato:** reemplazar el scripting de entidades de juego por Microverse; eso puede evaluarse aparte. El beneficio inmediato es **editor packs** sin hinchar el kernel.

---

## 9. Decisiones abiertas

| # | Pregunta | Opciones | Nota |
|---|----------|----------|------|
| D1 | ¿Cómo marcar editor-owned? | Flag en `EntityState` vs registro solo en session | Flag en core facilita serialize en cualquier host; registro evita tocar core |
| D2 | ¿Commands desde día 1? | Sí (recomendado) vs mutación directa + undo ad-hoc | REQ-CMD empuja a commands formales |
| D3 | Sandbox Lua editor | VM dedicada vs mismo VM + capabilities | Preferible aislamiento fuerte (VM o env slot estricto) |
| D4 | Escena como resource | Nuevo `ResourceKind` vs documento aparte | Afecta persistence y asset service |
| D5 | Play fidelity | In-place + snapshot vs escena clonada | Clone es más seguro; in-place más simple |
| D6 | Scripts de juego en `edit` | Off / on / solo si `runInEditMode` | Evitar side effects al editar |
| D7 | Gizmo interaction | Solo `GizmoPort` draw vs tool layer de handles | Handles suelen ser editor entities + tool |
| D8 | ¿Save vive en este package o en `scenes-yaml-v2`? | Preferible serialize en yaml package; session solo orquesta | Mantiene responsabilidades |

---

## 10. Fases de entrega sugeridas

| Fase | Entrega | Criterio de hecho |
|------|---------|-------------------|
| **P0** | Domain + session mínima + selection + gameState | Tests unitarios de session sin UI |
| **P1** | Commands + history + mutaciones básicas | Undo/redo de create/delete/setField |
| **P2** | Editor entities + viewport de edición + cámara | Entidades no salen en serialize (aunque save sea stub) |
| **P3** | Tools builtins Select + T/R/S | Tool registry + input dispatch testeable |
| **P4** | Serialize/save round-trip (con `scenes-yaml-v2`) | Load → edit → save → load idéntico (módulo editor-owned) |
| **P5** | Play/pause/stop | Snapshot restore fiable |
| **P6** | Editor script port + un tool Lua de ejemplo | Capability allowlist demostrable |
| **P7** | Tool pack de ejemplo “procedural place” | Prueba de extensibilidad por juego |

---

## 11. Referencias

- `packages/v2/core-v2/DESIGN.md` — componentes, inspector metadata
- `packages/v2/core-v2/ARCHITECTURE.md` — kernel
- `packages/v2/scripting-lua/ARCHITECTURE.md` — slots, bridges, hooks de juego
- `packages/v1/editor-core/README.md` — precedente multi-viewport / editor entities
- [Microverse.ts](https://github.com/QADRAX/Microverse.ts) — patrón sandbox + host DSL + capabilities
- `.cursor/skills/v2-hexagonal-architecture/` — reglas de package v2

---

## 12. Próximos pasos de diseño

1. Cerrar **D1** (marker editor-owned) y **D8** (dónde vive serialize).
2. Bosquejar interfaces públicas: `EditorSession`, `EditorCommand`, `EditorTool`, eventos.
3. Decidir si P0–P2 viven solo en este doc hasta scaffold del package, o scaffold vacío con `ARCHITECTURE.md` enlazando aquí.
4. Mantener UI fuera: un doc aparte cuando exista el host React v2.
