# UI System — Design Contract (v2)

Screen-space UI for Duck Engine: ECS hosts **UI roots**; visual trees live **under** content components; painting is **host-agnostic** via ports. Web (DOM/CSS) is the first host; other hosts (canvas, native, headless) implement the same contracts without HTML.

**Status:** design contract; legacy `scene.uiSlots` removed from core (implementation in progress).  
**Related:** `docs/v2-optional-transform3d.md` (optional world pose).  
**Supersedes:** scene-level `uiSlots` / DOM-shaped `UIRendererPort` (deleted).

---

## 1. Goals and non-goals

### Goals

- **G1** — Paint UI on chosen viewport surface(s) of a scene (multi-viewport / split-screen via `uiTarget`).
- **G2** — First-party **Duck UI** (`uiView`) configurable from scene YAML/prefabs.
- **G3** — **Custom SPA** as a first-class **resource** + component (`uiSpa`), with instance `props` in the scene contract and Lua.
- **G4** — One Lua/JS **UI** surface that operates both Duck UI and custom SPA.
- **G5** — Engine ships a **default UI kit** (`ui-v2`); composition roots wire it by default; ports remain replaceable.
- **G6** — Host-agnostic ports: web today; non-HTML hosts later without changing ECS contracts.

### Non-goals

- 2D gameplay world, 2D physics, or 2D rigid bodies (`transform2d` is **screen UI only**; “2D games” use fake-2D in 3D + `transform3d`).
- React/DOM/CSS inside `core-v2` domain or application.
- One ECS entity per button/label (visual hierarchy is **not** the entity tree).
- Class inheritance of UI “components” in the ECS sense.

---

## 2. Two hierarchies

| Tree | Owns | Lifetime |
|------|------|----------|
| **Entity hierarchy (ECS)** | Scene graph, scripts, prefabs, coarse UI **roots** / layers | Scene |
| **View hierarchy (UI document)** | Layout boxes, builtins, controls inside a root | Owned by `uiView` (or by the SPA runtime under `uiSpa`) |

**Rule:** Entity children are for **other roots / layers / tools**, not for every widget. Widgets and layout boxes live in the view tree (Duck) or inside the SPA.

```
Entity "hud"           transform2d + uiView | uiSpa  (+ script?)
  └─ (no entity children required)
       view tree / SPA internal tree  →  layout + paint via UI ports
```

---

## 3. ECS components

### 3.1 `transform2d` — screen-space root box

- Optional, unique per entity.
- **Screen participation** via `ComponentBase.enabled` (same null-logic pattern as `transform3d`):
  - `getTransform2d(entity)` → active pose/box only when present **and** enabled.
  - Disabled → out of screen space; UI projection unmounts / skips; no view participation.
- Expresses the **root** rectangle in **viewport space** (normalized 0–1 unless a later unit mode is added): position, size, rotation Z, scale, anchor/pivot, stacking order (`zIndex` or equivalent).
- Pose parent for nested **UI root entities**: nearest ancestor with **active** `transform2d` (parallel to `transform3d` pose chain). Independent of the 3D pose chain.
- **Does not require** `transform3d`. UI roots typically have no world pose.
- **Does not** participate in physics or 3D render sync.

YAML sugar (optional, same idea as `transform:` → `transform3d`): top-level `transform2d:` vs `components.transform2d` — not both.

### 3.2 `uiView` — default Duck UI

- Unique per entity (phase 1: mutually exclusive with `uiSpa` on the same entity; see §3.4).
- Holds the **Duck UI document** (view tree) and data bindings.

Conceptual shape:

```text
uiView {
  enabled                 // content participation (mount/update); distinct from transform2d.enabled
  document                // inline tree OR ResourceRef<'uiDocument'>
  bindings                // Record<path|key, serializable> — scene + Lua writable
  uiTarget                // viewport filter query (see §3.6); default {} = all scene viewports
}
```

