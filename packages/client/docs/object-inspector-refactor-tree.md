# ObjectInspector Refactoring Tree

## 📊 Current State Analysis

**File**: `ObjectInspector.tsx`
**Lines**: 463 lines
**Main Issues**:
- ❌ Too large and monolithic (463 lines)
- ❌ No internationalization for hardcoded strings
- ❌ Multiple responsibilities in single component
- ❌ Repeated vector3 input patterns
- ❌ Complex conditional rendering logic
- ❌ Mixed concerns (transform, properties, components)

---

## 🌳 Component Tree Structure

```
ObjectInspector (Main Container)
├── EmptyInspectorView (No Selection State)
│   └── Uses: t('editor.objectInspector.*')
│
├── InspectorContent (Selected Object)
    ├── ObjectInfoSection (Object ID)
    │   └── Uses: t('editor.objectInspector.objectId')
    │
    ├── TransformSection (Position, Rotation, Scale)
    │   ├── TransformGroup (Reusable)
    │   │   └── Vector3Input (Reusable)
    │   │       └── VectorAxisInput (X, Y, Z)
    │   │
    │   ├── PositionControl
    │   │   └── Vector3Input
    │   ├── RotationControl
    │   │   └── Vector3Input (with degree conversion)
    │   └── ScaleControl
    │       └── Vector3Input (with min validation)
    │
    ├── ComponentManagerSection (Component System)
    │   ├── ComponentPicker (Already exists ✅)
    │   ├── ComponentsList
    │   │   └── ComponentSection (Already exists ✅)
    │   └── EmptyComponentsView
    │       └── Uses: t('editor.components.empty')
    │
    ├── PropertiesSection (Legacy Properties)
    │   └── PropertyControl (Existing)
    │       ├── PropertyInput (Text)
    │       ├── PropertyCheckbox (Boolean)
    │       ├── PropertyNumber (Number with slider)
    │       ├── PropertySelect (Dropdown)
    │       │   └── ObjectTargetSelector (Special case)
    │       ├── PropertyColor (Color picker)
    │       └── PropertyReadonly (Display only)
    │
    └── NotInspectableView (Warning State)
        └── Uses: t('editor.objectInspector.notInspectable')
```

---

## 📦 New Components to Create

### 1. **EmptyInspectorView.tsx** (~30 lines)
**Purpose**: Display when no object is selected
**Props**:
```typescript
interface EmptyInspectorViewProps {
  // No props needed, uses i18n internally
}
```
**Keys needed**:
- `editor.objectInspector.noSelection`
- `editor.objectInspector.selectFromHierarchy`

---

### 2. **ObjectInfoSection.tsx** (~20 lines)
**Purpose**: Display object ID and type
**Props**:
```typescript
interface ObjectInfoSectionProps {
  objectId: string;
  objectType?: string;
}
```
**Keys needed**:
- `editor.objectInspector.objectId`
- `editor.objectInspector.objectType`

---

### 3. **VectorAxisInput.tsx** (~40 lines) ⭐ REUSABLE
**Purpose**: Single axis input (X, Y, or Z)
**Props**:
```typescript
interface VectorAxisInputProps {
  label: 'X' | 'Y' | 'Z';
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  precision?: number;
  convertFrom?: (value: number) => number; // For degrees
  convertTo?: (value: number) => number;   // To radians
}
```

---

### 4. **Vector3Input.tsx** (~60 lines) ⭐ REUSABLE
**Purpose**: Three-axis vector input (X, Y, Z)
**Props**:
```typescript
interface Vector3InputProps {
  value: { x: number; y: number; z: number };
  onChange: (axis: 'x' | 'y' | 'z', value: number) => void;
  step?: number;
  min?: number;
  precision?: number;
  convertFrom?: (value: number) => number;
  convertTo?: (value: number) => number;
}
```
**Uses**: `VectorAxisInput` x3

---

### 5. **TransformGroup.tsx** (~40 lines) ⭐ REUSABLE
**Purpose**: Labeled group for transform controls
**Props**:
```typescript
interface TransformGroupProps {
  label: string;
  children: preact.ComponentChildren;
}
```

---

