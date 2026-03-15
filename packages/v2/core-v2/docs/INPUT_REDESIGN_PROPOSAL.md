# Input System Redesign Proposal

## Objetivos

1. **Runtime-agnóstico**: Node (headless) y browser con implementaciones separadas
2. **Mouse look en viewport**: pointer lock asociado a un canvas/elemento
3. **Controles genéricos**: teclado, ratón, gamepads de cualquier tipo
4. **Componible**: package `@duckengine/input-*` independiente, inyectable en el engine
5. **Capa de acciones**: scripts agnósticos de si usas W o gamepad (misma acción)
6. **Reasignación de controles**: bindings configurables y persistibles

---

## Arquitectura propuesta

```
core-v2              → InputPort (raw)
input-mappings-v2    → InputActionPort, BindingStoragePort, InputBindingsConfig, createInputActionMapper
input-browser-v2     → createBrowserInputPort({ targetElement, ... })
input-node-v2        → createNoopInputPort() | createMockInputPort()
input-storage-*      → implementaciones de BindingStoragePort (browser, node, etc.)
engine-v2            → acepta input?: InputPort | InputActionPort, default = noop
```

**Capas:**
1. **Raw** (InputPort): teclas, ratón, gamepad físico
2. **Acciones** (InputActionPort): nombres semánticos, agnósticos del dispositivo
3. **Bindings**: configuración que mapea acciones → fuentes raw, reasignable
4. **Persistencia** (BindingStoragePort): carga/guardado delegado al consumer (localStorage, fs, etc.)

---

## 1. InputPort (core-v2) — contrato extendido

```ts
// domain/ports/external/inputPort.ts

/** Mouse delta (movimiento acumulado desde último frame). */
export interface InputMouseDelta {
  x: number;
  y: number;
}

/** Mouse buttons state. */
export interface InputMouseButtons {
  left: boolean;
  right: boolean;
  middle: boolean;
}

/** Mouse position (pantalla o viewport). Solo útil sin pointer lock. */
export interface InputMousePosition {
  x: number;
  y: number;
}

/** Wheel delta acumulado (zoom, scroll). */
export type InputWheelDelta = number;

/**
 * Gamepad state normalizado.
 * Usa nombres semánticos del standard mapping (Xbox/PS layout).
 * Si mapping !== 'standard', el provider mapea lo mejor que pueda.
 */
export interface InputGamepadState {
  readonly connected: boolean;
  readonly buttons: Readonly<Record<InputGamepadButton, boolean>>;
  readonly axes: Readonly<Record<InputGamepadAxis, number>>;
}

export type InputGamepadButton =
  | 'a' | 'b' | 'x' | 'y'           // face
  | 'leftBumper' | 'rightBumper'    // L1, R1
  | 'leftTrigger' | 'rightTrigger'   // L2, R2 (0..1)
  | 'select' | 'start'
  | 'leftStick' | 'rightStick'      // stick click
  | 'dpadUp' | 'dpadDown' | 'dpadLeft' | 'dpadRight';

export type InputGamepadAxis =
  | 'leftStickX' | 'leftStickY'
  | 'rightStickX' | 'rightStickY';

/**
 * Contrato de input para engine y scripting.
 * Implementaciones: browser (DOM + Gamepad API), node (noop/mock).
 */
export interface InputPort {
  // --- Keyboard ---
  isKeyPressed(key: string): boolean;

  // --- Mouse ---
  getMouseDelta(): InputMouseDelta;
  getMouseButtons(): InputMouseButtons;
  getMousePosition(): InputMousePosition;
  getMouseWheelDelta(): InputWheelDelta;

  // --- Gamepad ---
  getGamepad(index: number): InputGamepadState | null;
  getGamepadCount(): number;

  // --- Pointer lock (opcional, solo browser) ---
  // El provider puede no implementarlos (noop). Scripts los usan para mouse look.
  requestPointerLock?(): void;
  exitPointerLock?(): void;
  isPointerLocked?(): boolean;

  // --- Frame lifecycle (opcional) ---
  /** Llamar al inicio de cada frame para resetear deltas (mouse, wheel). */
  beginFrame?(): void;
}
```

**Retrocompatibilidad**: Los métodos nuevos pueden devolver valores por defecto (0, false, null) si el provider no los soporta.

---

## 2. Capa de acciones y mappings — `@duckengine/input-mappings-v2`

