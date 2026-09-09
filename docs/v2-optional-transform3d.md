# Optional `transform3d` — Design Contract (v2)

Pose 3D is no longer baked into every entity. It is an optional ECS component.

## Entity model

```
EntityState = id + hierarchy (parent/children) + components + presentation/debug
```

- **No** `entity.transform` field.
- Logical hierarchy exists without pose (folders, system entities).
- World pose exists only when the entity has component `transform3d`.

## Component `transform3d`

- Unique per entity.
- **The component is the pose** (local/world TRS, dirty, parent-pose link, change callbacks) — no nested `state` bag.
- Keeps `ComponentBase.enabled`. Runtime code should use `getTransform3d(entity)`, which returns **`undefined` when missing or disabled** (null-logic — no per-callsite `.enabled` checks). Authoring/inspector can still read a disabled pose via `getComponent(entity, 'transform3d')`.
- Read/write via module functions: `getPosition(t)`, `getScale(t)`, `getRotation` / `getAngle(t)`, `setPosition(t, …)`, etc. (`t = getTransform3d(entity)`).
- Inspector / YAML expose local position, rotation (Euler YXZ), scale.
- Created via `createComponent('transform3d')` or YAML sugar.

## Hierarchy vs pose chain

| Concern | Rule |
|---------|------|
| Entity parent/children | Always logical grouping |
| Pose parent | Nearest **ancestor entity** that also has `transform3d` |
| Parent without pose | Child with `transform3d` treats world = local (until an ancestor with pose exists) |

`addChild` / `removeChild` / add|remove `transform3d` **reconcile** pose parent links for the node and affected descendants.

## Who requires `transform3d`

**Requires:** geometries (world meshes), cameras, `rigidBody`, `directionalLight` / `pointLight` / `spotLight`.

**Does not require:** `ambientLight`, `gravity`, `skybox`, `name`, and other scene-unique data without pose.

## YAML

- Top-level `transform:` is **sugar**: ensures `transform3d` and sets locals.
- `components.transform3d` is also valid.
- **Invalid:** both `transform:` and `components.transform3d` on the same entity.
- Entities with only `ambientLight` / `gravity` / etc. omit transform → no component.

## Scripting / API

- `entity.transform` (Lua EntityAPI / JS) is `null` when the component is missing **or disabled**.
- Lua pose facade: `self.Transform` / `entity.components.transform` (alias `transform3d`) — use `has()`; getters return `nil`, setters return `false` when inactive.
- Spatial builtins must early-return when there is no active pose (no silent identity).

## Follow-ups (out of scope)

- `transform2d` + `uiHost` (SPA-as-entity).
- UI slot authoring migration.
