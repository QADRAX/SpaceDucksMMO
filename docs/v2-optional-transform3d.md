# Optional `transform3d` — Design Contract (v2)

Pose 3D is no longer baked into every entity. It is an optional ECS component.

## Entity model

```
EntityState = id + hierarchy (parent/children) + components + presentation/debug
```

- **No** `entity.transform` field.
- Logical hierarchy exists without pose (folders, system entities).
- World pose exists only when the entity has an **active** `transform3d` (`getTransform3d`).

## Component `transform3d`

- Unique per entity.
- **The component is the pose** (local/world TRS, dirty, parent-pose link, change callbacks) — no nested `state` bag.
- `ComponentBase.enabled` = **spatial participation** (not a soft “mute animation” flag):
  - **`enabled: false`** → out of space: `getTransform3d` is `undefined`; no render participation; physics **removes** the rigid body (velocity lost); children re-link pose to the next **active** ancestor; scripts treat pose as absent.
  - **`enabled: true`** → re-enter space from stored locals; physics **recreates** body at ECS pose (no prior impulse); render sync resumes.
- Runtime: `getTransform3d(entity)` (null-logic). Authoring: `getComponent(entity, 'transform3d')` / `getTransform3dComponent` even while disabled.
- Read/write helpers: `getPosition(t)`, `getScale(t)`, `getRotation` / `getAngle(t)`, `setPosition(t, …)`, etc.
- Inspector / YAML expose local position, rotation (Euler YXZ), scale.
- Created via `createComponent('transform3d')` or YAML sugar.

## Hierarchy vs pose chain

| Concern | Rule |
|---------|------|
| Entity parent/children | Always logical grouping |
| Pose parent | Nearest **ancestor** with an **active** `transform3d` |
| Parent missing/disabled pose | Child with active pose treats world = local (until an active ancestor exists) |

`addChild` / `removeChild` / add|remove|enable-toggle `transform3d` **reconcile** pose parent links for the node and descendants (`reconcileTransform3dSubtree`).

## Who requires `transform3d`

**Requires (presence):** geometries, cameras, `rigidBody`, `directionalLight` / `pointLight` / `spotLight`.

**Does not require:** `ambientLight`, `gravity`, `skybox`, `name`, …

`requires` checks **presence**, not `enabled`. A disabled pose still satisfies requirements structurally; runtime systems no-op via `getTransform3d`.

## YAML / prefabs

- Top-level `transform:` is **sugar**: ensures `transform3d` and sets locals (mutates raw component if disabled — does not duplicate).
- `components.transform3d` is also valid.
- **Invalid:** both `transform:` and `components.transform3d` on the same entity.

## Scripting / API

- `entity.transform` (Lua EntityAPI / JS) is `null` when missing **or disabled**.
- Lua facade: `self.Transform` / `components.transform` / `components.transform3d` — `has()`; soft getters/setters.
- Lua toggle: `Transform.setEnabled(bool)` / `Transform.isEnabled()` (raw component; works while out of space). Also `Component.setEnabled(eid, 'transform3d', bool)`.
- Spatial builtins early-return when inactive.

## Follow-ups (out of scope)

- `transform2d` + `uiHost` (SPA-as-entity).
- UI slot authoring migration.
