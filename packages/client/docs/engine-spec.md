Engine specification for SpaceDucks client - resumen y API

Resumen

Este documento define la API mínima y las reglas de interacción entre la aplicación (scenes, controllers) y el motor de render (EcsEngine). El objetivo es establecer un contrato claro: el motor administra el loop y la integración con Three.js, mientras que las escenas y entidades son responsables de proveer cámaras, entidades y componentes. El motor debe fallar pronto si un requisito crítico (por ejemplo, cámara activa) no se cumple.

Principios clave

- Separación de responsabilidades: la lógica de la entidad está separada de su representación (THREE.Object3D).
- Cámara propiedad de la escena: las escenas deben garantizar la existencia de una cámara activa durante `setup()`; el motor obtendrá la cámara llamando a `IScene.getActiveCamera()` y no proveerá una cámara por defecto.
- Fail-fast: el motor emitirá errores claros y visibles si se intenta renderizar sin cámara o si la escena no sigue el contrato.
- Plugins y post-procesado: el motor soportará activación opcional de `EffectComposer` y pases; esto será una capacidad configurable.

Contrato de cámaras

- Obligación de la escena: al finalizar `setup(engine)` la escena debe:
  - crear una cámara (p. ej. `CameraEntity`) o un `THREE.Camera` y
  - Exponer la cámara activa a través de `IScene.getActiveCamera()` o
    registrarla explícitamente en la escena mediante `BaseScene.registerCamera(id, camera)` y activar con `BaseScene.setActiveCamera(id)`.
  - El motor para renderizar obtendrá la cámara llamando a `scene.getActiveCamera()` en cada frame. Si falta, lanzará un Error con mensaje explicativo.
  - Soporte para múltiples cámaras: la escena puede mantener múltiples cámaras; la "activa" será la que devuelva `getActiveCamera()`.

API (resumen)

Interfaz `IRenderingEngine` (TypeScript)
- `init(container: HTMLElement): void` — Inicializa recursos y crea `THREE.Scene` y `WebGLRenderer` internos.
- `start(): void` — Inicia el loop de render y actualización.
- `stop(): void` — Detiene el loop.
- `add(object: ISceneObject): void` — Añade un objeto a la escena y lo inserta en el sistema de actualización.
- `remove(id: string): void` — Remueve y disponga el objeto con el id dado.
- `getScene(): THREE.Scene` — Devuelve la instancia de `THREE.Scene` usada internamente.
- `getRenderer(): THREE.WebGLRenderer` — Devuelve el renderer WebGL.
 - `getActiveCamera(): THREE.Camera | null` — Devuelve la cámara activa consultando la `IScene` activa.
- `renderFrame(): void` — Renderiza un frame (llamado por el loop o manualmente).
- `setResolutionPolicy(policy: 'auto'|'scale', scale?: number): void` — Ajusta política de resolución.
- `setResolutionScale(scale: number): void` — Fija el multiplicador de escala de resolución.
- `setAntialias(enabled: boolean): void` — Reconfigura antialias (puede recrear renderer).
- `setShadows(enabled: boolean, type?: THREE.ShadowMapType): void` — Activa/desactiva sombras.
- `enablePostProcessing(): any` — Activa `EffectComposer` y retorna el composer (o un wrapper).
- `disablePostProcessing(): void` — Desactiva post-processing.
- `getComposer(): any | undefined` — Devuelve el composer si está activo.
- `toggleFpsCounter(): void`, `getFps(): number` — Utilidades de debug.

Errores y mensajes

 - Si `renderFrame()` se invoca y `getActiveCamera()` es `null`, el motor deberá lanzar un `Error` con un mensaje que indique: "Scene must provide an active THREE.Camera (implement IScene.getActiveCamera or register a camera via BaseScene.registerCamera/setActiveCamera) before rendering".
- Mensajes de configuración (p. ej. al reconfigurar antialias) deben ser informativos y no silenciosos.

Ejemplo de uso (pseudocódigo)

```ts
const engine = new EcsEngine();
engine.init(containerElement);
// Scene.setup() debe crear una CameraEntity y activar la cámara
scene.setup(engine);
engine.start();
```

Migración

- Todas las escenas existentes deben actualizarse para registrar explícitamente una cámara durante `setup()`.
 - Se recomienda crear un `CameraEntity` helper que encapsule la creación del `THREE.PerspectiveCamera`. La escena deberá registrar y activar la cámara usando los helpers de `BaseScene`.

Siguientes pasos

- Implementar `IRenderingEngine` y `EcsEngine` respetando este contrato.
- Añadir un `migration-check` dev-time que falle con mensaje claro cuando una escena no registre cámara.
- Luego implementar componentes ECS y sistemas (RenderSync, Physics, Controls, etc.).