- **View tree:** nodes with `id?`, `type` (kit type id, e.g. `column`, `text`, `button`, `progress`), `props`, `children`.
- Layout (`row` / `column` / `grid` / …) is **node types** in this tree, resolved by the Duck UI runtime — not ECS components.
- `bindings` / node props: serializable only (numbers, strings, bools, plain tables/arrays). No functions in scene data.
- Requires **presence** of `transform2d` (structurally). Runtime uses active `getTransform2d`; if pose disabled, view does not paint.

### 3.3 `uiSpa` — custom SPA (resource-backed)

- Unique per entity (phase 1: XOR with `uiView`).
- Parallel to `script`: **resource reference + per-instance props**.

Conceptual shape:

```text
uiSpa {
  enabled
  spa: ResourceRef<'spa'>     // asset key/kind/version
  props: Record<string, unknown>   // instance config — YAML + Lua
  uiTarget                         // same filter as uiView (§3.6)
}
```

- **Not** a free-string `moduleId` in a facade registry as the primary contract.
- Props are part of the **scene contract**; Lua may read/write them; the host adapter pushes updates into the running SPA.
- Requires presence of `transform2d` (same as `uiView`).

### 3.4 Coexistence rules (phase 1)

| Rule | Phase 1 |
|------|---------|
| `uiView` + `uiSpa` on same entity | **Invalid** (one content backend per root) |
| Neither content component | Valid: layout-only / folder root with `transform2d` only (groups child **entity** roots) |
| `script` + UI content | Allowed: scripts drive `UI.*` |

Later phases may allow composition (e.g. Duck chrome + SPA body); out of scope for this contract.

### 3.5 Legacy `scene.uiSlots`

- Removed from `core-v2`. Do not reintroduce slot maps or DOM-coupled renderer ports in core.
- Replacement: ECS UI roots per this contract.

### 3.6 Multi-viewport target (`uiTarget`)

“Where does this UI paint?” is answered by a **generic viewport filter**, shared by `uiView` and `uiSpa`. There is **no** `mode: 'all' | 'primary' | 'viewport'` enum.

In Duck, a **screen** for UI purposes is a **viewport** (`sceneId` + `cameraEntityId` + `canvasId` + rect). Multi-screen / split-screen / editor+game = multiple viewports (possibly multiple canvases).

#### Shape

```text
UiTarget {
  viewportIds?: ViewportId[]   // explicit viewport ids
  cameraIds?: EntityId[]       // viewports whose cameraEntityId is listed
  cameraTags?: string[]        // viewports whose camera entity has any of these tags
}
```

- Default / omitted / `{}` → **all enabled viewports** of the UI root’s scene.
- Same field name and semantics on `uiView` and `uiSpa`.
- `transform2d` stays layout-only (rect in the surface where the root is mounted); it does **not** store the target.

#### Resolution algorithm

1. Candidate set = engine viewports with `enabled === true` and `sceneId` equal to the UI entity’s scene.
2. If `uiTarget` has **no** non-empty filter lists → use the full candidate set.
3. Otherwise a candidate viewport **matches** if it satisfies **any** non-empty criterion group (OR across groups):
   - its `id` is in `viewportIds`, **or**
   - its `cameraEntityId` is in `cameraIds`, **or**
   - its camera entity has **at least one** tag in `cameraTags` (OR within the tag list).
4. Projection mounts/updates the root on each matching viewport’s UI surface; unmounts when a viewport stops matching (disabled, removed, filter change, teardown).

#### Authoring guidance

| Intent | `uiTarget` |
|--------|------------|
| Every screen of this scene | `{}` / omit |
| Split-screen P1 HUD | `{ cameraTags: ['player-1'] }` (preferred) |
| One known viewport | `{ viewportIds: ['vp-main'] }` |
| Bind to a camera entity | `{ cameraIds: [camEntityId] }` |
| Shared watermark | `{}` / omit |

- **Camera tags** are the preferred gameplay/authoring path (cameras are scene entities; viewports are engine plumbing).
- **`viewportIds`** is the precise escape hatch (tools, tests, editor wiring).
- Targeting by camera (tags/ids) is preferred over inventing a magic “primary” viewport.

