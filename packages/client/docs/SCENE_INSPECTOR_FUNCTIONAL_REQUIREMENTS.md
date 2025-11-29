Scene Inspector – Functional Requirements

1. General Behavior

FR-1: Provide a UI panel showing the active ECS scene, entities, and components.

FR-2: Reflect ECS changes in real time (entities, components, hierarchy, properties).

FR-3: Edits in the inspector must update the scene instantly, and vice versa.

2. Entity Hierarchy

FR-4: Display a tree view of entities with parent/child relationships.

FR-5: Selecting an entity highlights it and loads its properties.

FR-6: Allow reparenting entities via drag & drop or dropdown, preventing cycles.

3. Component Management

FR-7: Show all components of the selected entity, grouped and collapsible.

FR-8: Allow adding valid components (respecting unique, requires, conflicts).

FR-9: Allow removing components with validation.

FR-10: Components must support enable/disable toggles.

4. Component Property Editing

FR-11: Display all editable fields: numbers, booleans, strings, enums, vectors, nested objects.

FR-12: Numeric fields must include:

Text input

Slider

Plus / minus buttons

FR-13: Vector fields must use grouped numeric controls.

FR-14: Boolean fields use toggle/checkbox.

FR-15: Enums use dropdowns.

FR-16: Nested component parameters must be editable recursively.

5. Transform Editing

FR-17: Show editable transform: position, rotation, scale (x/y/z).

FR-18: Transform changes apply immediately to the entity.

6. Scene & Camera Information

FR-19: Display scene name/id and whether an active camera exists.

FR-20: Allow selecting the active camera entity from the inspector.

7. Reference Selectors

FR-21: Entity references must use dropdowns listing available entities.

FR-22: Dropdowns must update dynamically when entities are added/removed.

FR-23: Deleted referenced entities must appear invalid and allow reselection.

FR-24: Dropdowns may filter options by compatible type.

FR-25: Texture references must use a texture selector dropdown.

FR-26: Texture options must come from a single central texture catalog.

FR-27: Texture dropdowns update dynamically when textures change.

FR-28: Missing/invalid textures must be highlighted.

8. Error Feedback

FR-29: Invalid operations must display clear error messages.

FR-30: Show a message when a scene is not inspectable.

9. UI / UX Requirements

FR-31: Component groups and transform sections must be collapsible.

FR-32: Inspector content must be scrollable when needed.

FR-33: Selected entities and invalid references must be visually highlighted.

FR-34: UI must update instantly on ECS changes.

FR-35: All UI text must use the localization system (no hardcoded strings).

FR-36: The inspector must be displayed inside the existing DraggablePanel component.