# Scene Inspector — Full Implementation Plan

This document describes the complete implementation plan for the **Scene Inspector** feature.  
The inspector allows developers to navigate, inspect, and modify entities and components inside the running ECS scene.

---

# 0. High-Level Architecture

The Scene Inspector is built on three layers:

1. **ECS Core Enhancements**  
   - Component enable/disable  
   - Component/transform change notifications  

2. **Scene Debug API via IScene**  
   - Optional: `getEntities()`  
   - Optional: `subscribeChanges()`  
   - Optional: `reparentEntity()`  

3. **Inspector UI**  
   - Preact UI mounted inside the existing `DraggablePanel`  
   - Entity hierarchy browser  
   - Component editor system  
   - Property controls (text input, slider, +/- buttons)  
   - Entity and texture selectors  
   - Full localization  
   - Fully reactive (no refresh button)

The inspector adapts to any scene that implements the optional debug interface.

---

# 1. ECS & Core Infrastructure

## 1.1 Component Enabled State

Add `enabled` flag to `Component`:

- `enabled` getter/setter  
- Setter triggers `notifyChanged()`  
- All systems must ignore disabled components

## 1.2 System Compatibility

Each ECS system must check:

```
if (!component || !component.enabled) continue;
```

## 1.3 Component & Transform Event Hooks

Tie component and transform updates to scene-level debug events via observers.

---

# 2. Scene Debug API

## 2.1 Extend IScene

Add optional debug capabilities:

```
getEntities?(): ReadonlyArray<Entity>
subscribeChanges?(listener): () => void
reparentEntity?(childId, newParentId | null): void
```

## 2.2 SceneChangeEvent

Unified event type:

- entity-added  
- entity-removed  
- hierarchy-changed  
- transform-changed  
- component-changed  

## 2.3 BaseScene Implementation

BaseScene implements:

- Listener set  
- `getEntities()`  
- `subscribeChanges()`  
- Notifications on:
  - addEntity
  - removeEntity
  - reparent
  - component change
  - transform change

---

# 3. SceneManager Integration

Expose `sceneManager` via UI services.  
Inspector checks:

```
if (scene.getEntities && scene.subscribeChanges)
```

If missing → scene not inspectable.

---

# 4. Inspector UI Skeleton

## 4.1 Base Component

`SceneInspectorPanel.tsx`:

- Inside `<DraggablePanel>`
- Accesses sceneManager
- Tracks entities, selected entity, inspectable flag

## 4.2 Live Updates

Use:

```
scene.subscribeChanges(...)
```

Update entity list reactively.

## 4.3 Keyboard Toggle

Bind to `F10` or similar.

---

# 5. Entity Tree & Hierarchy Editing

- Build tree from entities + parent/child relations  
- Render expandable tree view  
- Support drag/drop or dropdown reparenting  
- Call `scene.reparentEntity()`  

---

# 6. Component Management

- List components per entity  
- Enable/disable toggle  
- Add/remove components using registry  
- Auto-refresh based on events  

---

# 7. Property Editors

- Numeric input with slider and +/- buttons  
- Vector editors  
- Component-specific editors using a registry  

---

# 8. Reference Selectors

- Entity dropdowns (auto-refresh)  
- Texture selection dropdowns  

---

# 9. Localization

- All UI strings from i18n  
- Add translation keys  

---

# 10. Dev-Mode + Tests

- Inspector only in development mode  
- Unit tests for editors, toggles, add/remove  
- E2E tests for transform edits and hierarchy changes  