Los scripts usan **acciones** (nombres semánticos), no raw inputs. Una acción puede estar mapeada a W, al stick del gamepad, o ambos. El usuario puede reasignar.

### 2.1 Fuentes de input (binding sources)

Cada binding indica de dónde leer el valor:

```ts
type BindingSource =
  | { type: 'key'; key: string }
  | { type: 'mouseButton'; button: 'left' | 'right' | 'middle' }
  | { type: 'mouseAxis'; axis: 'deltaX' | 'deltaY' | 'wheel' }
  | { type: 'gamepadButton'; gamepadIndex?: number; button: InputGamepadButton }
  | { type: 'gamepadAxis'; gamepadIndex?: number; axis: InputGamepadAxis; direction: 'positive' | 'negative' };
```

- `gamepadIndex`: default 0. Para multi-player, cada jugador tiene su índice.
- `direction`: para ejes bidireccionales (stick, dpad). `positive` = arriba/derecha, `negative` = abajo/izquierda.

### 2.2 Tipos de acción

| Tipo        | Valor      | Uso                    | Ejemplo fuentes                          |
|-------------|------------|------------------------|------------------------------------------|
| `boolean`   | 0 o 1      | Botones (pulsado/suelto)| jump, attack, interact                   |
| `float`     | 0..1       | Eje unidireccional     | acelerar, trigger                        |
| `float2`    | -1..1 x2   | Eje bidireccional      | move (WASD+stick), look (mouse+stick)     |

### 2.3 Configuración de bindings

```ts
interface ActionBinding {
  action: string;
  sources: BindingSource[];
}

interface InputBindingsConfig {
  /** Acciones y sus fuentes. Múltiples fuentes = OR (cualquiera activa la acción). */
  bindings: ActionBinding[];
  /** Sensibilidad por acción (opcional). */
  sensitivity?: Record<string, number>;
}

// Ejemplo: movimiento agnóstico de teclado/gamepad
const defaultBindings: InputBindingsConfig = {
  bindings: [
    { action: 'moveForward',  sources: [{ type: 'key', key: 'w' }, { type: 'gamepadAxis', axis: 'leftStickY', direction: 'negative' }, { type: 'gamepadButton', button: 'dpadUp' }] },
    { action: 'moveBackward', sources: [{ type: 'key', key: 's' }, { type: 'gamepadAxis', axis: 'leftStickY', direction: 'positive' }, { type: 'gamepadButton', button: 'dpadDown' }] },
    { action: 'moveLeft',     sources: [{ type: 'key', key: 'a' }, { type: 'gamepadAxis', axis: 'leftStickX', direction: 'negative' }, { type: 'gamepadButton', button: 'dpadLeft' }] },
    { action: 'moveRight',    sources: [{ type: 'key', key: 'd' }, { type: 'gamepadAxis', axis: 'leftStickX', direction: 'positive' }, { type: 'gamepadButton', button: 'dpadRight' }] },
    { action: 'jump',         sources: [{ type: 'key', key: 'space' }, { type: 'gamepadButton', button: 'a' }] },
    { action: 'lookHorizontal', sources: [{ type: 'mouseAxis', axis: 'deltaX' }, { type: 'gamepadAxis', axis: 'rightStickX', direction: 'positive' }] },
    { action: 'lookVertical',   sources: [{ type: 'mouseAxis', axis: 'deltaY' }, { type: 'gamepadAxis', axis: 'rightStickY', direction: 'negative' }] },
    { action: 'sprint',       sources: [{ type: 'key', key: 'shift' }, { type: 'gamepadButton', button: 'leftStick' }] },
    { action: 'flyDown',      sources: [{ type: 'key', key: 'control' }, { type: 'key', key: 'c' }, { type: 'gamepadButton', button: 'b' }] },
  ],
  sensitivity: { lookHorizontal: 0.002, lookVertical: 0.002 },
};
```

### 2.4 InputActionPort (contrato)

```ts
interface InputActionPort extends InputPort {
  /** Valor de acción 0..1 (boolean) o -1..1 (float2). */
  getAction(action: string): number;
  /** Para acciones float2 (move, look): { x, y }. */
  getAction2(actionX: string, actionY: string): { x: number; y: number };
  /** Atajo para getAction > 0. */
  isActionPressed(action: string): boolean;

  /** Reasignar: reemplaza las fuentes de una acción. */
  rebindAction(action: string, sources: BindingSource[]): void;
  /** Obtener bindings actuales (para guardar/cargar). */
  getBindings(): InputBindingsConfig;
  /** Cargar bindings (p. ej. desde localStorage). */
  loadBindings(config: InputBindingsConfig): void;
}
```