#### Entity tags dependency

`cameraTags` assumes **entity tags** are queryable on the camera entity (same notion as scene `findByTag` / future first-class tags). Until tags are fully first-class in ECS, implementations may bridge via the existing tag lookup hook; the UI contract still specifies **camera entity tags** as the stable authoring concept.

#### Non-goals for targeting

- Do not key UI primarily to `cameraEntityId` without going through viewports (paint destination is always a viewport surface).
- Do not put `uiTarget` on `transform2d`.
- Do not require one ECS entity per widget per viewport; one root + filter is enough unless scripts/data must differ per screen.

---

## 4. Resources

### 4.1 New `ResourceKind`s

| Kind | Purpose |
|------|---------|
| `spa` | Custom UI application asset (entry + metadata). Resolved like other resources. |
| `uiDocument` | Reusable Duck UI tree (YAML/JSON document). Optional; inline `uiView.document` tree remains valid. |

Exact file slots / persistence schemas are **implementation**; the contract only requires stable `ResourceRef` identity (`key`, `kind`, optional version).

### 4.2 SPA resource (conceptual)

- Declares how the host loads the app (e.g. entry module). Host-specific packaging is adapter concern.
- Engine core treats it as an opaque resolvable asset; **does not** parse React/framework graphs.

### 4.3 Default kit vs resources

- Duck UI **node types** (`column`, `text`, `button`, …) are provided by **`ui-v2` default kit**, not as `ResourceKind`s.
- Custom game UIs that need a full app surface use **`spa` resources**.
- Games may still ship reusable `uiDocument` resources for shared Duck layouts.

---

## 5. Port / adapter model (host-agnostic)

Painting never lives in core domain rules. Core (or `ui-v2` application layer) **projects** UI roots into port calls.

### 5.1 Separation

```
core-v2          → ECS: transform2d, uiView, uiSpa, ids, events, projection inputs
ui-v2            → Duck document runtime, default kit, reconcile, default port wiring helpers
Host adapter     → Web DOM | Canvas | Native | Test double
Composition root → engine-web-v2 / harness: bind default adapter + kit (overridable)
```

### 5.2 Surface ports (conceptual contracts)

Names are indicative; implementations must preserve **roles**, not necessarily final TypeScript identifiers.

#### A. `UISurfaceHostPort` (overlay / surface provider)

- Provides a **host surface** per viewport (or engine-defined target) where UI roots attach.
- **Web:** typically a DOM overlay container (evolves today’s `ViewportOverlayProviderPort`).
- **Non-web:** a canvas layer id, native view handle, or abstract surface id — **not** `HTMLElement` in the port’s public contract long-term.
- Core/ui logic addresses surfaces by **viewport / surface id**, not by DOM types.

#### B. `UIViewRuntimePort` (Duck UI backend)

- Mount / update / unmount a **Duck UI document** for an entity root into a surface region (rect from `transform2d`).
- Applies layout for the view tree; paints default kit controls.
- Receives **bindings/prop patches** and reports **UI events** (node id + event name + payload) back into the engine event path.
- Default implementation: shipped in `ui-v2` for web; replaceable for other hosts (immediate-mode canvas kit, etc.).

#### C. `UISpaRuntimePort` (custom SPA backend)

- Given a **resolved `spa` resource** + **instance props** + **layout rect** + **entity id**, mount/update/unmount the custom app on the surface.
- **Host adapter contract** (what the SPA author programs against), conceptual:

```text
SpaMountContext {
  entityId
  props                          // initial snapshot from uiSpa.props
  onProps(listener)              // engine/Lua changed props
  emit(eventName, payload)       // SPA → scripts / bus
  // optional: requestClose, locale, theme tokens — later
}
```

- Adapter responsibilities:
  - Load entry from resolved resource.
  - Attach to the surface region for that root.
  - Push prop updates when ECS/`UI.setProps` changes.
  - Forward SPA `emit` into the scene/script event channel.
