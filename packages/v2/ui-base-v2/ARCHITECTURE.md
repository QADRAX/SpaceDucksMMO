# @duckengine/ui-base-v2 — Architecture

Host-agnostic UI projection for Duck Engine v2. Implements the runtime side of
`docs/v2-ui-system-contract.md` without any DOM/paint vendor.

## Role

| Layer | Owns |
|-------|------|
| **domain** | `UISubsystemState`, `layoutFromTransform2d` |
| **application** | `reconcileUiRoots`, `unmountAllUiRoots` |
| **infrastructure** | `createUISubsystem`, memory/recording port adapters |

## Non-goals

- DOM/Preact paint — see `@duckengine/ui-preact-v2`
- SPA loaders / React — separate host packages later
- Composition-root wiring — bind base subsystem + host ports in engine-web / harness
