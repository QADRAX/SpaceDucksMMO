# Rendering sync – análisis de performance

## Flujo por frame

1. **syncSceneToRenderTree**: por cada entidad en `scene.entities`, se llama a `syncEntity(entity, context)` de cada feature. Luego, por cada `entityId` en el registry que ya no está en la escena, se llama a `onDetachById`.
2. **Coste**: `N` entidades × `F` features = `N×F` llamadas a `syncEntity` por frame.

## Puntos críticos

### 1. Allocación por frame (syncSceneToRenderTree)

- Se crea un **nuevo `Set<string>()`** cada frame para `attachedIds`.
- **Mejora**: reutilizar un único Set: limpiarlo al inicio y volver a usarlo (o recibirlo por parámetro).

### 2. Rama “comp && had”: trabajo redundante cada frame

En la rama en la que la entidad **ya tenía** el componente y el objeto Three ya existía, hoy se hace **siempre**:

| Feature   | Qué hace en (comp && had)                         | Coste |
|----------|----------------------------------------------------|-------|
| Geometry | `geometry.dispose()` + nueva geometry + applyShadow + syncTransform | Alto (dispose + creación de BufferGeometry) |
| Light    | remove + dispose + **nueva luz** + add + syncTransform | Alto (nueva luz cada frame) |
| Material | registry.get + findMesh + **dispose material + nuevo material** | Alto |
| TextureTiling | registry.get + findMesh + applyTilingToMaterial | Bajo (solo asignar repeat/offset) |
| Camera   | applyPerspectiveCameraParams + syncTransform       | Bajo (asignar números) |

Solo deberíamos **recrear** geometry/luz/material cuando los datos del componente (o la mesh data en custom) **hayan cambiado**. Si no cambian, en (comp && had) basta con **actualizar transform** (y en camera, opcionalmente solo transform si los params no cambiaron).

**Mejora**: dirty checking por entidad:

- Guardar un “last synced key” (string o hash) por `entityId` para geometry, light y material.
- En (comp && had): calcular key actual del componente; si `key === lastKey`, solo `syncTransformToObject3D` (y en camera solo actualizar transform/params si cambian); si no, hacer el trabajo completo y actualizar `lastKey`.

Así se evita dispose + creación en cada frame cuando nada ha cambiado.

### 3. getComponent múltiples por feature

- **Geometry**: `getGeometryComponent` hace hasta 7 `getComponent` (uno por tipo de geometría) hasta encontrar. Entidades sin geometría pagan 7 lookups.
- **Material**: hasta 4 `getComponent` (tipos de material).
- **Light**: hasta 4 `getComponent` (tipos de luz).

Cada `getComponent` es un `entity.components.get(type)` (Map lookup). El coste es bajo pero multiplicado por N×F. Posible mejora a medio plazo: que el ECS exponga “conjunto de tipos presentes” en la entidad para un early-exit sin probar todos los tipos.

### 4. registry.get + findMesh en Material y TextureTiling

- Para cada entidad con material o textureTiling se hace `registry.get(entity.id)` y `findMesh(root)`.
- El registry devuelve un Group; `findMesh` recorre hijos (normalmente 1: el mesh). Coste bajo, pero se hace cada frame.
- Con dirty checking (solo aplicar material/tiling cuando el componente cambie), se reducirían estas pasadas.

### 5. Orden de features

- El orden actual (camera, light, geometry, material, textureTiling, skybox) es correcto: geometry crea el mesh, material/tiling lo modifican; el registry usa un Group por entidad y `add` añade hijos, así que el orden de registro es coherente.
- No hace falta cambiar el orden por performance.

## Mejorias aplicadas

1. **Set reutilizado** en `syncSceneToRenderTree`: un único `attachedIds` a nivel de módulo, `.clear()` al inicio de cada sync. Evita una alloc de Set por frame.
2. **Dirty checking** en Camera, Geometry, Light, Material y TextureTiling:
   - Se mantiene un “last key” por entidad (string que identifica el estado del componente).
   - **Camera**: key = fov, aspect, near, far; si no cambia, solo `syncTransformToObject3D` (se evita `applyPerspectiveCameraParams` cada frame).
   - En la rama (comp && had) / (params && had): si el key actual es igual al guardado, solo se actualiza transform (Geometry/Light/Camera) o no se hace nada (Material/Tiling); si cambia, se hace el trabajo completo y se actualiza el key.
   - Así se evita dispose + creación de geometry/luz/material, reaplicar tiling y actualizar params de cámara en cada frame cuando los datos no han cambiado.

## Mejoras opcionales (no implementadas)

- **Early-exit en getGeometryComponent / getMaterialComponent**: Hoy, para saber si una entidad tiene geometría llamamos a `getComponent(entity, t)` hasta 7 veces (una por tipo: box, sphere, plane, …) hasta encontrar una o quedarnos en undefined. Una entidad que **no** tiene geometría (p. ej. solo cámara) paga esas 7 lookups cada frame. Lo mismo con material (4 tipos). Si el ECS expusiera en la entidad “qué tipos de componente tiene” (p. ej. `entity.componentTypes` o un Set de tipos), podríamos comprobar antes “¿tiene algún tipo de geometría?” en O(1) y, si no, devolver undefined sin hacer el bucle de 7 (o 4) `getComponent`. Eso requeriría que el core-v2 mantenga ese índice al añadir/quitar componentes; por eso está como opcional.