`InputActionPort extends InputPort`: los métodos raw siguen disponibles si hace falta (debug, UI de rebinding). El mapper delega en el raw port.

### 2.5 createInputActionMapper

```ts
// input-mappings-v2
function createInputActionMapper(
  rawPort: InputPort,
  initialBindings?: InputBindingsConfig
): InputActionPort;
```

- Lee del `rawPort` cada vez que se llama `getAction`
- Aplica `sensitivity` a look/mouse
- `rebindAction` y `loadBindings` actualizan la config en memoria
- **Persistencia**: delegada a `BindingStoragePort` (ver §2.9). El mapper no conoce storage.

### 2.6 Reasignación de controles

**Flujo de rebinding:**
1. Usuario entra en "Configurar controles"
2. Selecciona acción (ej. "moveForward")
3. Sistema entra en modo "esperando input"
4. Usuario pulsa nueva tecla o mueve stick
5. Se llama `rebindAction('moveForward', [{ type: 'key', key: 'arrowup' }])`
6. Consumer guarda vía `BindingStoragePort.save(input.getBindings())`

**Conflictos:** Si la nueva tecla ya está en otra acción, se puede:
- Quitar de la acción anterior
- Permitir múltiples acciones en la misma tecla (comportamiento definido por el juego)

### 2.7 Scripting (Lua) — API por acciones

```lua
-- Antes (acoplado a teclado):
local w = Engine.Input.isKeyPressed("w")
local stickY = Engine.Input.getGamepad(0) and Engine.Input.getGamepad(0).axes.leftStickY or 0
local forward = w and 1 or (stickY < -0.5 and -stickY or 0)

-- Después (agnóstico):
local moveForward = Engine.Input.getAction("moveForward")   -- 0..1
local moveBackward = Engine.Input.getAction("moveBackward")
local moveLeft = Engine.Input.getAction("moveLeft")
local moveRight = Engine.Input.getAction("moveRight")

local mv = math.vec3.new(
  moveRight - moveLeft,
  0,
  moveBackward - moveForward
)

local look = Engine.Input.getAction2("lookHorizontal", "lookVertical")
-- look.x, look.y con sensibilidad ya aplicada
```

**first_person_move.lua** con acciones:
```lua
function FirstPersonMove:update(dt)
  local forward = Engine.Input.getAction("moveForward")
  local back    = Engine.Input.getAction("moveBackward")
  local left    = Engine.Input.getAction("moveLeft")
  local right   = Engine.Input.getAction("moveRight")
  local up      = Engine.Input.getAction("jump")      -- o "flyUp" si flyMode
  local down    = Engine.Input.getAction("flyDown")
  local sprint  = Engine.Input.getAction("sprint")

  local mv = math.vec3.new(right - left, up - down, back - forward)
  -- ... resto igual, mv ya viene normalizado por la capa de acciones
end
```

### 2.8 BindingStoragePort (input-mappings-v2) — persistencia delegada

**Problema**: No podemos usar `localStorage` en todas las distribuciones (Node, Electron, mobile, etc.). La persistencia debe delegarse mediante un port.

```ts
// input-mappings-v2

/**
 * Contrato para cargar/guardar bindings de input.
 * El consumer implementa según su entorno:
 * - Browser: localStorage, IndexedDB
 * - Node: fs, archivo JSON
 * - Electron: electron-store
 * - Mobile: AsyncStorage, SQLite
 */
export interface BindingStoragePort {
  /** Carga bindings guardados. null si no hay o error. */
  load(): Promise<InputBindingsConfig | null>;
  /** Guarda bindings. */
  save(config: InputBindingsConfig): Promise<void>;
}
```

**Opcional**: Si no se proporciona implementación, los bindings quedan solo en memoria (sin persistencia entre sesiones). El port vive en `input-mappings-v2` junto a `InputBindingsConfig`.

### 2.9 Flujo de persistencia (consumer)

El consumer orquesta: usa `BindingStoragePort` para cargar al inicio y guardar tras rebind. El mapper no conoce el storage.

```ts
// Composición en la app (cualquier runtime)
const rawInput = createBrowserInputPort({ targetElement: canvas });
const bindingStorage = getBindingStorage();  // consumer implementa según entorno

const saved = await bindingStorage.load();
const input = createInputActionMapper(rawInput, saved ?? defaultBindings);
const api = await createDuckEngine({ input, resourceLoader, ... });

// Tras rebinding en el menú:
await bindingStorage.save(input.getBindings());
```

