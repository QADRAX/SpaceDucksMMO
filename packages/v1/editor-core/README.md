# @duckengine/editor-core

This package isolates the core state, logic, and scripting sandbox required for the DuckEngine Scene Editor, keeping it entirely decoupled from React or any frontend rendering framework.

## Architecture: Multi-Viewport & Editor Entities

The editor is designed to compose scenes dynamically using multiple views (viewports). The core philosophy is that **all viewports look at, interact with, and compose upon the exact same single `IScene` (the main game scene).**

There is no concept of separate "Sub-Scenes". Instead, we use logical grouping within the main ECS world.

### Editor Entities

To provide tools (like a free-flying WASD camera, a transform gizmo, or a grid) without polluting the actual game data, we inject **Editor Entities** directly into the `mainScene`.

-   An **Editor Entity** is a standard ECS `Entity`.
-   It uses standard ECS components (e.g., a `CameraViewComponent` and a `ScriptSlotComponent` running `editor_camera_controller.lua`).
-   What makes it special is that it is *tracked* by the Editor Engine and marked so it **will not be serialized** when saving the game scene.

### Editor Viewports

An `EditorViewport` represents a single functional window or panel in the UI (e.g., "Main Game View", "Scene Editor View 1").

-   Each `EditorViewport` tracks its own specific subset of **Editor Entities**.
-   When a viewport is opened, it might spawn its own Editor Entity Camera.
-   When a viewport is closed, the `ViewportManager` automatically finds and destroys all Editor Entities associated with that specific viewport.

By relying entirely on the standard `IScene` and ECS, the editor enjoys the exact same performance and capabilities as the runtime game engine, ensuring a 1:1 "What You See Is What You Play" representation.