- **Web default:** DOM/React/Preact/vanilla adapter implementing this port.
- **Other host:** same port, different mount technology (no HTML/CSS required by the contract).

#### D. Projection / subsystem

- Watches scene UI roots (active `transform2d` + enabled `uiView`|`uiSpa`).
- Resolves **target viewports** via `uiTarget` (§3.6); mounts once per matching viewport surface.
- Computes root rect in that surface’s space; calls the appropriate runtime port with `viewportId`.
- On filter/viewport/disable/remove/teardown changes → mount, update, or unmount as needed.
- Does not know React, CSS, or canvas APIs.

### 5.3 Default vs override

| Level | Behavior |
|-------|----------|
| Default (`engine-web-v2`) | `ui-v2` kit + web `UIViewRuntimePort` + web `UISpaRuntimePort` + overlay host |
| Extend | Register/override Duck **node types** inside the kit (product API of `ui-v2`) |
| Replace | Bind alternate port implementations at setup (canvas UI, native, mocks) |
| Headless / tests | No-op or recording ports |

The consumer is **not** required to supply SPA mounting to get Duck UI; custom SPAs require resources + the SPA runtime port (default web adapter is enough for typical games).

### 5.4 Evolution from former `UIRendererPort`

- Former DOM-shaped slot ports were **removed** from core.
- New work uses surface host + view runtime + spa runtime (roles in §5.2).

---

## 6. Duck UI document (default kit contract)

### 6.1 Node model

```text
UiNode {
  id?: string              // stable for Lua paths / events; required for addressable controls
  type: string             // kit type: "column" | "row" | "text" | "button" | …
  props?: JsonObject
  children?: UiNode[]
}
```

### 6.2 Layout

- Layout node types (`row`, `column`, `grid`, `stack`, …) size/position **child nodes** inside the root rect from `transform2d`.
- This is the supported form of “layout boxes” and visual composition (e.g. a button template as nested nodes or a kit composite type).
- **No** ECS component inheritance; composition is in the document / kit.

### 6.3 Default kit (`duck.*` / built-in `type`s)

- Shipped by `ui-v2`: at least layout primitives + text, panel, image, button, progress (exact catalog can grow).
- Theme/tokens: configurable at kit/runtime level (host may map tokens to CSS variables **or** to non-CSS paint params).
- Custom node types: kit extension API — still Duck UI, not new ECS components.

### 6.4 Events

- User/toolkit events bubble to the engine as: `{ entityId, targetId?, eventName, payload }`.
- Lua subscribes via unified `UI.on` (see §7).

---

## 7. Scripting contract (unified `UI` API)

Works for **both** `uiView` and `uiSpa` on the entity (soft null-logic if missing/disabled content or inactive `transform2d`).

| Concern | API (conceptual) | `uiView` | `uiSpa` |
|---------|------------------|----------|---------|
| Presence | `UI.has()` | has enabled `uiView` | has enabled `uiSpa` |
| Instance data | `getProp` / `setProp` / `setProps` | `bindings` (+ documented aliases) | `uiSpa.props` |
| Tree paths | `get(path)` / `set(path, value)` | node props/bindings by `id` path | optional no-op / err if unsupported |
| Events in | `on(eventName, cb)` | node events (`id.event` or filtered) | SPA `emit` names |
| Events out | `emit(eventName, payload)` | toward view runtime | toward SPA `onProps`/custom channel as defined by adapter |
| Viewport target | `getTarget` / `setTarget` / `clearTarget` | `uiView.uiTarget` | `uiSpa.uiTarget` |
| Target test | `targetsViewport(viewportId)` | resolves §3.6 filter | same |
| Enable content | `setEnabled` / via `Component` | `uiView.enabled` | `uiSpa.enabled` |
| Screen box | `Transform2D.*` | same | same |

**Target API (conceptual Lua):**