**Implementaciones de ejemplo** (en packages separados o en la app):

```ts
// input-storage-browser-v2 (opcional)
function createLocalStorageBindingStorage(key = 'duckengine-input-bindings'): BindingStoragePort {
  return {
    async load() {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    },
    async save(config) {
      localStorage.setItem(key, JSON.stringify(config));
    },
  };
}

// input-storage-node-v2 (opcional)
function createFileBindingStorage(path: string): BindingStoragePort {
  return {
    async load() {
      try {
        const raw = await fs.promises.readFile(path, 'utf-8');
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },
    async save(config) {
      await fs.promises.writeFile(path, JSON.stringify(config, null, 2));
    },
  };
}
```

---

## 3. InputProvider (browser) — `@duckengine/input-browser-v2`

```ts
// createBrowserInputPort.ts

export interface CreateBrowserInputPortOptions {
  /** Elemento para pointer lock (típicamente el canvas del viewport). */
  targetElement: HTMLElement | null;
  /** Llamado cada frame antes de leer estado (resetear deltas). */
  onBeginFrame?: () => void;
}

export function createBrowserInputPort(
  options: CreateBrowserInputPortOptions
): InputPort;
```

**Implementación**:
- `keydown`/`keyup` → `Set<string>` de teclas pulsadas
- `mousemove` con `movementX`/`movementY` cuando pointer lock activo
- `mousedown`/`mouseup` → botones
- `wheel` → acumular deltaY
- `navigator.getGamepads()` cada frame → normalizar a `InputGamepadState`
- `requestPointerLock` en `targetElement`
- `onBeginFrame` para resetear deltas (o el consumer llama `beginFrame` si lo exponemos)

**Coordinación con viewport**:
- El consumer (web app) crea el input con `targetElement = canvas` del viewport activo
- Si hay varios viewports (split-screen), puede haber un input por viewport o uno global con el viewport "focused"

---

## 4. InputProvider (node) — `@duckengine/input-node-v2`

```ts
// createNoopInputPort.ts
export function createNoopInputPort(): InputPort;

// createMockInputPort.ts (para tests)
export function createMockInputPort(overrides?: Partial<InputPort>): InputPort;
```

---

## 5. Integración en engine-v2

```ts
// createDuckEngine.ts
import { createNoopInputPort } from '@duckengine/input-node-v2';

// Default: noop (Node) o el consumer pasa el suyo
input = options.input ?? createNoopInputPort();
```

El consumer en browser con acciones y persistencia:

```ts
const rawInput = createBrowserInputPort({ targetElement: canvasRef.current });
const bindingStorage = createLocalStorageBindingStorage();  // o el port que implemente
const saved = await bindingStorage.load();
const input = createInputActionMapper(rawInput, saved ?? defaultBindings);
const api = await createDuckEngine({ input, resourceLoader, ... });

// Game loop:
rawInput.beginFrame?.();
api.update(dt);

// Tras rebinding en menú:
await bindingStorage.save(input.getBindings());
```

---

## 6. Gamepad mapping

El Gamepad API tiene `gamepad.mapping === 'standard'` para Xbox/PS. Botones estándar:

| Índice | Nombre   |
|--------|----------|
| 0      | a (south)|
| 1      | b (east) |
| 2      | x (north)|
| 3      | y (west) |
| 4      | leftBumper |
| 5      | rightBumper |
| 6      | leftTrigger |
| 7      | rightTrigger |
| 8      | select |
| 9      | start |
| 10     | leftStick |
| 11     | rightStick |
| 12-15  | dpad |

Ejes: [0,1] left stick, [2,3] right stick.

Para gamepads sin mapping estándar, el provider puede mapear por índice o devolver `connected: false` si no puede normalizar.

---

## 7. Scripting (Lua) — API extendida

El bridge actual expone `isKeyPressed`, `getMouseDelta`, `getMouseButtons`. Añadir:

- `getMousePosition()` → `{ x, y }`
- `getMouseWheelDelta()` → number
- `getGamepad(index)` → tabla con `buttons`, `axes`
- `requestPointerLock()`, `exitPointerLock()`, `isPointerLocked()`

Ejemplo en Lua (first_person_look):

