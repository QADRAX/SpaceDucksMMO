# @duckengine/ui-preact-v2 — Architecture

Preact host for Duck Engine UI.

## Role

| Concern | Owns |
|---------|------|
| Surface host | `createDomUISurfaceHost` (viewport overlay) |
| Duck default | `createPreactUIViewRuntime` — `uiView` documents via Preact kit |
| Custom formula | `createPreactCustomUI` — register Preact components for `uiCustom` |
| Composition | `createDefaultWebUIPorts` |

Shared projection stays in `@duckengine/ui-base-v2` (delegate to these ports).

## Non-goals

- ECS reconcile — `ui-base-v2`
- Hand-rolled DOM kit (Preact owns the DOM)