### 6. **PositionControl.tsx** (~30 lines)
**Purpose**: Position vector control
**Props**:
```typescript
interface PositionControlProps {
  position: THREE.Vector3;
  onChange: (axis: 'x' | 'y' | 'z', value: number) => void;
}
```
**Keys needed**:
- `editor.transform.position`
- `editor.transform.position.x`
- `editor.transform.position.y`
- `editor.transform.position.z`
**Uses**: `Vector3Input`

---

### 7. **RotationControl.tsx** (~35 lines)
**Purpose**: Rotation vector control with degree conversion
**Props**:
```typescript
interface RotationControlProps {
  rotation: THREE.Euler;
  onChange: (axis: 'x' | 'y' | 'z', value: number) => void;
}
```
**Keys needed**:
- `editor.transform.rotation`
- `editor.transform.rotation.x`
- `editor.transform.rotation.y`
- `editor.transform.rotation.z`
**Uses**: `Vector3Input` with degree↔radian conversion

---

### 8. **ScaleControl.tsx** (~30 lines)
**Purpose**: Scale vector control with min validation
**Props**:
```typescript
interface ScaleControlProps {
  scale: THREE.Vector3;
  onChange: (axis: 'x' | 'y' | 'z', value: number) => void;
}
```
**Keys needed**:
- `editor.transform.scale`
- `editor.transform.scale.x`
- `editor.transform.scale.y`
- `editor.transform.scale.z`
**Uses**: `Vector3Input` with min="0.01"

---

### 9. **TransformSection.tsx** (~50 lines)
**Purpose**: Complete transform section container
**Props**:
```typescript
interface TransformSectionProps {
  transform: THREE.Object3D;
  onChange: (property: 'position' | 'rotation' | 'scale', axis: 'x' | 'y' | 'z', value: number) => void;
}
```
**Keys needed**:
- `editor.objectInspector.transform`
**Uses**: `PositionControl`, `RotationControl`, `ScaleControl`

---

### 10. **ComponentsList.tsx** (~40 lines)
**Purpose**: List of managed components
**Props**:
```typescript
interface ComponentsListProps {
  components: ManagedComponent[];
  onToggle: (instanceId: string) => void;
  onRemove: (instanceId: string) => void;
  onPropertyChange: (instanceId: string, propName: string, value: any) => void;
}
```

---

### 11. **EmptyComponentsView.tsx** (~25 lines)
**Purpose**: Display when no components added
**Props**:
```typescript
interface EmptyComponentsViewProps {
  // No props needed
}
```
**Keys needed**:
- `editor.components.empty.title`
- `editor.components.empty.description`

---

### 12. **ComponentManagerSection.tsx** (~70 lines)
**Purpose**: Complete component management UI
**Props**:
```typescript
interface ComponentManagerSectionProps {
  componentManager: IComponentManager;
  onToggle: (instanceId: string) => void;
  onRemove: (instanceId: string) => void;
  onPropertyChange: (instanceId: string, propName: string, value: any) => void;
  onAdd: (factory: () => any, metadata: any) => void;
}
```
**Keys needed**:
- `editor.objectInspector.components`
**Uses**: `ComponentPicker`, `ComponentsList`, `EmptyComponentsView`

---

### 13. **PropertyInput.tsx** (~25 lines)
**Purpose**: Text input for properties
**Props**:
```typescript
interface PropertyInputProps {
  value: string;
  onChange: (value: string) => void;
}
```

---

### 14. **PropertyCheckbox.tsx** (~25 lines)
**Purpose**: Checkbox for boolean properties
**Props**:
```typescript
interface PropertyCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}
```

---

### 15. **PropertyNumber.tsx** (~40 lines)
**Purpose**: Number input with slider
**Props**:
```typescript
interface PropertyNumberProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}
```

---

### 16. **PropertySelect.tsx** (~30 lines)
**Purpose**: Dropdown selector
**Props**:
```typescript
interface PropertySelectProps {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  translateOptions?: boolean;
  translationKey?: string;
}
```

---

### 17. **ObjectTargetSelector.tsx** (~35 lines)
**Purpose**: Special object selector for camera target
**Props**:
```typescript
interface ObjectTargetSelectorProps {
  value: string;
  objects: Array<{ id: string; typeName: string }>;
  onChange: (value: string) => void;
}
```
**Keys needed**:
- `editor.camera.manualPosition`

