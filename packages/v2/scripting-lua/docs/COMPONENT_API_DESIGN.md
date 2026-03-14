# Diseño: API Lua para componentes del sistema

## Objetivo

Exponer todos los tipos de componentes de core-v2 en Lua, permitiendo:
- **Leer propiedades** de cualquier componente
- **Escribir propiedades** (incluyendo dot-notation: `halfExtents.x`)
- **Setear recursos** por key (ResourceRef → `{ key, kind }` o string key)
- **Obtener snapshot** completo de un componente

---

## 1. Análisis de componentes en core-v2

### 1.1 Componentes por categoría

| Categoría | Tipos | Campos con ResourceRef |
|----------|-------|------------------------|
| **Geometry** | boxGeometry, sphereGeometry, planeGeometry, cylinderGeometry, coneGeometry, torusGeometry, customGeometry | customGeometry: `mesh` |
| **Material** | standardMaterial, basicMaterial, phongMaterial, lambertMaterial | `material`, `albedo`, `normalMap`, `aoMap`, `roughnessMap`, `metallicMap`, `envMap` |
| **Camera** | cameraView, postProcess | — |
| **Physics** | rigidBody, gravity, boxCollider, sphereCollider, capsuleCollider, cylinderCollider, coneCollider, terrainCollider | — |
| **Environment** | skybox | `skybox` |
| **Scripting** | script | — (managed by Script bridge) |

### 1.2 ResourceRef en el dominio

```ts
// core-v2 domain/resources/ref.ts
interface ResourceRef<K extends ResourceKind> {
  key: ResourceKey;   // string, e.g. 'planets/moon'
  kind: K;           // 'texture' | 'mesh' | 'standardMaterial' | ...
  version?: number | 'latest' | 'active';
}
```

**ResourceKind**: `standardMaterial`, `basicMaterial`, `phongMaterial`, `lambertMaterial`, `basicShaderMaterial`, `standardShaderMaterial`, `physicalShaderMaterial`, `mesh`, `skybox`, `script`, `texture`.

### 1.3 Inspector metadata

Cada componente tiene `metadata.inspector.fields` con:
- `key`: path del campo (ej. `halfExtents.x`, `albedo`)
- `type`: `'number' | 'boolean' | 'color' | 'enum' | 'texture' | 'resource' | 'reference' | 'object'` etc.
- `nullable`, `min`, `max`, `options`, etc.

Los campos `resource` y `texture` son ResourceRef. El tipo `reference` se usa para mesh en customGeometry.

---

## 2. Propuesta: Bridge `Component`

### 2.1 API Lua

```lua
-- self.Component o Engine.Component (global)

-- Obtener valor de un campo (soporta dot-notation)
local value = self.Component.getField(entityId, componentType, fieldKey)
-- Ej: self.Component.getField(self.id, 'boxCollider', 'halfExtents.x')

-- Setear valor (primitivos, vectores, colores)
self.Component.setField(entityId, componentType, fieldKey, value)

-- Setear recurso por key (string)
self.Component.setResource(entityId, componentType, fieldKey, resourceKey)
-- Ej: self.Component.setResource(self.id, 'standardMaterial', 'albedo', 'textures/floor')

-- Setear recurso con kind explícito (si el campo acepta varios)
self.Component.setResource(entityId, componentType, fieldKey, resourceKey, kind)

-- Obtener snapshot completo del componente (readonly)
local data = self.Component.getData(entityId, componentType)
-- Retorna tabla con todos los campos (ResourceRef como { key, kind })

-- Verificar si existe el componente
local has = self.Component.has(entityId, componentType)
```

### 2.2 Representación de ResourceRef en Lua

```lua
-- En Lua, ResourceRef se expone como:
{ key = "textures/floor", kind = "texture" }
-- o simplificado para setear: solo el key string

-- setResource(entityId, componentType, fieldKey, key)
--   → Internamente usa el kind del inspector del campo
```

### 2.3 Validación

- Usar `validateFieldValue` de core antes de setear (igual que `setComponentField`).
- Para campos resource/texture: si el valor es string, construir `{ key, kind }` con el kind del inspector.

---

## 3. Componente script (existente)

El componente `script` ya tiene bridge dedicado (`Script`) para setProperty/getProperty entre scripts hermanos. El bridge `Component` no debe reemplazarlo; `script` puede ser accesible vía `Component.getData`/`setField` para casos avanzados, pero el uso normal sigue siendo `Script.setProperty`.

---

## 4. Prebuild: generación de .d.lua

### 4.1 Objetivo

Generar `res/scripts/types/components_v2.d.lua` desde los specs de core-v2 para que:
- LuaLS tenga autocompletado de `componentType` y `fieldKey`
- Si los componentes evolucionan, un `pnpm run generate:component-types` regenere el archivo