```lua
-- Request pointer lock on first click
if not Engine.Input.isPointerLocked() then
  if Engine.Input.getMouseButtons().left then
    Engine.Input.requestPointerLock()
  end
  return
end

local delta = Engine.Input.getMouseDelta()
-- apply to camera rotation
```

---

## 8. Plan de migración

1. **Fase 1**: Extender `InputPort` en core-v2 (métodos nuevos, `beginFrame`)
2. **Fase 2**: Crear `input-mappings-v2` con `createInputActionMapper`, `BindingSource`, `InputBindingsConfig`, `BindingStoragePort`, `defaultBindings`
3. **Fase 3**: Crear `input-browser-v2` con `createBrowserInputPort`
4. **Fase 4**: Crear `input-node-v2` con `createNoopInputPort` y `createMockInputPort`
5. **Fase 5**: Crear `input-storage-browser-v2` con `createLocalStorageBindingStorage` (opcional)
6. **Fase 6**: Crear `input-storage-node-v2` con `createFileBindingStorage` (opcional)
7. **Fase 7**: Actualizar engine-v2 para usar input-node como default, documentar composición completa
8. **Fase 8**: Actualizar inputBridge y tipos Lua para exponer `getAction`, `getAction2`, `isActionPressed`, `rebindAction`, `getBindings`, `loadBindings`
9. **Fase 9**: Migrar `first_person_move.lua` a acciones; crear `first_person_look.lua` con pointer lock
10. **Fase 10**: UI de rebinding (consumer) — fuera del engine, usa `getBindings`/`rebindAction`/`BindingStoragePort`

---

## 9. Alternativa: Input como subsistema

En vez de un port inyectado, el input podría ser un **EngineSubsystem** que se registra y expone el port internamente. Ventaja: el subsistema puede tener `beginFrame()` llamado automáticamente por el engine. Desventaja: más acoplamiento.

Recomendación: mantener como port. El consumer controla cuándo hacer `beginFrame` (o el provider lo hace en cada `getMouseDelta` leyendo y reseteando).

---

## 10. beginFrame / reset de deltas

Opciones:
- **A)**
  - El provider acumula deltas en listeners.
  - `getMouseDelta()` devuelve y **resetea** internamente. Problema: si dos sistemas llaman en el mismo frame, el segundo recibe 0.
- **B)**
  - El consumer llama `beginFrame()` al inicio del frame. El provider resetea deltas ahí.
  - `getMouseDelta()` solo lee, no modifica.
- **C)**
  - El engine llama `beginFrame` en el port si existe, antes de los subsystems.

**Recomendación**: B o C. El provider tiene `beginFrame?: () => void` y el consumer (o engine) lo invoca. El engine podría aceptar `inputBeginFrame?: () => void` en setup y llamarlo al inicio de cada `update`.

---

## 11. Revisión del plan

### Dependencias entre packages

| Package              | Depende de                    |
|----------------------|-------------------------------|
| input-mappings-v2    | core-v2 (InputPort, tipos)    |
| input-browser-v2    | core-v2 (InputPort)           |
| input-node-v2       | core-v2 (InputPort)           |
| input-storage-browser| input-mappings-v2 (BindingStoragePort) |
| input-storage-node  | input-mappings-v2 (BindingStoragePort) |
| engine-v2           | core-v2, input-node-v2 (default) |

### Puntos críticos verificados

- [x] **Persistencia delegada**: `BindingStoragePort` en core-v2; implementaciones en packages o app. Sin `localStorage` hardcodeado.
- [x] **InputActionPort extiende InputPort**: el engine acepta ambos sin cambios en la firma.
- [x] **Mapper sin storage**: `createInputActionMapper` no recibe storage; el consumer orquesta load/save.
- [x] **beginFrame en InputPort**: añadido como opcional para reset de deltas.
- [x] **BindingStoragePort async**: `load()` y `save()` son `Promise` para soportar fs, red, etc.
- [x] **Orden de fases**: InputPort primero, luego mappings, luego providers, luego storage, luego engine/scripting.

### Casos no cubiertos (futuro)

- **Multi-player local**: un `InputActionPort` por jugador con `gamepadIndex` en bindings. Fase posterior.
- **Input remoto (streaming)**: raw port que recibe estado por red. Misma interfaz.
- **Modo "esperando input" para rebind**: el consumer gestiona la captura (p. ej. en browser: one-shot `keydown` listener). Cuando captura la tecla, llama `rebindAction`. El mapper no necesita API especial.
