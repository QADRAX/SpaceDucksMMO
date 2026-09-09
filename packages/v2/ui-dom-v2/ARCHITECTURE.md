# @duckengine/ui-dom-v2 — Architecture

Web DOM implementation of UI ports for Duck Engine v2.

## Role

| Concern | Owns |
|---------|------|
| Surface host | `createDomUISurfaceHost` (viewport overlay attach) |
| Duck view runtime | `createDomUIViewRuntime` + `renderUiNodeTree` (default kit) |
| Composition helper | `createDefaultWebUIPorts` |

Depends only on `@duckengine/core-v2` (implements core UI ports).

## Non-goals

- ECS reconcile / scene subsystem — `@duckengine/ui-base-v2`
- Non-DOM hosts (canvas, native) — future sibling packages
- Composition roots wire `ui-base-v2` + this package directly