### 4.2 Fuente de verdad

- `core-v2/COMPONENT_SPECS` (factory.ts) → metadata + defaults
- O exportar desde core-v2 un JSON/TS de "component API surface" para el generador

### 4.3 Formato generado

```lua
---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API v2 — Components (generated)
-- Run: pnpm run generate:component-types
-- ═══════════════════════════════════════════════════════════════════════

---@class ComponentV2
Component = {}

---@param entityId string
---@param componentType ComponentTypeV2
---@param fieldKey string
---@return any
function Component.getField(entityId, componentType, fieldKey) end

---@param entityId string
---@param componentType ComponentTypeV2
---@param fieldKey string
---@param value any
function Component.setField(entityId, componentType, fieldKey, value) end

---@param entityId string
---@param componentType ComponentTypeV2
---@param fieldKey string
---@param resourceKey string
---@param kind? ResourceKindV2
function Component.setResource(entityId, componentType, fieldKey, resourceKey, kind) end

---@param entityId string
---@param componentType ComponentTypeV2
---@return table|nil
function Component.getData(entityId, componentType) end

---@param entityId string
---@param componentType ComponentTypeV2
---@return boolean
function Component.has(entityId, componentType) end

---@alias ComponentTypeV2
---| "boxGeometry"
---| "sphereGeometry"
---| "rigidBody"
---| "boxCollider"
---| "standardMaterial"
---| ... (todos los tipos)

---@alias ResourceKindV2
---| "texture"
---| "mesh"
---| "standardMaterial"
---| ...
```

### 4.4 Script de generación

- Ubicación: `packages/scripting-lua/scripts/generateComponentTypes.ts`
- Lee specs de core-v2 (import o lectura de exports)
- Genera el .d.lua con los alias de tipos y campos por componente
- Opcional: generar `fieldKey` como union para cada componentType (ej. para rigidBody: `"bodyType"|"mass"|"linearDamping"|...`)

---

## 5. Implementación

### 5.1 Component bridge (TypeScript)

```ts
// domain/bridges/componentBridge.ts
export const componentBridge: BridgeDeclaration = {
  name: 'Component',
  perEntity: false,  // global, como Physics/Input
  factory(scene, _entityId, _schema, _ports) {
    const accessors = createComponentAccessorPair(scene);
    return {
      getField(entityId: string, componentType: string, fieldKey: string) {
        return accessors.getter(entityId, componentType, fieldKey);
      },
      setField(entityId: string, componentType: string, fieldKey: string, value: unknown) {
        // Validar con validateFieldValue
        // Aplicar con setFieldValue o field.set
        accessors.setter(entityId, componentType, fieldKey, value);
        emitSceneChange(scene, { kind: 'component-changed', entityId, componentType });
      },
      setResource(entityId: string, componentType: string, fieldKey: string, key: string, kind?: string) {
        const ref = kind ? { key, kind } : { key, kind: inferKindFromField(componentType, fieldKey) };
        accessors.setter(entityId, componentType, fieldKey, ref);
        emitSceneChange(scene, { kind: 'component-changed', entityId, componentType });
      },
      getData(entityId: string, componentType: string) {
        const comp = getComponent(scene, entityId, componentType);
        return comp ? createComponentViewFromBase(comp) : nil;
      },
      has(entityId: string, componentType: string) {
        return !!getComponent(scene, entityId, componentType);
      },
    };
  },
};
```

### 5.2 Integración con defaultBridges

Añadir `componentBridge` a `createDefaultScriptingBridges`.

### 5.3 Dependencias

- `createComponentAccessorPair` ya existe
- `validateFieldValue`, `setFieldValue` de core
- `getComponentMetadata` para inferir kind de campos resource
- `createComponentViewFromBase` para snapshot

### 5.4 Orden de tareas

1. Crear `componentBridge.ts` con getField, setField, getData, has
2. Añadir soporte para ResourceRef en setResource (setField con `{ key, kind }`)
3. Integrar con defaultBridges
4. Crear script de prebuild para generar types
5. Añadir `pnpm run generate:component-types` al package.json

---

## 6. Consideraciones

- **Script component**: `scripts` es un array de objetos; `getField`/`setField` con path `scripts[0].properties.x` no es trivial. El bridge Script ya cubre el caso común. Para Component, podríamos soportar `scripts.0.properties.x` como path especial o documentar que Script es el API preferido.
- **Campos object**: postProcess.effects, etc. — setField con path puede no ser suficiente. Para v1, priorizar campos scalar y ResourceRef.
- **Seguridad**: validar que el componente existe y el campo está en inspector antes de setear.
