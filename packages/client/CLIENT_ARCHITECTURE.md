# SpaceDucks Client Architecture

This client is an Electron + Vite + TypeScript + Three.js app designed with Clean Architecture principles. The goal is to keep domain logic portable, application flow testable, and infrastructure details swappable.

## Overview

- Runtime: Electron (main + preload) and a browser-like renderer powered by Vite
- Rendering: Three.js via a thin `ThreeRenderer` wrapper
- UI: Lightweight screen system (`ScreenRouter` + `IScreen`), rendered into a DOM overlay (`UiLayer`) separate from WebGL
- Persistence: JSON files in Electron `userData` via IPC, with a browser fallback
- Settings: Zod-backed schemas with validation/migration and versioning

## Layers and Key Modules

### Domain (what the app is about)
- `domain/ports/IScreen.ts`: Contract for a UI screen (mount/unmount/render)
- `domain/ports/IScene.ts`: Contract for a 3D scene (setup/teardown/update)
- `domain/ui/ScreenId.ts`: Strongly-typed IDs for app screens
- `domain/scene/SceneId.ts`: Strongly-typed IDs for 3D scenes (MainMenu, GameWorld, etc.)
- `domain/settings/GameSettings.ts`: Typed settings model (e.g., qualityPreset, resolutionPolicy)
- `domain/settings/schema.ts`: Zod schemas, defaults, CURRENT_SETTINGS_VERSION, validateAndMigrate

### Application (how the app behaves)
- `application/ui/ScreenRouter.ts`: Screen lifecycle and navigation (register, show, hide)
- `application/SceneManager.ts`: 3D scene lifecycle and transitions (register, switchTo, update)
- `application/SceneService.ts`: Render loop orchestration; delegates scene updates to SceneManager
- `application/SettingsService.ts`: Load/save settings with validation and migration; ensures persisted version matches current schema

### Infrastructure (how we talk to the world)
- Electron main
  - `infrastructure/electron/WindowManager.ts`: Creates BrowserWindow, dev/prod wiring
  - `infrastructure/ipc/StorageIpcBridge.ts`: IPC handlers to expose storage to renderer
  - `src/preload.ts`: Safe, typed bridge injected into `window`
- Storage
  - `infrastructure/storage/FileStorage.ts`: JSON persistence in `app.getPath('userData')`
  - `infrastructure/storage/IpcStorage.ts`: Renderer adapter that calls preload bridge
  - `infrastructure/storage/BrowserStorage.ts`: Fallback for pure web (localStorage)
- Rendering and UI
  - `infrastructure/rendering/ThreeRenderer.ts`: WebGL container, DPR policy, resize, antialias/shadows toggles
  - `infrastructure/scenes/MainMenuScene.ts`: Ambient menu background with rotating duck placeholder and particles
  - `infrastructure/scenes/GameWorldScene.ts`: Gameplay scene stub (terrain, player, entities will go here)
  - `infrastructure/ui/RendererBootstrap.ts`: Composition root for the renderer; wires services, router, scenes, and screens
  - `infrastructure/ui/UiLayer.ts`: DOM overlay root for UI; imports `styles/base.css`
  - `infrastructure/ui/styles/base.css`: Tokens and basic UI styling
  - Screens: `infrastructure/ui/screens/{MainScreen, ServerListScreen, SettingsScreen}.ts`
  - `infrastructure/ui/GraphicsController.ts`: Facade with a limited surface for UI to interact with rendering

## Graphics and Resolution

- Resolution policy defaults to automatic (use device pixel ratio per window)
- Quality presets: `low | medium | high | ultra | custom`
  - Toggle antialias and shadows accordingly
  - `custom` allows explicit toggles
- Edge case: extremely high-DPI displays can be capped later via a DPR max (future toggle)

## Settings Lifecycle

- `validateAndMigrate` ensures old settings are made compatible with current schema
- `SettingsService` loads -> validates/migrates -> saves if version changed
- Repository: JSON file per key in `userData` via IPC, renderer never touches Node APIs directly

## Storage Strategy

- Preferred: `FileStorage` in main process (JSON files)
- Bridge: `StorageIpcBridge` + `preload` exposes `readJson/writeJson/delete`
- Renderer: `IpcStorage` adapter
- Web fallback: `BrowserStorage` (localStorage)

## UI Architecture

- `UiLayer` provides a container (`div.ui-root`) layered above the canvas with base CSS imported once
- `ScreenRouter` manages `IScreen` instances: register by ID, mount/unmount on navigation
- Screens are small, focused components that produce DOM and subscribe to UI events
- `GraphicsController` narrows access to rendering operations (apply preset, toggle shadows, etc.)

### Adding a Screen
1. Create `infrastructure/ui/screens/MyNewScreen.ts` implementing `IScreen`
2. Register in `RendererBootstrap` with a unique `ScreenId`
3. Navigate using `ScreenRouter.show(ScreenId.MyNewScreen)`

## 3D Scene Architecture

- `IScene` port defines scene contract: `setup(engine)`, `update(dt)`, `teardown(engine)`
- `SceneManager` orchestrates scene lifecycle and transitions
- `SceneService` runs the render loop and delegates scene updates to SceneManager
- Scenes are self-contained 3D environments with their own objects, camera setup, and lighting

### Adding a Scene
1. Create a new `SceneId` in `domain/scene/SceneId.ts`
2. Implement `IScene` in `infrastructure/scenes/MyNewScene.ts`
   - `setup()`: Add objects, configure camera, set lighting
   - `update(dt)`: Per-frame logic (animations, interactions)
   - `teardown()`: Cleanup resources
3. Register in `RendererBootstrap`: `sceneManager.register(new MyNewScene())`
4. Switch to it: `sceneManager.switchTo(SceneId.MyNewScene)`

### Scene Lifecycle
1. `setup()` is called when switching to the scene
2. `update(dt)` runs every frame while the scene is active
3. `teardown()` is called before switching to another scene (cleanup)

### Current Scenes
- **MainMenuScene**: Ambient background for main menu (rotating duck, particles, atmospheric lighting)
- **GameWorldScene**: Placeholder for gameplay (will contain terrain, player, NPCs, etc.)

### Extending Settings
1. Update `domain/settings/GameSettings.ts`
2. Add schema defaults and migration in `domain/settings/schema.ts`
3. Use `SettingsService` to load/save and persist through the IPC storage

## Dev and Debug

- Recommended flow: VS Code launch configs for Electron main and a separate Vite dev server for the renderer
- Fast iteration: Hot-reload in the renderer via Vite; restart main on changes (nodemon/ts-node or existing watcher)
- Attach debugger: Use VS Code to attach to the Electron main process and Chrome devtools for renderer

## Testing and Future Work

- Suggested additions:
  - EventBus/ScreenRegistry to decouple navigation further
  - InputService and AssetLoader ports for engine-side interactions
  - UI state store for loading/errors/selection
  - Additional graphics toggles (shadow map type, post-processing)
  - DPR cap and frame-time driven scalability options

## Contracts and Edge Cases

- Contracts
  - Screen contract: mount(host), unmount(), optional onShow/onHide
  - Storage contract: readJson<T>(key), writeJson(key, data), delete(key)
  - Graphics facade: setPreset(preset), setAntialias(bool), setShadows(bool)
- Edge Cases
  - Missing/invalid settings file -> defaults applied, migrated, and saved
  - Renderer running in pure web context -> falls back to BrowserStorage
  - Window resize and DPR changes handled by `ThreeRenderer`

---

This document is a living map of the client. If you add a new capability (input, audio, networking), prefer defining a port in domain/application and implementing an adapter in infrastructure.
