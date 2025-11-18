Frontend UI Style Guide – SpaceDucksMMO

This document defines UI coding standards for the SpaceDucksMMO client, with a focus on inspector / scene tooling and Preact components.

Applies to all code under:

packages/client/src/infrastructure/ui/**

1. Tech & Architecture

Framework: Preact + TypeScript.

Component style: Function components only (no class components).

State management inside UI: Preact hooks (useState, useEffect, useMemo, etc.).

Dependency injection: Through hooks:

useServices() for app services (sceneManager, textureManager, etc.).

useI18n() for localization.

UI layering pattern: Atomic design:

Atoms: The smallest visual pieces (inputs, buttons, icons, labels).

Molecules: Composition of atoms (SelectField, TreeView, Vector3Input, TransformGroup, etc.).

Organisms: Larger composite components (SceneInspectorPanel, SceneHierarchyTree, ComponentInspector, TransformEditor, etc.).

Rule:
Whenever functionality is reusable across multiple screens, extract it to a molecule or atom instead of reimplementing inline in an organism.

2. File & Naming Conventions
2.1 Components

One main component per file.

File naming: PascalCase:

TransformEditor.tsx

SceneHierarchyTree.tsx

SelectField.tsx

Component names must match the file name:

TransformEditor.tsx → export function TransformEditor(...).

Tests:

Same name + .test.tsx in the same folder:

TransformEditor.tsx

TransformEditor.test.tsx

2.2 Folder structure

Atoms:
components/common/atoms/…

Molecules:
components/common/molecules/…

Organisms:
components/**/organisms/… (e.g. inspector/organisms).

Feature-specific molecules/atoms can live under their feature folder if they’re not generic, but prefer common when reasonably reusable.

2.3 Imports

Prefer absolute imports for shared domain things:

@client/domain/...

Prefer relative imports inside a feature folder:

../molecules/ComponentFieldList

../../common/molecules/Vector3Input

3. TypeScript & Props
3.1 Props typing

Always define a dedicated Props type:

type Props = {
  entity: Entity;
  services: Services;
  onAdded: () => void;
};


Do not use any for props when the type is known or can be reasonably defined.

If you truly need a generic component, use generics:

export type SelectOption<T = string> = {
  value: T;
  label: string;
  icon?: preact.ComponentChildren;
};

3.2 Props order

Inside the Props type and in the component signature, keep a consistent order:

Domain objects / data (entity, components, entities, value).

Services / context-like (services?).

Behavioral callbacks (onChange, onSelect, onError, onAdded, onRemove).

Visual / configuration (className, placeholder, theme, label).

Example:

type Props = {
  entities: Entity[];
  selectedId?: string | null;
  services?: Services;
  onSelect?: (id: string | null) => void;
  onError?: (msg: string) => void;
  className?: string;
};

4. Hooks & Effects
4.1 useEffect subscriptions

When subscribing to services (sceneManager, i18n, etc.):

Always unsubscribe in the cleanup.

Wrap cleanup in a try { ... } catch {} if the external API might throw.

Pattern:

useEffect(() => {
  const mgr = services.sceneManager;
  if (!mgr) return;

  const unsub = mgr.subscribeToSceneChanges((ev) => {
    // handle event
  });

  return () => {
    try {
      unsub && unsub();
    } catch {}
  };
}, [services.sceneManager]);

4.2 Local component state

Prefer useState for UI-derived state (selected id, query, expanded nodes…).

Derive state from props or services when possible (avoid duplicating data unnecessarily).

For derived data: use useMemo instead of recomputing on every render when it’s non-trivial.

Example:

const roots = useMemo(
  () => entities.filter((e) => !e.parent),
  [entities]
);

5. Services & i18n
5.1 Accessing services

Use useServices() in organisms/molecules that need services:

const services = useServices();
const sceneManager = services.sceneManager;


Do not import services as singletons or access them via globals from UI components.

5.2 i18n usage

Use useI18n():

const { t } = useI18n();


Translation pattern always: t("namespace.key", "Human readable fallback").

Example:

<div className="small-label">
  {t("inspector.components", "Components")}
</div>


Keys should be namespaced logically:

inspector.components

inspector.noEntitySelected

inspector.hierarchy

6. UI Patterns & Reusable Components
6.1 Tree View (Hierarchy)

Use a reusable TreeView molecule for hierarchical data.

Features:

Expand/collapse per node.

Indentation per depth level.

Optional icon per node.

selectedId + onSelect for selection.

Optional drag & drop (draggable, onDropNode).

All tree-like structures (entity hierarchy, texture folder hierarchy, etc.) must use this TreeView instead of hand-coded nested <div> loops.

6.2 Dropdowns / selects

Use a SelectField molecule for all dropdowns:

CameraSelector

ReferenceField

AddComponentSection

Any other inspector select input.

SelectField props:

type SelectFieldProps<T = string> = {
  value: T | null;
  options: SelectOption<T>[];
  placeholder?: string;
  onChange: (value: T | null) => void;
  className?: string;
};


Rules:

No raw <select> in organisms; they must go through SelectField.