---

### 18. **PropertyColor.tsx** (~30 lines)
**Purpose**: Color picker
**Props**:
```typescript
interface PropertyColorProps {
  value: number; // hex number
  onChange: (value: number) => void;
}
```

---

### 19. **PropertyReadonly.tsx** (~20 lines)
**Purpose**: Display-only property value
**Props**:
```typescript
interface PropertyReadonlyProps {
  value: string | number | boolean;
}
```

---

### 20. **PropertyControl.tsx** (~90 lines) - REFACTORED
**Purpose**: Property control router/dispatcher
**Props**: (same as current)
**Changes**:
- Extract each input type to separate component
- Use switch/case or component map
- Simplified logic
**Uses**: All Property* components above

---

### 21. **PropertiesSection.tsx** (~35 lines)
**Purpose**: Legacy properties container
**Props**:
```typescript
interface PropertiesSectionProps {
  properties: InspectableProperty[];
  onChange: (name: string, value: any) => void;
  editor?: SceneEditor;
}
```
**Keys needed**:
- `editor.objectInspector.properties`
**Uses**: `PropertyControl`

---

### 22. **NotInspectableView.tsx** (~25 lines)
**Purpose**: Warning when object not inspectable
**Props**:
```typescript
interface NotInspectableViewProps {
  // No props needed
}
```
**Keys needed**:
- `editor.objectInspector.notInspectable.title`
- `editor.objectInspector.notInspectable.description`

---

### 23. **InspectorContent.tsx** (~90 lines)
**Purpose**: Main content router
**Props**:
```typescript
interface InspectorContentProps {
  selectedObject: ISceneObject;
  inspectable: IInspectable | null;
  componentManager: IComponentManager | null;
  transform: THREE.Object3D | null;
  properties: InspectableProperty[];
  onTransformChange: (property: 'position' | 'rotation' | 'scale', axis: 'x' | 'y' | 'z', value: number) => void;
  onPropertyChange: (name: string, value: any) => void;
  onComponentToggle: (instanceId: string) => void;
  onComponentRemove: (instanceId: string) => void;
  onComponentPropertyChange: (instanceId: string, propName: string, value: any) => void;
  onAddComponent: (factory: () => any, metadata: any) => void;
  editor: SceneEditor;
}
```
**Uses**: All section components

---

### 24. **ObjectInspector.tsx** (~120 lines) - REFACTORED
**Purpose**: Main container with state management
**Changes**:
- Keep only state management and event handlers
- Delegate rendering to sub-components
- Much cleaner and maintainable
**Uses**: `EmptyInspectorView`, `InspectorContent`

---

## 🗂️ File Structure

```
ui/components/editor/
├── ObjectInspector.tsx (Main - refactored)
├── object-inspector.css
├── inspector/
│   ├── EmptyInspectorView.tsx
│   ├── InspectorContent.tsx
│   ├── ObjectInfoSection.tsx
│   ├── NotInspectableView.tsx
│   ├── transform/
│   │   ├── TransformSection.tsx
│   │   ├── TransformGroup.tsx
│   │   ├── Vector3Input.tsx ⭐
│   │   ├── VectorAxisInput.tsx ⭐
│   │   ├── PositionControl.tsx
│   │   ├── RotationControl.tsx
│   │   └── ScaleControl.tsx
│   ├── components/
│   │   ├── ComponentManagerSection.tsx
│   │   ├── ComponentsList.tsx
│   │   └── EmptyComponentsView.tsx
│   └── properties/
│       ├── PropertiesSection.tsx
│       ├── PropertyControl.tsx (refactored)
│       ├── PropertyInput.tsx
│       ├── PropertyCheckbox.tsx
│       ├── PropertyNumber.tsx
│       ├── PropertySelect.tsx
│       ├── ObjectTargetSelector.tsx
│       ├── PropertyColor.tsx
│       └── PropertyReadonly.tsx
```

---

## 🌐 i18n Keys Required

### General
```typescript
'editor.objectInspector.title': 'Object Inspector'
'editor.objectInspector.noSelection': 'No object selected'
'editor.objectInspector.selectFromHierarchy': 'Select an object from the hierarchy'
```