```lua
self.UI.setTarget({})                                      -- all scene viewports
self.UI.clearTarget()                                      -- alias of empty filter
self.UI.setTarget({ cameraTags = { 'player-1' } })
self.UI.setTarget({ viewportIds = { 'vp-main' } })
self.UI.setTarget({ cameraIds = { camEntityId } })
local t = self.UI.getTarget()
local paints = self.UI.targetsViewport('vp-main')
```

**Rules:**

- Scene YAML may set initial `uiSpa.props` / `uiView.bindings` / `uiTarget`; Lua mutates at runtime; adapter/runtime must observe updates (including retarget → remount on newly matched viewports).
- Payloads and props remain **JSON-serializable**.
- `Transform` / `transform3d` stay unrelated; UI entities typically expose `transform === null` in 3D APIs.

---

## 8. Authoring examples (illustrative)

### Duck UI root (all viewports of the scene)

```yaml
- id: hud
  components:
    transform2d: { position: [0, 0], size: [1, 1], zIndex: 0 }
    uiView:
      uiTarget: {}
      document:
        id: root
        type: column
        props: { gap: 0.01, padding: 0.02 }
        children:
          - id: hp
            type: progress
            props: { value: 1, label: HP }
      bindings:
        hp.value: 1
    script:
      scripts: [{ scriptId: hud-ctrl, enabled: true, properties: {} }]
```

### Split-screen HUD via camera tags

```yaml
- id: cam-p1
  # … transform3d + cameraPerspective …
  tags: [player-1, hud]

- id: hud-p1
  components:
    transform2d: { size: [1, 1] }
    uiView:
      uiTarget:
        cameraTags: [player-1]
      document: { type: column, children: [] }
```

### Custom SPA on an explicit viewport

```yaml
- id: inventory
  components:
    transform2d: { position: [0.7, 0.1], size: [0.28, 0.6], zIndex: 10 }
    uiSpa:
      uiTarget:
        viewportIds: [vp-main]
      spa: { key: ui/inventory, kind: spa }
      props:
        capacity: 20
        filter: all
```

---

## 9. Package responsibilities

| Package | Responsibility |
|---------|----------------|
| `core-v2` | Types/components `transform2d`, `uiView`, `uiSpa`; resource kinds; projection inputs; host-agnostic port **interfaces**; no vendor UI |
| `ui-v2` (new) | Duck document runtime, default kit, reconcile helpers, **default web adapters** (optional split later) |
| `engine-web-v2` / harness | Wire defaults; allow port/kit overrides |
| `scripting-lua` | `Transform2D` + `UI` bridges |
| Game / tools | Author `spa` / `uiDocument` resources; optional kit node extensions |

---

## 10. Coherence summary

| Question | Answer in this contract |
|----------|-------------------------|
| Where is layout hierarchy? | Under `uiView` document (or inside SPA), **not** per-widget entities |
| How does engine ship UI? | Default kit + web adapters in `ui-v2`, wired by composition roots |
| How are SPAs configured? | `ResourceKind: 'spa'` + `uiSpa.props` in scene + Lua `UI.setProps` |
| Which screen paints the UI? | `uiTarget` filter (§3.6): empty = all scene viewports; else `viewportIds` / `cameraIds` / `cameraTags` |
| What does infra implement? | `UISurfaceHostPort` + `UIViewRuntimePort` + `UISpaRuntimePort` (roles) |
| HTML required? | **No** at contract level; web adapters use DOM; other hosts reimplement ports |
| 2D games? | Fake-2D with `transform3d`; not `transform2d` |
| Legacy slots? | Removed; ECS UI roots only |

---

## 11. Out of scope / follow-ups

- Exact TypeScript port method lists and DTO field names.
- Persistence schemas for `spa` / `uiDocument` zip slots.
- Prefab variants for UI documents.
- Full accessibility / focus navigation spec.
- Allowing `uiView` + `uiSpa` on one entity.
- First-class entity tags ECS module (needed for durable `cameraTags`; today may use scripting tag hooks).
- Optional `exclude` filters / `viewportTags` on viewport state.
- Editor integration for view-tree vs entity hierarchy UX.
