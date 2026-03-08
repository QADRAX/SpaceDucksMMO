# Plan de Implementación: Sistema de Scripting v2

> **Objetivo**: Rediseñar el sistema de scripting v2 con:
> - **Dominio en core-v2**: Tipos, schemas, permisos y lógica core viven en `@duckengine/core-v2`
> - **API ECS-first**: Lua refleja la estructura ECS (entity.transform, entity.components, scripts como component)
> - **Runtime agnóstico**: La implementación específica de Lua vive en `scripting-lua` package
> - **Controles estrictos**: Acceso basado en referencias explícitas

## 📋 Índice

1. [Arquitectura v2](#arquitectura-v2)
2. [Análisis de Diseño](#análisis-de-diseño)
3. [API ECS-First](#api-ecs-first)
4. [Sistema de Referencias](#sistema-de-referencias)
5. [Fases de Implementación](#fases-de-implementación)
6. [Plan de Ejecución](#plan-de-ejecución)

---

## Arquitectura v2

### Separación de Responsabilidades

**📦 core-v2** (Dominio del scripting)
```
packages/core-v2/src/domain/scripting/
├── schema/              # Property schemas y validación
│   ├── types.ts
│   ├── propertyTypes.ts
│   └── validation.ts
├── permissions/         # Permission system
│   ├── types.ts
│   ├── createPermissions.ts
│   └── validators.ts
├── runtime/             # Runtime state & lifecycle
│   ├── types.ts
│   ├── scriptSlot.ts
│   └── lifecycle.ts
├── proxies/             # Entity/Component/Script proxies
│   ├── entityProxy.ts
│   ├── componentProxy.ts
│   └── scriptProxy.ts
├── api/                 # API builder (runtime-agnostic)
│   ├── buildEntityAPI.ts
│   ├── buildSceneAPI.ts
│   └── buildScriptAPI.ts
└── index.ts
```

**Responsabilidades**:
- ✅ Definir tipos TypeScript del sistema de scripting
- ✅ Esquemas de properties y validación
- ✅ Permission system (qué puede acceder cada script)
- ✅ Entity/Component/Script proxies
- ✅ API builders (agnósticos al runtime)
- ✅ Lifecycle hooks (init, update, onDestroy, etc.)

**📦 scripting-lua** (Implementación Lua/Wasmoon)
```
packages/scripting-lua/
├── src/
│   ├── infrastructure/wasmoon/  # Sandbox Lua
│   │   ├── sandbox.ts
│   │   ├── luaTypeAdapter.ts    # Convierte proxies TS → Lua
│   │   └── errorHandling.ts
│   ├── adapters/                # Conecta core-v2 con Lua
│   │   ├── scriptLoader.ts
│   │   ├── apiInjector.ts       # Inyecta API en sandbox
│   │   └── lifecycleRunner.ts
│   └── index.ts
└── res/
    ├── scripts/
    │   ├── types/               # .d.lua type definitions
    │   │   └── duckengine.d.lua
    │   ├── system/              # Lua system scripts
    │   │   ├── math_ext.lua
    │   │   └── sandbox_runtime.lua
    │   └── builtin/             # Built-in Lua scripts
    │       ├── move_to_point.lua
    │       └── waypoint_path.lua
    └── schemas/                 # JSON schemas de scripts built-in
```

**Responsabilidades**:
- ✅ Sandbox Wasmoon y seguridad Lua
- ✅ Conversión de proxies TypeScript → Lua tables
- ✅ Carga de archivos .lua
- ✅ Type definitions (.d.lua) para LSP
- ✅ System scripts y utilities Lua
- ✅ Built-in scripts específicos de Lua

### Beneficios de esta Arquitectura

1. **Reutilización**: El dominio scripting en core-v2 puede ser usado por otros runtimes (Python, JavaScript, etc.)
2. **Testabilidad**: Lógica core puede testearse sin depender de Wasmoon
3. **Type Safety**: core-v2 define contratos TypeScript claros
4. **Mantenibilidad**: Separación clara entre dominio y implementación
5. **ECS-First**: API Lua refleja exactamente la estructura ECS

---

## Análisis de Diseño

### v1 (core) - Arquitectura Actual

**Filosofía**: Acceso permisivo y global
- Scripts pueden acceder a cualquier entidad en la escena via `Scene.getEntity(id)`
- Métodos de self permiten acceder al transform completo: `self:getPosition()`, `self:setRotation()`
- Cross-script access automático: `self.scripts[Script.MoveToPoint]`
- Entity proxies con API completa (read/write transform, components, etc.)
- Sin restricciones en instanciación de prefabs

**Características Clave v1**:
```lua
-- 1. Entity arrays en properties
waypoints = { type = "entityArray", default = {} }

-- 2. Cross-script references
local mtp = self.scripts[Script.MoveToPoint]
mtp.targetPoint = target:toArray()

-- 3. Entity proxy API
local wp = wps[idx]
if wp:isValid() then
    local pos = wp:getPosition()
end

-- 4. Property reactivity
onPropertyChanged = function(self, key, value)
    if key == "targetPoint" then
        -- restart animation
    end
end

-- 5. Math utilities
math.vec3(x, y, z)
vec:distanceTo(other)
vec:toArray()
math.ext.lerp(a, b, t)
math.ext.ease("cubicInOut", t)
```

---

## API ECS-First

### Filosofía de Diseño

El API de scripting en v2 **refleja exactamente la estructura ECS**:

```lua
-- ✅ v2: Scripts acceden a entidades como objetos ECS
local entity = self.entity  -- La entidad que contiene este script

-- Transform es 1:1 con entity
local pos = entity.transform.position
entity.transform.position = math.vec3(0, 10, 0)
entity.transform:lookAt(target)

-- Components se acceden como propiedades
local rb = entity.components.rigidBody
if rb then
    rb.velocity = math.vec3(0, 5, 0)
end

-- Scripts son un component más
local otherScript = entity.scripts.MoveToPoint
if otherScript then
    otherScript.properties.targetPoint = pos
end

-- Entity references son entities completos (con permisos)
local waypoint = self.properties.waypoints[1]
local waypointPos = waypoint.transform.position
```

**Contraste con v1 (bridges globales)**:
```lua
-- ❌ v1: Bridges desconectados del ECS
Transform.setPosition(x, y, z)  -- ¿Qué entity?
Physics.raycast(...)
Scene.getEntity("id")           -- Acceso global
```

### API Completa

#### self (ScriptInstance)
```lua
---@class ScriptInstance
local self = {
    -- La entity que contiene este script
    entity = entity,  -- EntityProxy
    
    -- Properties del script (configurables)
    properties = {
        speed = 5,
        target = entityRef,  -- EntityProxy
        waypoints = { entityRef1, entityRef2 }  -- EntityProxy[]
    },
    
    -- State del script (runtime)
    state = {
        elapsed = 0,
        currentIndex = 1
    },
    
    -- Emit events (global event bus)
    emit = function(eventName, data) end,
    
    -- Subscribe to events
    on = function(eventName, callback) end
}
```

#### entity (EntityProxy)
```lua
---@class EntityProxy
local entity = {
    -- Unique ID
    id = "entity-123",
    
    -- Display name
    name = "Player",
    
    -- Transform (1:1 con entity)
    transform = {
        -- World transform
        position = vec3,        -- Read/Write
        rotation = vec3,        -- Read/Write (euler angles)
        scale = vec3,           -- Read/Write
        
        -- Local transform
        localPosition = vec3,   -- Read/Write
        localRotation = vec3,   -- Read/Write
        localScale = vec3,      -- Read/Write
        
        -- Hierarchy
        parent = entityProxy,   -- Read (parent entity)
        children = { entityProxy },  -- Read (array of children)
        
        -- Methods
        lookAt = function(target: vec3) end,
        setParent = function(parentEntity: EntityProxy) end
    },
    
    -- Components (solo si están en references)
    components = {
        rigidBody = rigidBodyComponent,  -- Solo si declarado en schema
        boxCollider = boxColliderComponent,
        -- etc.
    },
    
    -- Scripts (solo siblings en self.entity)
    scripts = {
        MoveToPoint = scriptProxy,
        WaypointPath = scriptProxy
    },
    
    -- Methods
    isValid = function() end,  -- Check if entity still exists
    destroy = function() end   -- Destroy entity (solo si self.entity)
}
```

#### Scene (Global API)
```lua
---@class Scene
Scene = {
    -- Instantiate prefab (solo si está en prefabRefs)
    instantiate = function(prefabRef, position, rotation) 
        return entityProxy  -- Con permisos para accederlo
    end,
    
    -- Find entities by tag (retorna solo allowed entities)
    findByTag = function(tag)
        return { entityProxy }
    end,
    
    -- Raycast (physics query)
    raycast = function(origin, direction, maxDistance)
        return {
            hit = true,
            entity = entityProxy,  -- Limited proxy (read-only transform)
            point = vec3,
            distance = number
        }
    end,
    
    -- Event system (global)
    emit = function(eventName, data) end,
    on = function(eventName, callback) end
}
```

#### Input (Global API)
```lua
---@class Input
Input = {
    isKeyPressed = function(key: string) end,
    isKeyJustPressed = function(key: string) end,
    isKeyReleased = function(key: string) end,
    
    getMousePosition = function() return vec2 end,
    getMouseDelta = function() return vec2 end,
    isMouseButtonPressed = function(button: number) end
}
```

#### Time (Global API)
```lua
---@class Time
Time = {
    delta = number,      -- Delta time (milliseconds)
    deltaSeconds = number,  -- Delta time (seconds)
    elapsed = number,    -- Total elapsed time (milliseconds)
    frameCount = number,
    scale = number       -- Time scale (1.0 = normal speed)
}
```

### Script Schema Example (v2)

```lua
---@type ScriptBlueprint
return {
    schema = {
        name = "Waypoint Path v2",
        description = "Follows waypoints by controlling sibling MoveToPoint script",
        
        properties = {
            -- Primitive types
            speed = { 
                type = "number", 
                default = 5,
                min = 0,
                description = "Movement speed" 
            },
            
            loop = { 
                type = "boolean", 
                default = true,
                description = "Loop back to start" 
            },
            
            -- Entity references (single)
            leader = {
                type = "entityRef",
                default = nil,
                description = "Entity to follow"
            },
            
            -- Entity references (array)
            waypoints = {
                type = "entityRefArray",
                default = {},
                description = "Path waypoints"
            },
            
            -- Script references (sibling scripts)
            moverScript = {
                type = "scriptRef",
                scriptType = "MoveToPoint",
                required = true,
                description = "Sibling MoveToPoint script"
            },
            
            -- Component requirements
            requiredComponents = {
                type = "componentRefs",
                components = ["rigidBody"],  -- Ensure entity has these
                description = "Required components"
            },
            
            -- Prefab references
            spawnPrefab = {
                type = "prefabRef",
                default = nil,
                description = "Prefab to spawn"
            }
        }
    },
    
    ---@param self ScriptInstance
    init = function(self)
        -- Access entity
        local pos = self.entity.transform.position
        
        -- Access entity refs
        local waypoint = self.properties.waypoints[1]
        if waypoint and waypoint:isValid() then
            local wpPos = waypoint.transform.position
        end
        
        -- Access script refs
        local mover = self.properties.moverScript
        if mover then
            mover.properties.duration = 2.0
        end
    end,
    
    ---@param self ScriptInstance
    ---@param dt number
    update = function(self, dt)
        -- Use Time global
        local deltaSeconds = Time.deltaSeconds
        
        -- Modify own transform
        self.entity.transform.position = self.entity.transform.position + math.vec3(0, deltaSeconds, 0)
    end,
    
    ---@param self ScriptInstance
    onDestroy = function(self)
        -- Cleanup
    end
}
```

---

## Principios de Diseño v2

### 1. **ECS-First Architecture**

El scripting NO es un sistema aparte - es parte integral del ECS:

```typescript
// Entity tiene transform (1:1)
entity.transform.position = { x: 0, y: 10, z: 0 };

// Scripts son un component
entity.components.get('script')  // ScriptComponent
  .scripts  // ScriptReference[]

// En Lua esto se expone como:
entity.transform.position
entity.scripts.MoveToPoint
```

**Beneficio**: Scripts entienden y manipulan el ECS de forma natural. No hay impedance mismatch.

### 2. **Reference-Based Access Control**

Todo acceso debe estar declarado en el schema de properties:

```lua
schema = {
    properties = {
        -- Single entity reference
        target = { 
            type = "entityRef", 
            default = nil,
            description = "Target entity to follow" 
        },
        
        -- Entity array reference
        waypoints = { 
            type = "entityRefArray", 
            default = {},
            description = "Path waypoints to follow" 
        },
        
        -- Script reference (sibling script)
        moverScript = {
            type = "scriptRef",
            scriptType = "MoveToPoint",
            required = true,
            description = "Reference to sibling MoveToPoint script"
        },
        
        -- Component requirements (validates entity has them)
        requiredComponents = {
            type = "componentRefs",
            components = { "rigidBody", "boxCollider" }
        },
        
        -- Prefab reference
        spawnPrefab = {
            type = "prefabRef",
            default = nil,
            description = "Prefab to spawn"
        }
    }
}
```

**Beneficio**: Explicitez. El schema documenta todas las dependencias del script.

### 3. **Minimal, Scoped Proxies**

Entity proxies exponen solo lo necesario según permisos:

```lua
-- Self entity (full access)
self.entity.transform.position = vec3(0, 10, 0)
self.entity.components.rigidBody.velocity = vec3(0, 5, 0)
self.entity:destroy()

-- Referenced entity (limited access)
local waypoint = self.properties.waypoints[1]
local pos = waypoint.transform.position  -- ✅ Read transform
waypoint.transform.position = vec3()     -- ❌ No write (external entity)
waypoint.components.health               -- ❌ No component access (not in schema)

-- Raycast hit (very limited)
local hit = Scene.raycast(origin, dir, maxDist)
local hitPos = hit.entity.transform.position  -- ✅ Read transform only
hit.entity.name                               -- ✅ Read name
hit.entity.components                         -- ❌ No components
```

**Beneficio**: Seguridad y encapsulamiento. Scripts no pueden "tocar" entities arbitrarias.

### 4. **Composition over Inheritance**

Scripts se combinan para comportamientos complejos:

```lua
-- waypoint_path.lua declara dependency en move_to_point
schema = {
    properties = {
        moverScript = {
            type = "scriptRef",
            scriptType = "MoveToPoint",
            required = true
        }
    }
}

-- En update, controla el mover
local mover = self.properties.moverScript
mover.properties.targetPoint = nextWaypoint.transform.position
mover.properties.duration = distance / self.properties.speed
```

**Beneficio**: Scripts pequeños, reutilizables, componibles.

### 5. **Runtime-Agnostic Core**

El dominio en core-v2 no sabe nada de Lua:

```typescript
// core-v2/src/domain/scripting/api/buildEntityAPI.ts
export function buildEntityAPI(
    entity: EntityState,
    permissions: ScriptPermissions,
    scene: SceneState
): EntityAPI {
    return {
        id: entity.id,
        name: entity.displayName,
        transform: buildTransformAPI(entity.transform, permissions),
        components: buildComponentsAPI(entity, permissions),
        scripts: buildScriptsAPI(entity, permissions),
        isValid: () => scene.entities.has(entity.id),
        destroy: () => permissions.canDestroy ? destroyEntity(scene, entity.id) : throwError()
    };
}
```

**Beneficio**: El mismo sistema puede usarse con Python, JavaScript, AssemblyScript, etc.

---

## Sistema de Referencias

### Tipos de Referencia

#### 1. EntityRef (Single Entity Reference)

**TypeScript Schema:**
```typescript
interface EntityRefProperty {
    type: "entityRef";
    default: string | null;  // entity ID or null
    description?: string;
}
```

**Lua Type:**
```lua
---@class EntityRefV2
---@field entityId string?
---@field resolve fun(): EntityProxyV2?
```

**Bridge Implementation:**
```typescript
// In property resolution
if (propSchema.type === "entityRef") {
    const entityId = propValue as string | null;
    if (entityId && !scene.entities.has(entityId)) {
        console.warn(`EntityRef '${key}' points to invalid entity '${entityId}'`);
        return null;
    }
    return {
        entityId,
        resolve: () => entityId ? createEntityProxy(entityId, scene, permissions) : null
    };
}
```

#### 2. EntityRefArray (Entity Array Reference)

**TypeScript Schema:**
```typescript
interface EntityRefArrayProperty {
    type: "entityRefArray";
    default: string[];  // array of entity IDs
    description?: string;
}
```

**Lua Type:**
```lua
---@class EntityRefArrayV2
---@field [number] EntityProxyV2
```

**Bridge Implementation:**
```typescript
// In property resolution
if (propSchema.type === "entityRefArray") {
    const entityIds = propValue as string[];
    const validIds = entityIds.filter(id => scene.entities.has(id));
    if (validIds.length !== entityIds.length) {
        console.warn(`EntityRefArray '${key}' contains invalid entity IDs`);
    }
    return validIds.map(id => createEntityProxy(id, scene, permissions));
}
```

#### 3. ScriptRef (Cross-Script Reference)

**TypeScript Schema:**
```typescript
interface ScriptRefProperty {
    type: "scriptRef";
    scriptType: string;  // e.g., "MoveToPoint"
    description?: string;
}
```

**Lua Type:**
```lua
---@class ScriptProxyV2
---@field properties table  -- Read-write access to sibling script properties
---@field state table       -- Read-only access to sibling script state
```

**Bridge Implementation:**
```typescript
// In property resolution
if (propSchema.type === "scriptRef") {
    const scriptType = propSchema.scriptType;
    const siblingScript = findScriptOnEntity(entityId, scriptType);
    if (!siblingScript) {
        console.warn(`ScriptRef to '${scriptType}' not found on entity`);
        return null;
    }
    return createScriptProxy(siblingScript, permissions);
}
```

#### 4. PrefabRef (Prefab Reference)

**TypeScript Schema:**
```typescript
interface PrefabRefProperty {
    type: "prefabRef";
    default: string | null;  // prefab ID or null
    description?: string;
}
```

**Lua Usage:**
```lua
-- Properties define which prefabs can be spawned
spawnablePrefab = { type = "prefabRef", default = "prefab-enemy-basic" }

-- In code
local instance = SceneV2.instantiate(
    self.prefabRefs.spawnablePrefab,
    position,
    rotation
)
```

**Bridge Implementation:**
```typescript
// In SceneV2.instantiate()
function instantiate(prefabRef: ValidatedPrefabRef, pos, rot) {
    // Validate prefabRef is from script's declared prefabRefs
    if (!scriptPermissions.canInstantiate(prefabRef.prefabId)) {
        throw new Error(`Script cannot instantiate prefab '${prefabRef.prefabId}' - not in declared prefabRefs`);
    }
    // Proceed with instantiation
    return createEntityFromPrefab(prefabRef.prefabId, pos, rot);
}
```

### Permission System

**Script Permissions Object:**
```typescript
interface ScriptPermissions {
    /** Entity IDs this script can access */
    allowedEntityIds: Set<string>;
    
    /** Script types this script can access (siblings only) */
    allowedScriptTypes: Set<string>;
    
    /** Prefab IDs this script can instantiate */
    allowedPrefabIds: Set<string>;
    
    /** Always allowed: self entity ID */
    selfEntityId: string;
}
```

**Permission Resolution:**
```typescript
function createPermissionsFromSchema(
    schema: ScriptSchema,
    properties: Record<string, unknown>,
    entityId: string
): ScriptPermissions {
    const permissions: ScriptPermissions = {
        allowedEntityIds: new Set(),
        allowedScriptTypes: new Set(),
        allowedPrefabIds: new Set(),
        selfEntityId: entityId
    };
    
    // Extract entity refs from properties
    for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (propSchema.type === "entityRef") {
            const entityId = properties[key] as string | null;
            if (entityId) permissions.allowedEntityIds.add(entityId);
        }
        else if (propSchema.type === "entityRefArray") {
            const entityIds = properties[key] as string[];
            entityIds.forEach(id => permissions.allowedEntityIds.add(id));
        }
        else if (propSchema.type === "scriptRef") {
            permissions.allowedScriptTypes.add(propSchema.scriptType);
        }
        else if (propSchema.type === "prefabRef") {
            const prefabId = properties[key] as string | null;
            if (prefabId) permissions.allowedPrefabIds.add(prefabId);
        }
    }
    
    return permissions;
}
```

**Validation in Bridges:**
```typescript
// Entity Proxy Factory
function createEntityProxy(
    entityId: string,
    scene: SceneState,
    permissions: ScriptPermissions
): EntityProxyV2 {
    // Validate access
    if (entityId !== permissions.selfEntityId && 
        !permissions.allowedEntityIds.has(entityId)) {
        throw new Error(`Script does not have permission to access entity '${entityId}'`);
    }
    
    return {
        isValid: () => scene.entities.has(entityId),
        getPosition: () => {
            const e = scene.entities.get(entityId);
            if (!e) throw new Error(`Entity '${entityId}' not found`);
            ensureClean(e.transform);
            return { 
                x: e.transform.worldPosition.x, 
                y: e.transform.worldPosition.y, 
                z: e.transform.worldPosition.z 
            };
        },
        getRotation: () => { /* ... */ },
        getScale: () => { /* ... */ }
    };
}
```

---

## Fases de Implementación

> **Nota**: Las fases están organizadas en dos tracks principales:
> - **Track A (core-v2)**: Dominio del scripting, runtime-agnostic
> - **Track B (scripting-lua)**: Implementación específica de Lua

---

### **Fase 0: Limpieza** ⚪ (Preparación)

**Ubicación**: `packages/scripting-lua/`

**Tareas**:
- [ ] Eliminar `src/infrastructure/mock/`
- [ ] Eliminar scripts built-in actuales en `res/scripts/builtin/`
- [ ] Limpiar imports que referencien código a eliminar

**Estimado**: 30 minutos

---

### **Fase 1: Property Schema System** 🔴 (Track A: core-v2)

**Ubicación**: `packages/core-v2/src/domain/scripting/schema/`

**Objetivo**: Definir el sistema de schemas de properties para scripts

#### 1.1 Tipos Base

**Archivos nuevos**:
- `packages/core-v2/src/domain/scripting/schema/types.ts`
- `packages/core-v2/src/domain/scripting/schema/propertyTypes.ts`
- `packages/core-v2/src/domain/scripting/schema/validation.ts`
- `packages/core-v2/src/domain/scripting/schema/index.ts`

**Tareas**:
- [ ] Definir `PropertySchema` union type:
  - `NumberProperty`
  - `BooleanProperty`
  - `StringProperty`
  - `Vec3Property`
  - `EntityRefProperty`
  - `EntityRefArrayProperty`
  - `ScriptRefProperty`
  - `ComponentRefProperty`
  - `PrefabRefProperty`
- [ ] Definir `ScriptSchema` interface
- [ ] Crear type guards para validación
- [ ] Implementar validadores de schema

**Ejemplo**:
```typescript
// propertyTypes.ts
export interface EntityRefProperty {
    type: "entityRef";
    default?: string | null;
    description?: string;
    required?: boolean;
}

export interface EntityRefArrayProperty {
    type: "entityRefArray";
    default?: string[];
    description?: string;
    required?: boolean;
}

export interface ScriptRefProperty {
    type: "scriptRef";
    scriptType: string;
    description?: string;
    required?: boolean;
}

export interface ComponentRefProperty {
    type: "componentRef";
    componentTypes: ComponentType[];
    description?: string;
    required?: boolean;
}

export type PropertySchema =
    | NumberProperty
    | BooleanProperty
    | StringProperty
    | Vec3Property
    | EntityRefProperty
    | EntityRefArrayProperty
    | ScriptRefProperty
    | ComponentRefProperty
    | PrefabRefProperty;

// types.ts
export interface ScriptSchema {
    name: string;
    description?: string;
    properties: Record<string, PropertySchema>;
}
```

**Estimado**: 3-4 horas

---

### **Fase 2: Permission System** 🔴 (Track A: core-v2)

**Ubicación**: `packages/core-v2/src/domain/scripting/permissions/`

**Objetivo**: Sistema de permisos para controlar acceso de scripts

#### 2.1 Tipos y Creación

**Archivos nuevos**:
- `packages/core-v2/src/domain/scripting/permissions/types.ts`
- `packages/core-v2/src/domain/scripting/permissions/create.ts`
- `packages/core-v2/src/domain/scripting/permissions/validators.ts`
- `packages/core-v2/src/domain/scripting/permissions/index.ts`

**Tareas**:
- [ ] Definir `ScriptPermissions` interface
- [ ] Implementar `createPermissionsFromSchema()`
- [ ] Implementar validators:
  - `canAccessEntity(permissions, entityId): boolean`
  - `canAccessScript(permissions, scriptType): boolean`
  - `canAccessComponent(permissions, componentType): boolean`
  - `canInstantiatePrefab(permissions, prefabId): boolean`
- [ ] Implementar `updatePermissions()` cuando properties cambian

**Ejemplo**:
```typescript
// types.ts
export interface ScriptPermissions {
    /** Self entity ID (always accessible) */
    readonly selfEntityId: string;
    
    /** Entity IDs this script can access */
    readonly allowedEntityIds: ReadonlySet<string>;
    
    /** Script types this script can access (siblings) */
    readonly allowedScriptTypes: ReadonlySet<string>;
    
    /** Component types this script can access */
    readonly allowedComponentTypes: ReadonlySet<ComponentType>;
    
    /** Prefab IDs this script can instantiate */
    readonly allowedPrefabIds: ReadonlySet<string>;
    
    /** Whether script can destroy self entity */
    readonly canDestroySelf: boolean;
}

// create.ts
export function createPermissionsFromSchema(
    schema: ScriptSchema,
    properties: Record<string, unknown>,
    selfEntityId: string
): ScriptPermissions {
    const allowedEntityIds = new Set<string>();
    const allowedScriptTypes = new Set<string>();
    const allowedComponentTypes = new Set<ComponentType>();
    const allowedPrefabIds = new Set<string>();
    
    for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (propSchema.type === "entityRef") {
            const entityId = properties[key] as string | null;
            if (entityId) allowedEntityIds.add(entityId);
        }
        else if (propSchema.type === "entityRefArray") {
            const entityIds = properties[key] as string[];
            entityIds.forEach(id => allowedEntityIds.add(id));
        }
        else if (propSchema.type === "scriptRef") {
            allowedScriptTypes.add(propSchema.scriptType);
        }
        else if (propSchema.type === "componentRef") {
            propSchema.componentTypes.forEach(type => 
                allowedComponentTypes.add(type)
            );
        }
        else if (propSchema.type === "prefabRef") {
            const prefabId = properties[key] as string | null;
            if (prefabId) allowedPrefabIds.add(prefabId);
        }
    }
    
    return {
        selfEntityId,
        allowedEntityIds,
        allowedScriptTypes,
        allowedComponentTypes,
        allowedPrefabIds,
        canDestroySelf: true
    };
}
```

**Estimado**: 4-5 horas

---

### **Fase 3: Entity API Builder** 🔴 (Track A: core-v2)

**Ubicación**: `packages/core-v2/src/domain/scripting/api/`

**Objetivo**: Construir API de Entity (ECS-first) runtime-agnostic

#### 3.1 Entity, Transform, Components APIs

**Archivos nuevos**:
- `packages/core-v2/src/domain/scripting/api/types.ts`
- `packages/core-v2/src/domain/scripting/api/buildEntityAPI.ts`
- `packages/core-v2/src/domain/scripting/api/buildTransformAPI.ts`
- `packages/core-v2/src/domain/scripting/api/buildComponentsAPI.ts`
- `packages/core-v2/src/domain/scripting/api/buildScriptsAPI.ts`
- `packages/core-v2/src/domain/scripting/api/index.ts`

**Tareas**:
- [ ] Definir interfaces TypeScript del API:
  - `EntityAPI`
  - `TransformAPI`
  - `ComponentsAPI`
  - `ScriptsAPI`
- [ ] Implementar builders que retornan objetos con métodos
- [ ] Integrar permission checking en cada builder
- [ ] Diferenciar entre self entity (full access) y referenced entities (limited)

**Ejemplo**:
```typescript
// types.ts
export interface Vec3API {
    x: number;
    y: number;
    z: number;
}

export interface TransformAPI {
    // World transform (read/write for self, read-only for refs)
    position: Vec3API;
    rotation: Vec3API;  // Euler angles
    scale: Vec3API;
    
    // Local transform
    localPosition: Vec3API;
    localRotation: Vec3API;
    localScale: Vec3API;
    
    // Hierarchy (read-only)
    parent: EntityAPI | null;
    children: EntityAPI[];
    
    // Methods
    lookAt(target: Vec3API): void;
    setParent(parent: EntityAPI | null): void;
}

export interface EntityAPI {
    readonly id: string;
    name: string;
    transform: TransformAPI;
    components: Record<string, unknown>;  // Populated based on permissions
    scripts: Record<string, ScriptAPI>;    // Populated based on scripts on entity
    isValid(): boolean;
    destroy(): void;  // Only if self entity
}

// buildEntityAPI.ts
export function buildEntityAPI(
    entity: EntityState,
    permissions: ScriptPermissions,
    scene: SceneState,
    isSelf: boolean
): EntityAPI {
    return {
        id: entity.id,
        
        get name() {
            return entity.displayName;
        },
        set name(value: string) {
            if (!isSelf) {
                throw new Error('Cannot modify name of external entity');
            }
            entity.displayName = value;
        },
        
        transform: buildTransformAPI(entity.transform, permissions, isSelf),
        components: buildComponentsAPI(entity, permissions),
        scripts: buildScriptsAPI(entity, permissions, scene),
        
        isValid() {
            return scene.entities.has(entity.id);
        },
        
        destroy() {
            if (!isSelf) {
                throw new Error('Cannot destroy external entity');
            }
            if (!permissions.canDestroySelf) {
                throw new Error('Script does not have permission to destroy self');
            }
            destroyEntity(scene, entity.id);
        }
    };
}

// buildTransformAPI.ts
export function buildTransformAPI(
    transform: TransformState,
    permissions: ScriptPermissions,
    isSelf: boolean
): TransformAPI {
    ensureClean(transform);
    
    return {
        // Position (read/write for self, read-only for refs)
        get position() {
            return {
                x: transform.worldPosition.x,
                y: transform.worldPosition.y,
                z: transform.worldPosition.z
            };
        },
        set position(value: Vec3API) {
            if (!isSelf) {
                throw new Error('Cannot modify position of external entity');
            }
            setPosition(transform, value.x, value.y, value.z);
        },
        
        // Rotation (euler angles)
        get rotation() {
            return {
                x: transform.worldRotation.x,
                y: transform.worldRotation.y,
                z: transform.worldRotation.z
            };
        },
        set rotation(value: Vec3API) {
            if (!isSelf) {
                throw new Error('Cannot modify rotation of external entity');
            }
            setRotation(transform, value.x, value.y, value.z);
        },
        
        // ... scale, local transform, etc.
        
        lookAt(target: Vec3API) {
            if (!isSelf) {
                throw new Error('Cannot modify transform of external entity');
            }
            lookAt(transform, target);
        },
        
        setParent(parent: EntityAPI | null) {
            if (!isSelf) {
                throw new Error('Cannot modify hierarchy of external entity');
            }
            // Implementation
        }
    };
}
```

**Estimado**: 5-6 horas

---

### **Fase 4: Scene & Global APIs** 🔴 (Track A: core-v2)

**Ubicación**: `packages/core-v2/src/domain/scripting/api/`

**Objetivo**: Construir APIs globales (Scene, Input, Time)

#### 4.1 Scene API

**Archivos nuevos**:
- `packages/core-v2/src/domain/scripting/api/buildSceneAPI.ts`

**Tareas**:
- [ ] Implementar `buildSceneAPI()`:
  - `instantiate(prefabRef, position, rotation): EntityAPI`
  - `findByTag(tag): EntityAPI[]` (filtered by permissions)
  - `raycast(origin, direction, maxDist): RaycastHit`
  - `emit(eventName, data): void`
  - `on(eventName, callback): void`
- [ ] Validar prefab permissions en instantiate
- [ ] Filtrar resultados de findByTag basado en allowedEntityIds
- [ ] Raycast retorna entity proxies limitados (read transform only)

#### 4.2 Input & Time APIs

**Archivos nuevos**:
- `packages/core-v2/src/domain/scripting/api/buildInputAPI.ts`
- `packages/core-v2/src/domain/scripting/api/buildTimeAPI.ts`

**Tareas**:
- [ ] Input API (from InputPort):
  - `isKeyPressed(key): boolean`
  - `isKeyJustPressed(key): boolean`
  - `getMousePosition(): Vec2`
  - `getMouseDelta(): Vec2`
  - `isMouseButtonPressed(button): boolean`
- [ ] Time API (from TimeState):
  - `delta: number` (milliseconds)
  - `deltaSeconds: number`
  - `elapsed: number`
  - `frameCount: number`
  - `scale: number`

**Estimado**: 3-4 horas

---

### **Fase 5: Script Runtime** 🔴 (Track A: core-v2)

**Ubicación**: `packages/core-v2/src/domain/scripting/runtime/`

**Objetivo**: Gestión de script slots y lifecycle

#### 5.1 Script Slot Management

**Archivos nuevos**:
- `packages/core-v2/src/domain/scripting/runtime/types.ts`
- `packages/core-v2/src/domain/scripting/runtime/scriptSlot.ts`
- `packages/core-v2/src/domain/scripting/runtime/lifecycle.ts`
- `packages/core-v2/src/domain/scripting/runtime/index.ts`

**Tareas**:
- [ ] Definir `ScriptSlot` interface
- [ ] Implementar creación/destrucción de slots
- [ ] Lifecycle hooks:
  - `onInit(slot)`
  - `onUpdate(slot, deltaTime)`
  - `onPropertyChanged(slot, key, value)`
  - `onDestroy(slot)`
- [ ] Property reactivity system
- [ ] State management

**Ejemplo**:
```typescript
// types.ts
export interface ScriptSlot {
    readonly id: string;
    readonly entityId: string;
    readonly scriptId: string;  // built-in script type
    readonly schema: ScriptSchema;
    properties: Record<string, unknown>;
    state: Record<string, unknown>;
    permissions: ScriptPermissions;
    enabled: boolean;
}

export type LifecycleHook = 
    | 'init'
    | 'update'
    | 'onPropertyChanged'
    | 'onDestroy';

export interface ScriptRuntime {
    runHook(slot: ScriptSlot, hook: LifecycleHook, ...args: unknown[]): void;
}

// scriptSlot.ts
export function createScriptSlot(
    entityId: string,
    scriptId: string,
    schema: ScriptSchema,
    initialProperties: Record<string, unknown>
): ScriptSlot {
    return {
        id: generateId(),
        entityId,
        scriptId,
        schema,
        properties: { ...initialProperties },
        state: {},
        permissions: createPermissionsFromSchema(schema, initialProperties, entityId),
        enabled: true
    };
}

export function setSlotProperty(
    slot: ScriptSlot,
    key: string,
    value: unknown,
    runtime: ScriptRuntime
): void {
    const oldValue = slot.properties[key];
    slot.properties[key] = value;
    
    // Update permissions if entity/script refs changed
    slot.permissions = createPermissionsFromSchema(
        slot.schema,
        slot.properties,
        slot.entityId
    );
    
    // Trigger property changed hook
    runtime.runHook(slot, 'onPropertyChanged', key, value, oldValue);
}
```

**Estimado**: 4-5 horas

---

### **Fase 6: Lua Type Definitions** 🟡 (Track B: lua-scripting)

**Ubicación**: `packages/scripting-lua/res/scripts/types/`

**Objetivo**: Generar .d.lua type definitions para LSP

#### 6.1 Actualizar Type Definitions

**Archivos**:
- `duckengine.d.lua` (actualizar)

**Tareas**:
- [ ] Definir tipos que reflejen el API ECS-first:
  - `Entity` (con transform, components, scripts)
  - `Transform` (position, rotation, scale, methods)
  - `ScriptInstance` (entity, properties, state)
- [ ] Globales: `Scene`, `Input`, `Time`
- [ ] Math utilities: `math.vec3()`, `vec:distanceTo()`, etc.

**Ejemplo**:
```lua
---@meta

---@class Vec3
---@field x number
---@field y number
---@field z number
---@field distanceTo fun(self: Vec3, other: Vec3): number
---@field toArray fun(self: Vec3): number[]
---@field normalize fun(self: Vec3): Vec3
---@field add fun(self: Vec3, other: Vec3): Vec3

---@class Transform
---@field position Vec3
---@field rotation Vec3
---@field scale Vec3
---@field localPosition Vec3
---@field localRotation Vec3
---@field localScale Vec3
---@field parent Entity|nil
---@field children Entity[]
---@field lookAt fun(self: Transform, target: Vec3): void
---@field setParent fun(self: Transform, parent: Entity|nil): void

---@class Entity
---@field id string
---@field name string
---@field transform Transform
---@field components table<string, any>
---@field scripts table<string, Script>
---@field isValid fun(self: Entity): boolean
---@field destroy fun(self: Entity): void

---@class ScriptInstance
---@field entity Entity
---@field properties table<string, any>
---@field state table<string, any>
---@field emit fun(eventName: string, data: table): void
---@field on fun(eventName: string, callback: fun(data: table)): void

---@class Scene
Scene = {}
---@param prefabId string
---@param position Vec3
---@param rotation Vec3
---@return Entity
function Scene.instantiate(prefabId, position, rotation) end

---@param tag string
---@return Entity[]
function Scene.findByTag(tag) end

---@param origin Vec3
---@param direction Vec3
---@param maxDistance number
---@return { hit: boolean, entity: Entity, point: Vec3, distance: number }
function Scene.raycast(origin, direction, maxDistance) end

---@class Input
Input = {}
---@param key string
---@return boolean
function Input.isKeyPressed(key) end

---@class Time
Time = {
    delta = 0,
    deltaSeconds = 0,
    elapsed = 0,
    frameCount = 0,
    scale = 1.0
}

-- Math extensions
---@param x number
---@param y number
---@param z number
---@return Vec3
function math.vec3(x, y, z) end
```

**Estimado**: 2-3 horas

---

### **Fase 7: Lua Runtime Adapter** 🔴 (Track B: lua-scripting)

**Ubicación**: `packages/scripting-lua/src/adapters/`

**Objetivo**: Conectar core-v2 APIs con Lua runtime

#### 7.1 API Injector

**Archivos nuevos**:
- `packages/scripting-lua/src/adapters/apiInjector.ts`
- `packages/scripting-lua/src/adapters/luaTypeAdapter.ts`

**Tareas**:
- [ ] Convertir APIs TypeScript → Lua tables
- [ ] Inyectar APIs en sandbox Lua (globals)
- [ ] Convertir Vec3, Transform APIs a Lua metatables
- [ ] Manejar getters/setters TypeScript → Lua metatables

**Ejemplo**:
```typescript
// apiInjector.ts
export function injectAPIsIntoLua(
    lua: LuaEngine,
    entityAPI: EntityAPI,
    sceneAPI: SceneAPI,
    inputAPI: InputAPI,
    timeAPI: TimeAPI
): void {
    // Inject entity as 'self.entity' in script instance
    lua.global.set('__entity__', convertEntityAPIToLua(lua, entityAPI));
    
    // Inject globals
    lua.global.set('Scene', convertSceneAPIToLua(lua, sceneAPI));
    lua.global.set('Input', convertInputAPIToLua(lua, inputAPI));
    lua.global.set('Time', convertTimeAPIToLua(lua, timeAPI));
}

// luaTypeAdapter.ts
export function convertEntityAPIToLua(
    lua: LuaEngine,
    entityAPI: EntityAPI
): LuaTable {
    const entityTable = lua.newTable();
    
    entityTable.set('id', entityAPI.id);
    entityTable.set('name', entityAPI.name);
    entityTable.set('transform', convertTransformAPIToLua(lua, entityAPI.transform));
    // ... components, scripts
    
    entityTable.set('isValid', lua.createFunction(() => entityAPI.isValid()));
    entityTable.set('destroy', lua.createFunction(() => entityAPI.destroy()));
    
    return entityTable;
}

export function convertTransformAPIToLua(
    lua: LuaEngine,
    transformAPI: TransformAPI
): LuaTable {
    const transformTable = lua.newTable();
    
    // Position (with metatables for getter/setter)
    transformTable.set('position', createVec3Lua(lua, transformAPI.position));
    
    // Methods
    transformTable.set('lookAt', lua.createFunction((targetLua: LuaTable) => {
        const target = luaTableToVec3(targetLua);
        transformAPI.lookAt(target);
    }));
    
    return transformTable;
}
```

**Estimado**: 5-6 horas

---

### **Fase 8: Script Loader & Lifecycle Runner** 🟡 (Track B: lua-scripting)

**Ubicación**: `packages/scripting-lua/src/adapters/`

**Objetivo**: Cargar scripts .lua y ejecutar lifecycle hooks

#### 8.1 Implementación

**Archivos nuevos**:
- `packages/scripting-lua/src/adapters/scriptLoader.ts`
- `packages/scripting-lua/src/adapters/lifecycleRunner.ts`

**Tareas**:
- [ ] Cargar archivos .lua desde filesystem
- [ ] Parse script blueprint (schema + hooks)
- [ ] Implementar `ScriptRuntime` interface de core-v2
- [ ] Ejecutar hooks: init, update, onPropertyChanged, onDestroy
- [ ] Error handling y logging

**Ejemplo**:
```typescript
// scriptLoader.ts
export async function loadLuaScript(
    lua: LuaEngine,
    scriptPath: string
): Promise<ScriptBlueprint> {
    const luaCode = await readFile(scriptPath, 'utf-8');
    const blueprint = lua.doString(luaCode) as LuaTable;
    
    return {
        schema: parseLuaSchema(blueprint.get('schema')),
        init: blueprint.get('init') as LuaFunction | undefined,
        update: blueprint.get('update') as LuaFunction | undefined,
        onPropertyChanged: blueprint.get('onPropertyChanged') as LuaFunction | undefined,
        onDestroy: blueprint.get('onDestroy') as LuaFunction | undefined
    };
}

// lifecycleRunner.ts
export class LuaScriptRuntime implements ScriptRuntime {
    constructor(
        private lua: LuaEngine,
        private blueprints: Map<string, ScriptBlueprint>,
        private scene: SceneState
    ) {}
    
    runHook(slot: ScriptSlot, hook: LifecycleHook, ...args: unknown[]): void {
        const blueprint = this.blueprints.get(slot.scriptId);
        if (!blueprint) return;
        
        const hookFunction = blueprint[hook];
        if (!hookFunction) return;
        
        // Build self object
        const selfAPI = this.buildScriptInstanceAPI(slot);
        
        // Inject APIs into Lua
        this.injectAPIs(slot, selfAPI);
        
        // Call hook
        try {
            if (hook === 'update') {
                hookFunction.call(this.lua, selfAPI, args[0]);  // args[0] = deltaTime
            } else if (hook === 'onPropertyChanged') {
                hookFunction.call(this.lua, selfAPI, args[0], args[1], args[2]);
            } else {
                hookFunction.call(this.lua, selfAPI);
            }
        } catch (error) {
            console.error(`Error in ${hook} hook for script ${slot.scriptId}:`, error);
        }
    }
    
    private buildScriptInstanceAPI(slot: ScriptSlot): ScriptInstanceAPI {
        const entity = this.scene.entities.get(slot.entityId);
        if (!entity) throw new Error(`Entity ${slot.entityId} not found`);
        
        const entityAPI = buildEntityAPI(entity, slot.permissions, this.scene, true);
        
        return {
            entity: entityAPI,
            properties: slot.properties,
            state: slot.state,
            emit: (name: string, data: unknown) => this.eventBus.emit(name, data),
            on: (name: string, callback: Function) => this.eventBus.on(name, callback)
        };
    }
}
```

**Estimado**: 5-6 horas

---

### **Fase 9: Math Utilities** ⚪ (Track B: lua-scripting)

**Ubicación**: `packages/scripting-lua/res/scripts/system/`

**Objetivo**: Implementar math utilities en Lua

#### 9.1 Vec3 Constructor & Methods

**Archivos nuevos**:
- `packages/scripting-lua/res/scripts/system/math_ext.lua`

**Tareas**:
- [ ] `math.vec3(x, y, z)` constructor
- [ ] Vec3 metatable con métodos:
  - `vec:distanceTo(other): number`
  - `vec:toArray(): number[]`
  - `vec:normalize(): Vec3`
  - `vec:add(other): Vec3`
  - `vec:sub(other): Vec3`
  - `vec:mul(scalar): Vec3`
  - `vec:dot(other): number`
  - `vec:cross(other): Vec3`
- [ ] `math.ext.lerp(a, b, t)`
- [ ] `math.ext.clamp(value, min, max)`
- [ ] `math.ext.ease(curveName, t)` con curvas de easing

**Ejemplo**:
```lua
-- math_ext.lua
local Vec3Meta = {
    __index = {
        distanceTo = function(self, other)
            local dx = self.x - other.x
            local dy = self.y - other.y
            local dz = self.z - other.z
            return math.sqrt(dx*dx + dy*dy + dz*dz)
        end,
        
        toArray = function(self)
            return { self.x, self.y, self.z }
        end,
        
        normalize = function(self)
            local len = math.sqrt(self.x*self.x + self.y*self.y + self.z*self.z)
            if len == 0 then return math.vec3(0, 0, 0) end
            return math.vec3(self.x / len, self.y / len, self.z / len)
        end,
        
        add = function(self, other)
            return math.vec3(self.x + other.x, self.y + other.y, self.z + other.z)
        end
    }
}

function math.vec3(x, y, z)
    local vec = { x = x or 0, y = y or 0, z = z or 0 }
    setmetatable(vec, Vec3Meta)
    return vec
end

-- Math extensions
math.ext = math.ext or {}

function math.ext.lerp(a, b, t)
    return a + (b - a) * t
end

function math.ext.clamp(value, min, max)
    return math.max(min, math.min(max, value))
end

function math.ext.ease(curve, t)
    if curve == "linear" then
        return t
    elseif curve == "cubicInOut" then
        return t < 0.5 
            and 4 * t * t * t 
            or 1 - math.pow(-2 * t + 2, 3) / 2
    -- ... más curvas
    end
end
```

**Estimado**: 2-3 horas

---

### **Fase 10: Built-in Scripts v2** 🟢 (Track B: lua-scripting)

**Ubicación**: `packages/scripting-lua/res/scripts/builtin/`

**Objetivo**: Reescribir scripts críticos para v2

#### 10.1 move_to_point.lua

**Tareas**:
- [ ] Reescribir usando API ECS-first
- [ ] Properties: `targetPoint`, `duration`, `easing`, `delay`
- [ ] Lifecycle: `init`, `update`, `onPropertyChanged`
- [ ] Usar `self.entity.transform.position` en lugar de bridges

**Implementación**:
```lua
---@type ScriptBlueprint
return {
    schema = {
        name = "Move to Point",
        description = "Moves entity to target point with easing",
        properties = {
            targetPoint = { type = "vec3", default = { 0, 0, 0 } },
            duration = { type = "number", default = 2.0, min = 0.01 },
            easing = { type = "string", default = "cubicInOut" },
            delay = { type = "number", default = 0, min = 0 }
        }
    },
    
    init = function(self)
        self.state.startPos = self.entity.transform.position
        self.state.elapsed = 0
    end,
    
    onPropertyChanged = function(self, key, value)
        if key == "targetPoint" then
            self.state.startPos = self.entity.transform.position
            self.state.elapsed = 0
        end
    end,
    
    update = function(self, dt)
        local props = self.properties
        local target = math.vec3(props.targetPoint[1], props.targetPoint[2], props.targetPoint[3])
        
        local duration = math.max(0.01, props.duration)
        local delay = math.max(0, props.delay)
        
        self.state.elapsed = self.state.elapsed + (dt / 1000)
        
        if self.state.elapsed < delay then return end
        
        local active = self.state.elapsed - delay
        local raw = math.ext.clamp(active / duration, 0, 1)
        local t = math.ext.ease(props.easing, raw)
        
        local sp = self.state.startPos
        local newPos = math.vec3(
            math.ext.lerp(sp.x, target.x, t),
            math.ext.lerp(sp.y, target.y, t),
            math.ext.lerp(sp.z, target.z, t)
        )
        
        self.entity.transform.position = newPos
    end
}
```

#### 10.2 waypoint_path.lua

**Tareas**:
- [ ] Requiere move_to_point como script ref
- [ ] Properties: `waypoints` (entityRefArray), `speed`, `loop`, `easing`
- [ ] Controla move_to_point via script proxy
- [ ] Accede a waypoint transforms via entity refs

**Implementación**:
```lua
---@type ScriptBlueprint
return {
    schema = {
        name = "Waypoint Path",
        description = "Follows waypoints using sibling MoveToPoint script",
        properties = {
            waypoints = { type = "entityRefArray", default = {} },
            speed = { type = "number", default = 5, min = 0.1 },
            loop = { type = "boolean", default = true },
            easing = { type = "string", default = "cubicInOut" },
            arrivalThreshold = { type = "number", default = 0.15, min = 0.01 },
            moverScript = {
                type = "scriptRef",
                scriptType = "MoveToPoint",
                required = true
            }
        }
    },
    
    init = function(self)
        self.state.index = 1
        self.state.moving = false
    end,
    
    update = function(self, dt)
        local waypoints = self.properties.waypoints
        if #waypoints == 0 then return end
        
        local mover = self.properties.moverScript
        if not mover then return end
        
        local secs = dt / 1000
        
        -- Try to start moving to next waypoint
        while not self.state.moving do
            local wp = waypoints[self.state.index]
            if not wp or not wp:isValid() then return end
            
            local target = wp.transform.position
            local dist = self.entity.transform.position:distanceTo(target)
            
            if dist < self.properties.arrivalThreshold then
                -- Already at waypoint, advance
                self.state.index = self.state.index + 1
                if self.state.index > #waypoints then
                    if self.properties.loop then
                        self.state.index = 1
                    else
                        return  -- Path complete
                    end
                end
            else
                -- Start moving
                local duration = dist / self.properties.speed
                
                mover.properties.targetPoint = target:toArray()
                mover.properties.duration = duration
                mover.properties.easing = self.properties.easing
                mover.properties.delay = 0
                
                self.state.moving = true
                return
            end
        end
        
        -- Check arrival
        local wp = waypoints[self.state.index]
        if not wp or not wp:isValid() then return end
        
        local target = wp.transform.position
        local dist = self.entity.transform.position:distanceTo(target)
        
        if dist < self.properties.arrivalThreshold then
            -- Arrived, advance to next
            self.state.index = self.state.index + 1
            if self.state.index > #waypoints then
                if self.properties.loop then
                    self.state.index = 1
                else
                    return
                end
            end
            self.state.moving = false
        end
    end
}
```

**Estimado**: 4-5 horas

---

### **Fase 11: Integration & Testing** 🟢 (Both Tracks)

**Objetivo**: Integrar core-v2 + lua-scripting y validar end-to-end

#### 11.1 Unit Tests (core-v2)

**Ubicación**: `packages/core-v2/src/domain/scripting/**/*.spec.ts`

**Tareas**:
- [ ] Test schema validation
- [ ] Test permission creation y validation
- [ ] Test entity API builders
- [ ] Test permission violations (throws errors)

#### 11.2 Integration Tests (lua-scripting)

**Ubicación**: `packages/scripting-lua/src/**/*.spec.ts`

**Tareas**:
- [ ] Test script loading
- [ ] Test lifecycle execution (init, update, onDestroy)
- [ ] Test property reactivity (onPropertyChanged)
- [ ] Test entity refs access
- [ ] Test script refs (cross-script communication)
- [ ] Test move_to_point script end-to-end
- [ ] Test waypoint_path script end-to-end

#### 11.3 E2E Demo Scene

**Tareas**:
- [ ] Crear escena demo con:
  - Entity con move_to_point + waypoint_path scripts
  - 3-5 waypoint entities
  - Referencias configuradas correctamente
- [ ] Validar path following funciona
- [ ] Validar loop behavior

**Estimado**: 8-10 horas

---

### **Fase 12: Documentation** ⚪ (Final)

**Objetivo**: Documentar sistema completo

**Archivos nuevos**:
- `packages/core-v2/src/domain/scripting/README.md`
- `packages/scripting-lua/docs/V2_API_REFERENCE.md`
- `packages/scripting-lua/docs/MIGRATION_GUIDE.md`
- `packages/scripting-lua/docs/SCRIPT_AUTHORING.md`

**Tareas**:
- [ ] Documentar arquitectura (dominio en core-v2)
- [ ] API reference completo (Entity, Transform, Scene, etc.)
- [ ] Guía de creación de scripts
- [ ] Ejemplos de scripts comunes
- [ ] Guía de migración v1 → v2

**Estimado**: 4-5 horas

---

## Plan de Ejecución

### Orden Recomendado

```
Track A (core-v2):
Fase 1: Property Schema (3-4h)
    ↓
Fase 2: Permissions (4-5h)
    ↓
Fase 3: Entity API (5-6h)
    ↓
Fase 4: Scene/Global APIs (3-4h)
    ↓
Fase 5: Script Runtime (4-5h)

Track B (lua-scripting):
Fase 6: Lua Types (2-3h) — Después de Fase 3
    ↓
Fase 7: Lua Adapter (5-6h) — Después de Fase 4
    ↓
Fase 8: Lifecycle Runner (5-6h) — Después de Fase 5
    ↓
Fase 9: Math Utilities (2-3h)
    ↓
Fase 10: Built-in Scripts (4-5h)

Integration:
Fase 11: Testing (8-10h)
    ↓
Fase 12: Documentation (4-5h)
```

### Total Estimado

- **Track A (core-v2)**: 19-24 horas
- **Track B (lua-scripting)**: 18-23 horas
- **Integration**: 12-15 horas
- **TOTAL**: **49-62 horas** (6-8 días de trabajo)

---

## Milestones

### **M1: Core Domain Complete** (Track A)
- Fases 1-5 completas
- Property schemas, permissions, APIs implementados en core-v2
- **Criterio**: Tests unitarios passing, puede construir Entity/Scene APIs

### **M2: Lua Integration Ready** (Track B)
- Fases 6-8 completas
- Lua adapter conecta core-v2 → Lua
- **Criterio**: Puede ejecutar script Lua simple con entity.transform access

### **M3: Scripts Functional** (Proof-of-Concept)
- Fases 9-10 completas
- move_to_point y waypoint_path funcionando
- **Criterio**: Demo scene con waypoint path ejecutándose correctamente

### **M4: Production Ready**
- Fases 11-12 completas
- Tests passing, documentación completa
- **Criterio**: Sistema listo para uso en producción

---

## Decisiones de Diseño

### 1. Entity Ref Write Access
**Decisión**: Entity refs externos son **read-only** para transform
- `entity.transform.position` read ✅
- `entity.transform.position = newPos` write ❌ (throws si no es self)

**Razón**: Evitar mutaciones implícitas. Scripts deben comunicarse via eventos o script refs explícitos.

### 2. Component Access
**Decisión**: Component access requiere `componentRef` en schema
```lua
properties = {
    requiredComponents = {
        type = "componentRef",
        componentTypes = { "rigidBody", "health" }
    }
}

-- En código
local rb = self.entity.components.rigidBody  -- ✅ Solo si está en componentRef
```

**Razón**: Explicitez. El schema documenta qué components necesita el script.

### 3. Prefab Instantiation
**Decisión**: Solo prefabs en `prefabRef` properties
```lua
properties = {
    enemyPrefab = { type = "prefabRef", default = "enemy-basic" }
}

local enemy = Scene.instantiate(self.properties.enemyPrefab, pos, rot)
```

**Razón**: Scripts no pueden spawnear entities arbitrarias. Deben declarar qué pueden spawnear.

### 4. Raycast Hits
**Decisión**: Raycast retorna entity proxies limitados (read-only transform)
```lua
local hit = Scene.raycast(origin, dir, maxDist)
if hit.hit then
    local pos = hit.entity.transform.position  -- ✅ Read only
    hit.entity.components  -- ❌ No component access
end
```

**Razón**: Raycast es descubrimiento físico válido, pero no otorga permisos completos.

---

## Próximos Pasos

1. **Kick-off Fase 0**: Limpieza (30 min)
   - Eliminar mock/
   - Eliminar built-in scripts actuales
2. **Kick-off Fase 1**: Property Schema en core-v2 (3-4h)
   - Crear domain/scripting/ en core-v2
   - Definir tipos de properties
3. **Continuous**: Ir completando fases según plan

---

## Notas Finales

Esta arquitectura ofrece:

✅ **Separación limpia**: Dominio en core-v2, runtime en lua-scripting  
✅ **ECS-First**: API refleja exactamente la estructura ECS  
✅ **Runtime-agnostic**: core-v2 puede usarse con otros runtimes (Python, JS, etc.)  
✅ **Type safety**: TypeScript en core-v2 + .d.lua en lua-scripting  
✅ **Testabilidad**: Dominio puede testearse sin Wasmoon  
✅ **Reusabilidad**: Scripts son componentes modulares y componibles  
✅ **Seguridad**: Permission system evita accesos no declarados  

El sistema es más robusto, mantenible y extensible que v1.


**Objetivo**: Definir e implementar los tipos de referencia en el sistema de properties

#### 1.1 TypeScript Schema Extensions

**Archivos**:
- `packages/scripting-lua/src/domain/schema/propertyTypes.ts` (nuevo)
- `packages/scripting-lua/src/domain/schema/index.ts` (actualizar)

**Tareas**:
- [ ] Definir tipos TypeScript para property schemas:
  - `EntityRefProperty`
  - `EntityRefArrayProperty`
  - `ScriptRefProperty`
  - `PrefabRefProperty`
- [ ] Crear type guards para validación de runtime
- [ ] Extender `PropertySchema` union type

**Ejemplo**:
```typescript
// propertyTypes.ts
export type PropertySchema =
    | NumberProperty
    | StringProperty
    | BooleanProperty
    | Vec3Property
    | EntityRefProperty
    | EntityRefArrayProperty
    | ScriptRefProperty
    | PrefabRefProperty;

export interface EntityRefProperty {
    type: "entityRef";
    default: string | null;
    description?: string;
}

export interface EntityRefArrayProperty {
    type: "entityRefArray";
    default: string[];
    description?: string;
}

export interface ScriptRefProperty {
    type: "scriptRef";
    scriptType: string;
    description?: string;
}

export interface PrefabRefProperty {
    type: "prefabRef";
    default: string | null;
    description?: string;
}
```

#### 1.2 Lua Type Definitions

**Archivos**:
- `packages/scripting-lua/res/scripts/types/entity_v2.d.lua` (actualizar)
- `packages/scripting-lua/res/scripts/types/script_instance_v2.d.lua` (actualizar)

**Tareas**:
- [ ] Definir `EntityProxyV2` class
- [ ] Definir `ScriptProxyV2` class
- [ ] Definir `PrefabRefV2` class
- [ ] Agregar campos a `ScriptInstanceV2`:
  - `entityRefs: table<string, EntityProxyV2>`
  - `scriptRefs: table<string, ScriptProxyV2>`
  - `prefabRefs: table<string, PrefabRefV2>`

**Ejemplo**:
```lua
---@class EntityProxyV2
---@field isValid fun(): boolean
---@field getPosition fun(): Vec3V2
---@field getRotation fun(): Vec3V2
---@field getScale fun(): Vec3V2

---@class ScriptProxyV2
---@field properties table<string, any>
---@field state table<string, any>

---@class PrefabRefV2
---@field prefabId string
---@field instantiate fun(position: Vec3V2, rotation: Vec3V2): EntityProxyV2

---@class ScriptInstanceV2
---@field properties table
---@field state table
---@field entityRefs table<string, EntityProxyV2>
---@field scriptRefs table<string, ScriptProxyV2>
---@field prefabRefs table<string, PrefabRefV2>
```

**Estimado**: 3-4 horas

---

### **Fase 2: Permission System** 🔴 (Crítico)

**Objetivo**: Implementar sistema de permisos y validación de acceso

#### 2.1 ScriptPermissions

**Archivos**:
- `packages/scripting-lua/src/domain/permissions/index.ts` (nuevo)
- `packages/scripting-lua/src/domain/permissions/types.ts` (nuevo)

**Tareas**:
- [ ] Definir `ScriptPermissions` interface
- [ ] Implementar `createPermissionsFromSchema()`
- [ ] Implementar validation helpers:
  - `canAccessEntity(entityId): boolean`
  - `canAccessScript(scriptType): boolean`
  - `canInstantiatePrefab(prefabId): boolean`

**Ejemplo**:
```typescript
// types.ts
export interface ScriptPermissions {
    allowedEntityIds: Set<string>;
    allowedScriptTypes: Set<string>;
    allowedPrefabIds: Set<string>;
    selfEntityId: string;
}

// index.ts
export function createPermissionsFromSchema(
    schema: ScriptSchema,
    properties: Record<string, unknown>,
    entityId: string
): ScriptPermissions {
    // Implementation as shown in "Permission System" section above
}

export function canAccessEntity(
    permissions: ScriptPermissions,
    entityId: string
): boolean {
    return entityId === permissions.selfEntityId || 
           permissions.allowedEntityIds.has(entityId);
}
```

#### 2.2 Property Resolution con Referencias

**Archivos**:
- `packages/scripting-lua/src/domain/sandbox/propertyResolver.ts` (nuevo)

**Tareas**:
- [ ] Implementar resolución de `entityRef` → `EntityProxyV2`
- [ ] Implementar resolución de `entityRefArray` → `EntityProxyV2[]`
- [ ] Implementar resolución de `scriptRef` → `ScriptProxyV2`
- [ ] Implementar resolución de `prefabRef` → `PrefabRefV2`
- [ ] Validar referencias durante resolución (warn on invalid IDs)

**Ejemplo**:
```typescript
export function resolveProperty(
    key: string,
    propSchema: PropertySchema,
    propValue: unknown,
    scene: SceneState,
    entityId: string,
    permissions: ScriptPermissions
): unknown {
    switch (propSchema.type) {
        case "entityRef":
            return resolveEntityRef(propValue as string | null, scene, permissions);
        case "entityRefArray":
            return resolveEntityRefArray(propValue as string[], scene, permissions);
        case "scriptRef":
            return resolveScriptRef(propSchema.scriptType, entityId, scene, permissions);
        case "prefabRef":
            return resolvePrefabRef(propValue as string | null, permissions);
        // ... other types
    }
}
```

**Estimado**: 4-5 horas

---

### **Fase 3: Entity Proxy Implementation** 🔴 (Crítico)

**Objetivo**: Crear proxy objects para entity references con API limitada

#### 3.1 Entity Proxy Factory

**Archivos**:
- `packages/scripting-lua/src/domain/proxies/entityProxy.ts` (nuevo)
- `packages/scripting-lua/src/domain/proxies/types.ts` (nuevo)

**Tareas**:
- [ ] Implementar `createEntityProxy(entityId, scene, permissions)`
- [ ] Validar permisos en cada método
- [ ] Implementar API limitada:
  - `isValid(): boolean`
  - `getPosition(): Vec3V2`
  - `getRotation(): Vec3V2`
  - `getScale(): Vec3V2`
- [ ] Decidir: ¿permitir `setPosition/setRotation` en entity refs externas?
  - **Recomendación**: Solo read-only para entity refs, write solo via `self` (ScriptInstance methods)

**Ejemplo**:
```typescript
export interface EntityProxyV2 {
    isValid(): boolean;
    getPosition(): { x: number; y: number; z: number };
    getRotation(): { x: number; y: number; z: number };
    getScale(): { x: number; y: number; z: number };
}

export function createEntityProxy(
    entityId: string,
    scene: SceneState,
    permissions: ScriptPermissions
): EntityProxyV2 {
    // Validate permission
    if (!canAccessEntity(permissions, entityId)) {
        throw new Error(
            `Script does not have permission to access entity '${entityId}'. ` +
            `Declare it in properties as entityRef or entityRefArray.`
        );
    }
    
    return {
        isValid: () => scene.entities.has(entityId),
        
        getPosition: () => {
            const e = scene.entities.get(entityId);
            if (!e) throw new Error(`Entity '${entityId}' not found`);
            ensureClean(e.transform);
            const pos = e.transform.worldPosition;
            return { x: pos.x, y: pos.y, z: pos.z };
        },
        
        getRotation: () => {
            const e = scene.entities.get(entityId);
            if (!e) throw new Error(`Entity '${entityId}' not found`);
            ensureClean(e.transform);
            const rot = e.transform.worldRotation;
            return { x: rot.x, y: rot.y, z: rot.z };
        },
        
        getScale: () => {
            const e = scene.entities.get(entityId);
            if (!e) throw new Error(`Entity '${entityId}' not found`);
            ensureClean(e.transform);
            const scale = e.transform.worldScale;
            return { x: scale.x, y: scale.y, z: scale.z };
        }
    };
}
```

**Estimado**: 3-4 horas

---

### **Fase 4: Script Proxy Implementation** 🟡 (Alta prioridad)

**Objetivo**: Implementar cross-script references con validation

#### 4.1 Script Proxy Factory

**Archivos**:
- `packages/scripting-lua/src/domain/proxies/scriptProxy.ts` (nuevo)

**Tareas**:
- [ ] Implementar `createScriptProxy(scriptSlotId, scene, permissions)`
- [ ] Implementar property getters/setters con reactivity
- [ ] Implementar state getters (read-only)
- [ ] Validar que script existe en misma entidad
- [ ] Trigger `onPropertyChanged` cuando se modifiquen properties del sibling

**Ejemplo**:
```typescript
export interface ScriptProxyV2 {
    properties: Record<string, unknown>;
    state: Readonly<Record<string, unknown>>;
}

export function createScriptProxy(
    scriptSlotId: string,
    scriptType: string,
    entityId: string,
    scene: SceneState,
    permissions: ScriptPermissions
): ScriptProxyV2 | null {
    // Validate permission
    if (!permissions.allowedScriptTypes.has(scriptType)) {
        throw new Error(
            `Script does not have permission to access script type '${scriptType}'. ` +
            `Declare it in properties as scriptRef.`
        );
    }
    
    // Find script slot on same entity
    const entity = scene.entities.get(entityId);
    if (!entity) return null;
    
    const scriptSlot = findScriptSlotByType(entity, scriptType);
    if (!scriptSlot) return null;
    
    return {
        // Property proxy with reactivity
        properties: new Proxy(scriptSlot.properties, {
            get(target, prop: string) {
                return target[prop];
            },
            set(target, prop: string, value: unknown) {
                const oldValue = target[prop];
                target[prop] = value;
                
                // Trigger onPropertyChanged on sibling script
                triggerPropertyChanged(scriptSlot, prop, value, oldValue);
                
                return true;
            }
        }),
        
        // State is read-only
        state: new Proxy(scriptSlot.state, {
            get(target, prop: string) {
                return target[prop];
            },
            set() {
                throw new Error('Cannot modify state of sibling script. State is read-only.');
            }
        })
    };
}
```

#### 4.2 Script Type Enumeration

**Archivos**:
- `packages/scripting-lua/res/scripts/system/script_types.lua` (nuevo)

**Tareas**:
- [ ] Crear enumeración de script types disponibles
- [ ] Auto-generar desde manifest de scripts built-in
- [ ] Integrar en sandbox initialization

**Ejemplo**:
```lua
-- script_types.lua
---@enum ScriptTypeV2
ScriptTypeV2 = {
    MoveToPoint = "MoveToPoint",
    WaypointPath = "WaypointPath",
    ContinuousRotator = "ContinuousRotator",
    -- auto-generated from built-in scripts manifest
}
```

**Estimado**: 4-5 horas

---

### **Fase 5: Bridge Enhancements** 🟡 (Alta prioridad)

**Objetivo**: Actualizar bridges para usar permission system y proxies

#### 5.1 Transform Bridge

**Archivos**:
- `packages/scripting-lua/src/domain/bridges/transformBridge.ts`

**Tareas**:
- [ ] Mantener API actual (scoped to self entity)
- [ ] No requiere cambios de permissions (siempre accede a self)
- [ ] Validar que solo accede a `permissions.selfEntityId`

**Cambios**: Mínimos (ya está scoped correctamente)

#### 5.2 Scene Bridge

**Archivos**:
- `packages/scripting-lua/src/domain/bridges/sceneBridge.ts`

**Tareas**:
- [ ] ❌ **ELIMINAR**: `getEntity(id)` — violación de principio de referencias
- [ ] ❌ **ELIMINAR**: `getComponentProperty(entityId, ...)` — violación 
- [ ] ❌ **ELIMINAR**: `setComponentProperty(entityId, ...)` — violación
- [ ] ❌ **ELIMINAR**: `hasComponent(entityId, ...)` — violación
- [ ] ❌ **ELIMINAR**: `getAllEntityIds()` — violación
- [ ] ✅ **MANTENER**: `fireEvent(name, data)` — eventos son globales
- [ ] ✅ **MANTENER**: `onEvent(slotId, name, cb)` — eventos son globales
- [ ] ✅ **AGREGAR**: `instantiate(prefabRef, position, rotation)` con validation

**Implementación de `instantiate`**:
```typescript
instantiate(
    prefabRefLua: { prefabId: string },
    position: { x: number; y: number; z: number },
    rotation: { x: number; y: number; z: number }
): EntityProxyV2 {
    const prefabId = prefabRefLua.prefabId;
    
    // Validate permission
    if (!permissions.canInstantiatePrefab(prefabId)) {
        throw new Error(
            `Script cannot instantiate prefab '${prefabId}'. ` +
            `Declare it in properties as prefabRef.`
        );
    }
    
    // Instantiate prefab entity
    const newEntityId = createEntityFromPrefab(scene, prefabId, position, rotation);
    
    // Return entity proxy (with temporary permission for new entity)
    return createEntityProxy(newEntityId, scene, {
        ...permissions,
        allowedEntityIds: new Set([...permissions.allowedEntityIds, newEntityId])
    });
}
```

#### 5.3 Physics Bridge

**Archivos**:
- `packages/scripting-lua/src/domain/bridges/physicsBridge.ts`

**Tareas**:
- [ ] Validar que `raycast()` solo retorna entity proxies para entities permitidas
- [ ] Filtrar resultados de raycast que no estén en `allowedEntityIds`
  - **Decisión de diseño**: ¿Permitir raycast hits de cualquier entity, o solo de allowed?
  - **Recomendación**: Permitir hits de cualquier entity (raycast es descubrimiento físico), pero entity proxy solo da información limitada (position, rotation, scale)

**Implementación**:
```typescript
raycast(query: RaycastQueryV2): RaycastHitV2 | null {
    const hit = physicsPort.raycast(query);
    if (!hit) return null;
    
    // Allow hit discovery, but entity proxy is limited to read-only transform
    return {
        entityId: hit.entityId,
        point: hit.point,
        distance: hit.distance,
        entity: createEntityProxy(hit.entityId, scene, {
            ...permissions,
            // Grant temporary read permission for raycast hit
            allowedEntityIds: new Set([...permissions.allowedEntityIds, hit.entityId])
        })
    };
}
```

#### 5.4 Bridge Context

**Archivos**:
- `packages/scripting-lua/src/domain/bridges/bridgeContext.ts`

**Tareas**:
- [ ] Pasar `ScriptPermissions` a todas las bridge factories
- [ ] Actualizar firma de `BridgeFactory`:
  ```typescript
  export type BridgeFactory = (
      scene: SceneState,
      entityId: string,
      ports: BridgePorts,
      permissions: ScriptPermissions  // NUEVO
  ) => Record<string, unknown>;
  ```
- [ ] Actualizar `createScriptBridgeContext()` para crear permissions y pasarlas

**Estimado**: 5-6 horas

---

### **Fase 6: Self Methods (ScriptInstance API)** 🟡 (Alta prioridad)

**Objetivo**: Expandir API de `self` (ScriptInstance) con métodos entity-like

#### 6.1 ScriptInstance Self Methods

**Archivos**:
- `packages/scripting-lua/src/domain/sandbox/scriptInstanceProxy.ts` (nuevo o actualizar)
- `packages/scripting-lua/res/scripts/types/script_instance_v2.d.lua`

**Tareas**:
- [ ] Implementar métodos de transform en `self`:
  - `self:getPosition(): Vec3V2`
  - `self:setPosition(pos: Vec3V2 | table): void`
  - `self:getRotation(): Vec3V2`
  - `self:setRotation(rot: Vec3V2 | table): void`
  - `self:getScale(): Vec3V2`
  - `self:setScale(scale: Vec3V2 | table): void`
- [ ] Estos métodos actúan sobre `permissions.selfEntityId`
- [ ] Implementar usando transform bridge internamente

**Ejemplo Lua Type**:
```lua
---@class ScriptInstanceV2
---@field properties table
---@field state table
---@field entityRefs table<string, EntityProxyV2>
---@field scriptRefs table<string, ScriptProxyV2>
---@field prefabRefs table<string, PrefabRefV2>
---@field getPosition fun(self: ScriptInstanceV2): Vec3V2
---@field setPosition fun(self: ScriptInstanceV2, pos: Vec3V2|table): void
---@field getRotation fun(self: ScriptInstanceV2): Vec3V2
---@field setRotation fun(self: ScriptInstanceV2, rot: Vec3V2|table): void
---@field getScale fun(self: ScriptInstanceV2): Vec3V2
---@field setScale fun(self: ScriptInstanceV2, scale: Vec3V2|table): void
```

**Implementación TypeScript**:
```typescript
function createScriptInstanceProxy(
    scriptSlot: ScriptSlot,
    scene: SceneState,
    bridges: ScriptBridgeContext,
    permissions: ScriptPermissions
): ScriptInstanceV2 {
    const transformBridge = bridges.Transform;
    
    return {
        properties: scriptSlot.properties,
        state: scriptSlot.state,
        entityRefs: resolvedEntityRefs,
        scriptRefs: resolvedScriptRefs,
        prefabRefs: resolvedPrefabRefs,
        
        // Transform methods (forward to transform bridge)
        getPosition: () => transformBridge.getPosition(),
        setPosition: (pos: Vec3V2 | { x: number; y: number; z: number }) => {
            if (Array.isArray(pos)) {
                transformBridge.setPosition(pos[0], pos[1], pos[2]);
            } else {
                transformBridge.setPosition(pos.x, pos.y, pos.z);
            }
        },
        getRotation: () => transformBridge.getRotation(),
        setRotation: (rot: Vec3V2 | { x: number; y: number; z: number }) => {
            if (Array.isArray(rot)) {
                transformBridge.setRotation(rot[0], rot[1], rot[2]);
            } else {
                transformBridge.setRotation(rot.x, rot.y, rot.z);
            }
        },
        getScale: () => transformBridge.getScale(),
        setScale: (scale: Vec3V2 | { x: number; y: number; z: number }) => {
            if (Array.isArray(scale)) {
                transformBridge.setScale(scale[0], scale[1], scale[2]);
            } else {
                transformBridge.setScale(scale.x, scale.y, scale.z);
            }
        }
    };
}
```

**Estimado**: 3-4 horas

---

### **Fase 7: Math Utilities & Vec3** ⚪ (Media prioridad)

**Objetivo**: Asegurar que Vec3 y math utilities funcionen correctamente

#### 7.1 Vec3 Constructor y Métodos

**Archivos**:
- `packages/scripting-lua/res/scripts/system/math_ext_v2.lua` (nuevo)
- `packages/scripting-lua/res/scripts/types/math_v2.d.lua`

**Tareas**:
- [ ] Implementar `math.vec3(x, y, z)` constructor
- [ ] Implementar métodos en Vec3:
  - `vec:distanceTo(other): number`
  - `vec:toArray(): number[]`
  - `vec:normalize(): Vec3V2`
  - `vec:add(other): Vec3V2`
  - `vec:sub(other): Vec3V2`
  - `vec:mul(scalar): Vec3V2`
  - `vec:dot(other): number`
  - `vec:cross(other): Vec3V2`
- [ ] Implementar usando metatables

**Ejemplo**:
```lua
-- math_ext_v2.lua
local Vec3V2Meta = {
    __index = {
        distanceTo = function(self, other)
            local dx = self.x - other.x
            local dy = self.y - other.y
            local dz = self.z - other.z
            return math.sqrt(dx*dx + dy*dy + dz*dz)
        end,
        
        toArray = function(self)
            return { self.x, self.y, self.z }
        end,
        
        -- ... other methods
    }
}

function math.vec3(x, y, z)
    local vec = { x = x or 0, y = y or 0, z = z or 0 }
    setmetatable(vec, Vec3V2Meta)
    return vec
end
```

#### 7.2 Math Extensions

**Tareas**:
- [ ] Implementar `math.ext.lerp(a, b, t)`
- [ ] Implementar `math.ext.clamp(value, min, max)`
- [ ] Implementar `math.ext.ease(curveName, t)` con curvas:
  - `"linear"`, `"cubicIn"`, `"cubicOut"`, `"cubicInOut"`
  - `"sineIn"`, `"sineOut"`, `"sineInOut"`
  - `"bounceOut"`, `"elasticOut"`
- [ ] Copiar implementaciones de v1 `math_ext.lua`

**Estimado**: 2-3 horas

---

### **Fase 8: Script Rewrites** 🟢 (Proof-of-Concept)

**Objetivo**: Reescribir `move_to_point` y `waypoint_path` para v2

#### 8.1 move_to_point.lua (v2)

**Archivos**:
- `packages/scripting-lua/res/scripts/builtin/move_to_point_v2.lua` (nuevo)

**Features a preservar**:
- Properties: `targetPoint` (vec3), `duration` (number), `easing` (string), `delay` (number)
- Property reactivity: `onPropertyChanged` hook
- Math utilities: `lerp`, `clamp`, `ease`
- Vec3 constructor y métodos

**Cambios v2**:
- Usar tipos V2 suffixed
- Usar `self:getPosition()`, `self:setPosition()` en lugar de `Transform` bridge directo
- Seguir nuevo schema format

**Implementación**:
```lua
---@type ScriptBlueprintV2
return {
    schema = {
        name = "Move to Point (Eased) v2",
        description = "Moves the entity to a target point over time using an easing curve.",
        properties = {
            targetPoint = { 
                type = "vec3", 
                default = { 0, 0, 0 }, 
                description = "Destination world coordinate." 
            },
            duration = { 
                type = "number", 
                default = 2.0, 
                description = "Travel time in seconds." 
            },
            easing = { 
                type = "string", 
                default = "cubicInOut", 
                description = "Easing curve name." 
            },
            delay = { 
                type = "number", 
                default = 0, 
                description = "Delay in seconds before starting movement." 
            }
        }
    },

    ---@param self ScriptInstanceV2
    init = function(self)
        self.state.startPos = self:getPosition()
        self.state.elapsed = 0
        self.state.active = false
    end,

    ---@param self ScriptInstanceV2
    onPropertyChanged = function(self, key, value)
        if key == "targetPoint" then
            self.state.startPos = self:getPosition()
            self.state.elapsed = 0
            self.state.active = false
        end
    end,

    ---@param self ScriptInstanceV2
    ---@param dt number
    update = function(self, dt)
        local props = self.properties
        local target = props.targetPoint
        if not target then return end

        local duration = math.max(0.01, props.duration)
        local delay = math.max(0, props.delay)
        local secs = dt / 1000
        
        self.state.elapsed = self.state.elapsed + secs

        if self.state.elapsed < delay then return end

        local active = self.state.elapsed - delay
        local raw = math.ext.clamp(active / duration, 0, 1)
        local t = math.ext.ease(props.easing or "cubicInOut", raw)

        local sp = self.state.startPos
        if not sp then return end

        -- Use self methods instead of Transform bridge
        self:setPosition(math.vec3(
            math.ext.lerp(sp.x, target.x, t),
            math.ext.lerp(sp.y, target.y, t),
            math.ext.lerp(sp.z, target.z, t)
        ))
    end
}
```

**Testing**:
- [ ] Crear escena de test con entity + script
- [ ] Verificar movimiento suave
- [ ] Verificar reactivity al cambiar `targetPoint`
- [ ] Verificar delay y easing curves

**Estimado**: 2-3 horas

#### 8.2 waypoint_path.lua (v2)

**Archivos**:
- `packages/scripting-lua/res/scripts/builtin/waypoint_path_v2.lua` (nuevo)

**Features a preservar**:
- Properties: `speed`, `loop`, `waypoints` (entityArray), `easing`, `arrivalThreshold`
- Cross-script access a `move_to_point`
- Entity array iteration
- Entity proxy methods (`isValid`, `getPosition`)
- Sibling script property mutation

**Cambios v2**:
- `waypoints` es `entityRefArray`
- Cross-script reference via `scriptRefs`:
  ```lua
  schema = {
      properties = {
          -- ...
          moverScript = {
              type = "scriptRef",
              scriptType = "MoveToPoint",
              description = "Reference to sibling MoveToPoint script"
          }
      }
  }
  ```
- Usar `self.scriptRefs.moverScript` en lugar de `self.scripts[Script.MoveToPoint]`
- Usar `self:getPosition()` en lugar de acceso directo a transform

**Implementación**:
```lua
---@type ScriptBlueprintV2
return {
    schema = {
        name = "Waypoint Path v2",
        description = "Follows a sequence of waypoint entities by driving a sibling Move-to-Point script.",
        properties = {
            speed = { 
                type = "number", 
                default = 3, 
                description = "Movement speed in units/sec." 
            },
            loop = { 
                type = "boolean", 
                default = true, 
                description = "Loop back to start when the end is reached." 
            },
            waypoints = { 
                type = "entityRefArray", 
                default = {}, 
                description = "Ordered list of waypoint entities." 
            },
            easing = { 
                type = "string", 
                default = "cubicInOut", 
                description = "Easing curve forwarded to Move-to-Point." 
            },
            arrivalThreshold = { 
                type = "number", 
                default = 0.15, 
                description = "Distance at which the waypoint is considered reached." 
            },
            moverScript = {
                type = "scriptRef",
                scriptType = "MoveToPoint",
                description = "Reference to sibling MoveToPoint script (required)"
            }
        }
    },

    ---@param self ScriptInstanceV2
    init = function(self)
        self.state.index = 1
        self.state.moving = false
        self.state.segTime = 0
        self.state.elapsed = 0
    end,

    ---@param self ScriptInstanceV2
    ---@param dt number
    update = function(self, dt)
        -- Access waypoints via entityRefs (already resolved to EntityProxyV2[])
        local wps = self.entityRefs.waypoints
        if not wps then return end

        local count = #wps
        if count < 1 then return end

        -- Access sibling move_to_point script via scriptRefs
        local mtp = self.scriptRefs.moverScript
        if not mtp then return end

        local secs = dt / 1000

        -- Skip waypoints we are already on top of
        while not self.state.moving do
            local idx = self.state.index
            local wp = wps[idx]
            if not wp or not wp:isValid() then return end

            local target = wp:getPosition()
            local dist = self:getPosition():distanceTo(target)

            if dist < (self.properties.arrivalThreshold or 0.15) then
                -- Already at this waypoint — advance
                local nextIdx = idx + 1
                if nextIdx > count then
                    if self.properties.loop then
                        nextIdx = 1
                    else
                        return -- path complete
                    end
                end
                self.state.index = nextIdx
            else
                -- Push target to move_to_point via ScriptProxyV2
                local duration = dist / math.max(0.01, self.properties.speed)

                mtp.properties.targetPoint = target:toArray()
                mtp.properties.duration = duration
                mtp.properties.easing = self.properties.easing or "cubicInOut"
                mtp.properties.delay = 0

                self.state.moving = true
                self.state.segTime = duration
                self.state.elapsed = 0
                return
            end
        end

        -- Check arrival
        self.state.elapsed = self.state.elapsed + secs

        local idx = self.state.index
        local wp = wps[idx]
        if not wp or not wp:isValid() then return end

        local target = wp:getPosition()
        local dist = self:getPosition():distanceTo(target)

        if dist < (self.properties.arrivalThreshold or 0.15) then
            -- Advance to next waypoint
            local nextIdx = idx + 1
            if nextIdx > count then
                if self.properties.loop then
                    nextIdx = 1
                else
                    return -- path complete
                end
            end
            self.state.index = nextIdx
            self.state.moving = false
        end
    end
}
```

**Testing**:
- [ ] Crear escena con entity + waypoint_path + move_to_point scripts
- [ ] Crear 3-5 waypoint entities en la escena
- [ ] Referenciar waypoints en property array
- [ ] Referenciar move_to_point en scriptRef
- [ ] Verificar path siguiendo waypoints
- [ ] Verificar loop behavior
- [ ] Verificar arrival threshold

**Estimado**: 3-4 horas

---

### **Fase 9: Integration & Testing** 🟢 (Validación)

**Objetivo**: Integrar todos los componentes y validar funcionamiento end-to-end

#### 9.1 Sandbox Integration

**Archivos**:
- `packages/scripting-lua/src/infrastructure/wasmoon/sandbox.ts` (actualizar)

**Tareas**:
- [ ] Integrar property resolver con nuevos tipos de referencia
- [ ] Integrar permission system en creación de bridge context
- [ ] Integrar proxies (entity, script) en script instance
- [ ] Asegurar que lifecycle hooks reciban script instance correcto

#### 9.2 Unit Tests

**Archivos**:
- `packages/scripting-lua/src/domain/permissions/index.spec.ts` (nuevo)
- `packages/scripting-lua/src/domain/proxies/entityProxy.spec.ts` (nuevo)
- `packages/scripting-lua/src/domain/proxies/scriptProxy.spec.ts` (nuevo)
- `packages/scripting-lua/src/domain/bridges/sceneBridge.spec.ts` (actualizar)

**Tareas**:
- [ ] Test permission validation (canAccessEntity, canAccessScript, canInstantiatePrefab)
- [ ] Test entity proxy creation y methods
- [ ] Test entity proxy permission denial (throws error)
- [ ] Test script proxy property mutation y reactivity
- [ ] Test script proxy state read-only (throws on write)
- [ ] Test Scene.instantiate permission validation

#### 9.3 Integration Tests

**Archivos**:
- `packages/scripting-lua/src/__tests__/integration/move_to_point_v2.spec.ts` (nuevo)
- `packages/scripting-lua/src/__tests__/integration/waypoint_path_v2.spec.ts` (nuevo)
- `packages/scripting-lua/src/__tests__/integration/entity_refs.spec.ts` (nuevo)

**Tareas**:
- [ ] Test move_to_point script end-to-end
- [ ] Test waypoint_path script end-to-end
- [ ] Test entity refs (single y array)
- [ ] Test script refs (cross-script communication)
- [ ] Test prefab instantiation
- [ ] Test permission violations (invalid entity access, invalid prefab spawn)

**Estimado**: 6-8 horas

---

### **Fase 10: Documentation & Migration Guide** ⚪ (Documentación)

**Objetivo**: Documentar nuevo sistema y guiar migración de v1 a v2

#### 10.1 API Documentation

**Archivos**:
- `packages/scripting-lua/docs/V2_API_REFERENCE.md` (nuevo)
- `packages/scripting-lua/docs/PROPERTY_TYPES.md` (nuevo)
- `packages/scripting-lua/docs/ENTITY_REFS.md` (nuevo)
- `packages/scripting-lua/docs/SCRIPT_REFS.md` (nuevo)

**contenido**:
- [ ] Documentar todos los tipos de properties (entityRef, entityRefArray, scriptRef, prefabRef)
- [ ] Documentar EntityProxyV2 API
- [ ] Documentar ScriptProxyV2 API
- [ ] Documentar ScriptInstanceV2 self methods
- [ ] Documentar permission system y restricciones

#### 10.2 Migration Guide

**Archivos**:
- `packages/scripting-lua/docs/V1_TO_V2_MIGRATION.md` (nuevo)

**Contenido**:
- [ ] Tabla de cambios v1 → v2
  - `self.scripts[Script.X]` → `self.scriptRefs.x` (requiere schema declaration)
  - `Scene.getEntity(id)` → `self.entityRefs.x` (requiere schema declaration)
  - `Transform.getPosition()` → `self:getPosition()`
- [ ] Ejemplos de migración de scripts comunes
- [ ] Breaking changes y cómo resolverlos
- [ ] Best practices para scripts v2

**Estimado**: 4-5 horas

---

## Plan de Ejecución

### Orden de Implementación (Secuencial)

```
Fase 0: Limpieza (30 min)
    ↓
Fase 1: Property Types (3-4h)
    ↓
Fase 2: Permission System (4-5h)
    ↓
Fase 3: Entity Proxy (3-4h)
    ↓
Fase 6: Self Methods (3-4h)  ← Paralelo con Fase 4/5
    ↓
Fase 4: Script Proxy (4-5h)
    ↓
Fase 5: Bridge Enhancements (5-6h)
    ↓
Fase 7: Math Utilities (2-3h)
    ↓
Fase 8.1: Rewrite move_to_point (2-3h)
    ↓
Fase 8.2: Rewrite waypoint_path (3-4h)
    ↓
Fase 9: Integration & Testing (6-8h)
    ↓
Fase 10: Documentation (4-5h)
```

### Total Estimado: **45-58 horas** (6-7 días de trabajo a tiempo completo)

---

## Milestones Clave

### **Milestone 1: Property System Complete** ✅
- Fase 1, 2, 3 completas
- Property types definidos (TypeScript + Lua)
- Permission system implementado
- Entity proxy funcionando
- **Criterio de éxito**: Puede crear script con entityRef property y acceder vía `self.entityRefs.x`

### **Milestone 2: Cross-Script Communication** ✅
- Fase 4, 6 completas
- Script proxy funcionando
- Self methods implementados
- **Criterio de éxito**: waypoint_path puede comunicarse con move_to_point vía scriptRefs

### **Milestone 3: Bridges Refactored** ✅
- Fase 5 completa
- Scene bridge limpio (sin getEntity global)
- Prefab instantiation con validation
- **Criterio de éxito**: Scene.instantiate solo acepta prefabRefs declarados

### **Milestone 4: Scripts v2 Functional** ✅
- Fase 7, 8 completas
- move_to_point y waypoint_path funcionando en v2
- Math utilities completas
- **Criterio de éxito**: Scene de test con waypoint path ejecutándose correctamente

### **Milestone 5: Production Ready** ✅
- Fase 9, 10 completas
- Tests passing
- Documentación completa
- **Criterio de éxito**: Sistema listo para uso en producción

---

## Decisiones de Diseño Pendientes

### 1. Entity Proxy Write Access
**Pregunta**: ¿Deben los entity refs externos permitir `setPosition/setRotation/setScale`?

**Opciones**:
- **A**: Solo read-only (`getPosition`, `getRotation`, `getScale`)
- **B**: Full read-write (incluir `setPosition`, `setRotation`, `setScale`)

**Recomendación**: Opción A (read-only). Scripts externos no deberían mutar transforms de otras entidades directamente. Si se necesita control, usar eventos o comunicación via script refs.

### 2. Raycast Hit Permissions
**Pregunta**: ¿Deben los raycast hits retornar entity proxies para cualquier entity?

**Opciones**:
- **A**: Solo retornar hits de entities en allowedEntityIds
- **B**: Retornar hits de cualquier entity, pero proxy es read-only limitado

**Recomendación**: Opción B. Raycast es descubrimiento físico válido. Entity proxy de hit solo expone transform (read-only), sin component access.

### 3. Prefab Instantiation Return Type
**Pregunta**: ¿Qué retorna `Scene.instantiate()`?

**Opciones**:
- **A**: `EntityProxyV2` con permisos temporales (solo durante frame actual)
- **B**: `EntityProxyV2` agregado permanentemente a allowedEntityIds del script
- **C**: `string` (entity ID), sin proxy

**Recomendación**: Opción B. Script que spawneó entity debería poder controlarlo. Agregar entity ID spawneado a allowedEntityIds del script.

### 4. Component Access
**Pregunta**: ¿Cómo acceder a componentes custom en entities referenciadas?

**Opciones**:
- **A**: No permitir acceso a componentes custom (solo transform via proxy)
- **B**: Permitir acceso declarando component types en schema:
  ```lua
  target = { 
      type = "entityRef", 
      componentAccess = { "Health", "Inventory" }
  }
  ```
- **C**: Permitir acceso completo a componentes via `entity:getComponent(type)`

**Recomendación**: Opción A para v2 inicial. Mantener simple. Si se necesita data sharing, usar eventos o properties del script.

---

## Próximos Pasos Inmediatos

1. **Decisión de diseño**: Revisar y aprobar decisiones pendientes arriba
2. **Kick-off Fase 0**: Limpieza (30 min)
   - Eliminar `/mock` folder
   - Eliminar scripts built-in actuales
3. **Kick-off Fase 1**: Property Types (3-4h)
   - Crear `propertyTypes.ts`
   - Definir TypeScript types
   - Actualizar Lua type definitions

---

## Notas Finales

Este plan establece un sistema de scripting v2 robusto, modular y basado en permisos explícitos. Prioriza:

- **Seguridad**: Scripts no pueden acceder a data no declarada
- **Modularidad**: Scripts son componentes reutilizables con interfaces claras
- **Explicitez**: Todas las dependencias declaradas en schema
- **Mantenibilidad**: Easier to reason about script behavior y debugging

El sistema es más restrictivo que v1, pero permite patrones igual de poderosos (como waypoint_path + move_to_point) de forma más estructurada y segura.