### Object Info
```typescript
'editor.objectInspector.objectId': 'ID'
'editor.objectInspector.objectType': 'Type'
```

### Transform
```typescript
'editor.objectInspector.transform': 'Transform'
'editor.transform.position': 'Position'
'editor.transform.position.x': 'X'
'editor.transform.position.y': 'Y'
'editor.transform.position.z': 'Z'
'editor.transform.rotation': 'Rotation'
'editor.transform.rotation.x': 'X'
'editor.transform.rotation.y': 'Y'
'editor.transform.rotation.z': 'Z'
'editor.transform.scale': 'Scale'
'editor.transform.scale.x': 'X'
'editor.transform.scale.y': 'Y'
'editor.transform.scale.z': 'Z'
```

### Components
```typescript
'editor.objectInspector.components': 'Components'
'editor.components.empty.title': 'No components yet'
'editor.components.empty.description': 'Add components to customize this object'
'editor.components.remove.confirm': 'Remove this component?'
```

### Properties
```typescript
'editor.objectInspector.properties': 'Properties'
```

### Not Inspectable
```typescript
'editor.objectInspector.notInspectable.title': 'This object is not inspectable'
'editor.objectInspector.notInspectable.description': 'The object doesn\'t implement IInspectable interface'
```

### Camera (existing)
```typescript
'editor.camera.manualPosition': 'Manual Position'
'editor.camera.modes.orbit': 'Orbit'
'editor.camera.modes.fixed': 'Fixed'
```

---

## 📊 Metrics Comparison

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Main file lines | 463 | ~120 | **74% reduction** |
| Components | 2 | 24 | **Better separation** |
| Reusable | 0 | 3 | **Vector3, Axis, TransformGroup** |
| i18n coverage | ~30% | 100% | **Fully translated** |
| Max component size | 463 | ~90 | **Much more maintainable** |
| Testability | Low | High | **Each component testable** |

---

## 🚀 Implementation Order

### Phase 1: Atoms (Most reusable, no dependencies)
1. ✅ VectorAxisInput
2. ✅ Vector3Input
3. ✅ TransformGroup
4. ✅ PropertyInput
5. ✅ PropertyCheckbox
6. ✅ PropertyNumber
7. ✅ PropertyColor
8. ✅ PropertyReadonly

### Phase 2: Molecules (Composed of atoms)
9. ✅ PositionControl
10. ✅ RotationControl
11. ✅ ScaleControl
12. ✅ PropertySelect
13. ✅ ObjectTargetSelector
14. ✅ ObjectInfoSection
15. ✅ EmptyComponentsView
16. ✅ NotInspectableView
17. ✅ EmptyInspectorView

### Phase 3: Organisms (Composed of molecules)
18. ✅ TransformSection
19. ✅ ComponentsList
20. ✅ PropertyControl (refactored)
21. ✅ PropertiesSection
22. ✅ ComponentManagerSection

### Phase 4: Templates (Composed of organisms)
23. ✅ InspectorContent

### Phase 5: Pages (Final composition)
24. ✅ ObjectInspector (refactored)

### Phase 6: i18n
25. ✅ Add all translation keys to en.json and es.json
26. ✅ Update all hardcoded strings to use t()

---

## ✅ Benefits

1. **Maintainability**: Each component has single responsibility
2. **Reusability**: Vector3Input, VectorAxisInput, TransformGroup can be used elsewhere
3. **Testability**: Small components are easy to test
4. **i18n**: All strings properly internationalized
5. **Readability**: Clear component hierarchy
6. **Scalability**: Easy to add new property types or sections
7. **Performance**: Can optimize individual components
8. **Type Safety**: Strong TypeScript interfaces for each component

---

## 🎯 Next Steps

1. Create `/inspector/` folder structure
2. Implement Phase 1 (atoms) - 8 components
3. Implement Phase 2 (molecules) - 9 components
4. Implement Phase 3 (organisms) - 5 components
5. Implement Phase 4 (templates) - 1 component
6. Refactor Phase 5 (main) - 1 component
7. Add i18n keys to translation files
8. Test each component individually
9. Integration testing
10. Remove old unused code

**Estimated total time**: 4-6 hours
**Estimated total new lines**: ~1200 lines (across 24 files)
**Net benefit**: Much better organized, maintainable, and scalable
