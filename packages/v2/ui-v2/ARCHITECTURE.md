# @duckengine/ui-v2 — Architecture

Default **Duck UI** projection for Duck Engine v2. Implements the runtime side of
`docs/v2-ui-system-contract.md`: ECS UI roots → host-agnostic ports → surfaces.

## Role

| Layer | Owns |
|-------|------|
| **core-v2** | `transform2d`, `uiView`, `uiSpa`, `UiTarget`, UI ports |
| **ui-v2** | Scene subsystem, reconcile, recording/memory adapters, (later) default kit + web DOM |
| **Composition roots** | Bind ports + `createUISubsystem()` |

## Logical view

```
Entity (transform2d + uiView|uiSpa)
  → resolveUiTargetViewports(uiTarget)
  → UISurfaceHostPort.getSurface(viewportId)
  → UIViewRuntimePort | UISpaRuntimePort mount/update/unmount
```

## Process view

- Events: `scene-setup`, entity/component/hierarchy changes → `reconcileUiRoots`
- Phase: `lateUpdate` → `reconcileUiRoots` (picks up viewport enable flips without events)
- Teardown: `unmountAllUiRoots`

## Non-goals (this package phase)

- Full Duck kit widgets (column/text/button paint) — stub/recording first
- React SPA loader — port contract only; web adapter follows
- Lua `UI.*` bridge — scripting-lua follow-up