Select options should support icons (camera icon for cameras, entity icon for entities, etc.).

Use the same base class (.select-input or .select-field) for consistent styling.

6.3 TextureSelector

TextureSelector must:

Use services (e.g. textureManager) to fetch a tree of folders/textures.

Render a hierarchical view (using TreeView or a similar pattern).

Show folder and texture icons.

Allow filtering via search query.

Highlight the selected texture.

No flat, hard-coded textures: string[] = [] in production code; tests can mock the service.

6.4 Icons

Introduce icon atoms:

EntityIcon: shows a different icon for camera entities, lights, default entities, etc.

ComponentIcon: maps component types (transform, boxGeometry, standardMaterial, etc.) to icons.

Usage:

In ComponentSection headers: component icon + name.

In TransformEditor: transform icon (gears / sliders).

In TreeView nodes: EntityIcon is used as icon for each node.

Consistent icon usage makes the inspector easier to scan.

7. CSS & Styling
7.1 General rules

Prefer CSS classes in .css files instead of inline styles.

Inline styles are allowed only for very simple, one-off layout tweaks; if a pattern repeats, extract a class.

Use className in JSX (never class).

7.2 Existing base classes

Reuse these existing classes and extend them rather than inventing new ones:

Layout:

.scene-inspector

.inspector-left

.inspector-right

.inspector-toolbar

Text / labels:

.small-label for subtle labels and helper texts.

.error-box for errors.

Forms:

.select-input

.text-input

.num-input

Properties:

.prop-row

.prop-key

.prop-value

Components:

.component-section

.component-header

.component-controls

Hierarchy:

.entity-item

.entity-item.selected

.entity-children

(for TreeView) .tree-node, .tree-node--selected, .tree-node--drag-over, .tree-node-icon, .tree-node-label.

Any new inspector-related styling should be consistent with these colors, radii, and spacing.

7.3 Spacing & layout

Vertical spacing between sections: margin-bottom: 6–8px.

Padding inside sections: padding: 6–8px.

Use flexbox for rows with label + control:

.prop-row { display: flex; gap: 8px; align-items: center; }

Use indentation for hierarchical levels:

Use padding-left increments per level (e.g. 12px per depth).

7.4 Colors & theming

Reuse existing colors from inspector.css:

Text color: #eee / #ccc.

Selected backgrounds: rgba(80, 140, 220, 0.14).

Errors: #3a1f1f background, #ffb3b3 text.

Do not introduce random new colors unless they follow a documented design scheme.

8. Behavior & Error Handling
8.1 Error handling

Prefer showing errors in the UI over alert:

Use lastError state + .error-box for inspector errors.

Keep alert only as a fallback for truly unexpected failures when you cannot surface the error in the UI.

8.2 Scene events

sceneManager is the source of truth for:

Entity list.

Active camera.

Errors/events in the scene (e.g. failed reparent).

Rules:

Always subscribe to sceneManager.subscribeToSceneChanges in organisms that need to react to scene changes.

Events like "entity-added", "entity-removed", "hierarchy-changed", "component-changed", "active-camera-changed", and "error" should be handled as follows:

Update local state when relevant.

For errors: update lastError or call onError.

8.3 Drag & drop

Drag & drop for hierarchy reparenting must:

Use HTML5 DnD (draggable, onDragStart, onDrop, etc.).

Encode the dragged entity id using dataTransfer.setData("application/x-entity-id", id).

Highlight drop targets with .tree-node--drag-over.

Call sceneManager.reparentEntityResult(childId, newParentId) when dropping.

9. Testing
9.1 Testing stack

Use @testing-library/preact + Jest.

Tests live next to their components (*.test.tsx).

9.2 Testing style

Test behavior, not implementation details:

What is rendered.

How the component responds to user input (clicks, changes).

Effects on external objects (e.g. entity transform, scene manager calls).

Examples:

Component is rendered and displays expected labels.

Changing a number input updates the underlying component:

fireEvent.input(numberInput, { target: { value: "2" } });
expect(boxComp.width).toBe(2);


Drag & drop triggers reparenting:

expect(mockSceneManager.reparentEntityResult).toHaveBeenCalledWith("B", "A");

9.3 Mocks

Always mock i18n and sceneManager in tests that depend on them:

Mock t to return fallback labels: (k, fallback) => fallback || k.

Mock subscribeToSceneChanges to return a no-op unsubscribe: () => jest.fn().

10. Accessibility & Semantics

Use semantic elements and roles when possible:

Dropdowns: native <select> (inside SelectField) for keyboard/accessibility.

TreeView: consider role="tree" and role="treeitem" if feasible.

Ensure:

Click targets are big enough (padding).

Focusable elements (inputs, buttons) are reachable via keyboard.

11. Miscellaneous Rules

Code comments must be in English.

Avoid “magic strings” sprinkled through UI:

Use translation keys + fallbacks.

Reuse types/enums for component types where they exist.

When adding new visual behavior, consider if it should be:

An atom (purely visual, no domain logic).

A molecule (UI behavior composable).

Or an organism (ties UI to domain/services).