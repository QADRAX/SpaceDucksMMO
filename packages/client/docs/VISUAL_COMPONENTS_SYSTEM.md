# Sistema de Componentes Visuales

## Filosofía del Sistema

El sistema de componentes visuales está diseñado para ser **completamente modular y adaptativo**. Cada aspecto visual de un objeto 3D se define mediante componentes independientes que se pueden añadir, quitar o reemplazar en runtime.

## Conceptos Clave

### 1. VisualBody - El Contenedor

`VisualBody` es un **contenedor puro** que NO asume nada sobre qué está renderizando:
- No sabe si es una esfera, cubo o nave espacial
- No sabe qué color tiene
- No sabe qué efectos visuales tiene

Todo se delega a **componentes**.

### 2. Componentes - La Funcionalidad

Cada componente define UNA cosa específica:

#### Componentes Base (Obligatorios)
- **GeometryComponent**: Define la forma (esfera, cubo, cilindro)
- **MaterialComponent**: Define propiedades físicas (color, rugosidad, metalicidad)

#### Componentes de Efectos (Opcionales)
- **CoronaComponent**: Halo brillante alrededor del objeto
- **AtmosphereComponent**: Atmósfera semitransparente
- **AccretionDiskComponent**: Disco de acreción para agujeros negros
- **EventHorizonComponent**: Horizonte de eventos
- **GravitationalLensingComponent**: Efecto de lente gravitacional

#### Componentes de Comportamiento
- **RotationComponent**: Rotación automática
- **LightEmissionComponent**: Emisión de luz
- **TextureComponent**: Aplicación de texturas

## Sistema de Adaptación

### Problema: Tamaño vs Escala

Hay **DOS formas** de cambiar el tamaño de un objeto en Three.js:

1. **Transform.scale** - Escala el mesh completo (1.0 = tamaño normal)
2. **Geometría** - Recrea la geometría con nuevas dimensiones

### Solución Implementada

Para **objetos esféricos** (estrellas, planetas, agujeros negros):

✅ **Usar SOLO GeometryComponent.radius** para controlar el tamaño
❌ **NO usar Transform.scale** (está oculto en la UI)

**¿Por qué?**
- Los componentes adaptativos escuchan cambios en `GeometryComponent.radius`
- Si escalas con transform, los efectos visuales NO se adaptan
- Escalas no uniformes (1, 2, 1) no tienen sentido para esferas

### Sistema de Offsets (Altura desde la Superficie)

Los componentes decorativos usan **offsets** en lugar de multiplicadores:

#### Antes (Multiplicadores - ❌ Confuso)
```typescript
coronaRadius = 1.4  // ¿1.4x qué? ¿Del radio base?
diskInnerRadius = 1.2  // ¿1.2x el radio del agujero negro?
```

#### Ahora (Offsets - ✅ Claro)
```typescript
coronaHeight = 0.3  // 0.3 unidades SOBRE la superficie
diskInnerRadius = 0.2  // 0.2 unidades DESDE la superficie
diskOuterRadius = 2.5  // 2.5 unidades DESDE la superficie
```

**Ventajas:**
- Más intuitivo: "la corona está a 0.3 unidades de la superficie"
- Consistente: si cambias el radio base, los offsets se mantienen
- Predecible: corona siempre a la misma distancia relativa

## Ejemplo Práctico

### Crear una Estrella

```typescript
const star = new VisualBody('sun-1')
  // Base: Esfera de radio 1.2
  .addComponent(new GeometryComponent({ 
    type: 'sphere', 
    radius: 1.2 
  }))
  
  // Material base
  .addComponent(new MaterialComponent({ 
    color: 0xffffff 
  }))
  
  // Corona a 0.3 unidades de la superficie
  // Tamaño final: 1.2 + 0.3 = 1.5
  .addComponent(new CoronaComponent({ 
    color: 0xffdd44,
    radiusMultiplier: 0.3,  // Offset desde superficie
    intensity: 1.5 
  }));
```

### Cambiar el Tamaño

```typescript
// Cambiar radio de 1.2 a 2.0
// La corona se adapta automáticamente: 2.0 + 0.3 = 2.3
star.setProperty('geometry.radius', 2.0);
```

## Observer Pattern

### Cómo Funciona

1. **GeometryComponent** mantiene una lista de callbacks
2. Cuando el radio cambia, notifica a todos los suscritos
3. Los componentes adaptativos (Corona, AccretionDisk, etc.) se recrean

```typescript
// En GeometryComponent
private notifyGeometryChanged(): void {
  const radius = this.config.radius;
  this.onGeometryChangedCallbacks.forEach(callback => callback(radius));
}

// En CoronaComponent (initialize)
const geometryComp = visualBody.getComponent(GeometryComponent);
if (geometryComp) {
  geometryComp.onGeometryChanged(this.handleGeometryChange);
}

// Handler
private handleGeometryChange = (newRadius: number): void => {
  if (this.disposed) return;
  this.parentRadius = newRadius;
  // Recrear corona con nuevo tamaño
  this.dispose(this.scene);
  this.createCorona(this.scene);
};
```

## Ciclo de Vida de Componentes

### 1. Creación
```typescript
const component = new CoronaComponent({ ... });
visualBody.addComponent(component);
```

### 2. Inicialización
```typescript
// Llamado automáticamente cuando se añade a la escena
component.initialize(scene, parentMesh, visualBody);
// - Suscribirse a cambios de geometría
// - Crear meshes
// - Añadir a escena
```

### 3. Actualización
```typescript
// Llamado cada frame
component.update(deltaTime);
// - Animaciones
// - Sincronización con parent
```

### 4. Dispose
```typescript
// Llamado al remover de escena
component.dispose(scene);
// - Limpiar geometrías
// - Limpiar materiales
// - Remover de escena
// - NO limpiar el componente del array (se reutiliza)
```

### 5. Re-inicialización
Cuando cambias de escena y vuelves:
```typescript
// addTo() vuelve a llamar initialize() en todos los componentes
// IMPORTANTE: disposed flag se resetea a false
```

## Problemas Comunes

### ❌ Los componentes no se adaptan al cambiar el radio
**Causa:** El flag `disposed` permanecía en `true`
**Solución:** Resetear `disposed = false` en `initialize()`

### ❌ Los componentes no se adaptan al cambiar la escala
**Causa:** Los componentes solo escuchan `GeometryComponent.radius`
**Solución:** No uses escala, usa `radius` en GeometryComponent

### ❌ La corona es 10 veces más grande de lo esperado
**Causa:** Usaste multiplicador en lugar de offset
**Solución:** Usa valores como 0.3 (offset) en lugar de 1.3 (multiplicador)

## Mejores Prácticas

### ✅ Siempre usa GeometryComponent.radius para tamaño
```typescript
// Bien
star.setProperty('geometry.radius', 2.0);

// Mal (no adaptará componentes)
star.getTransform().scale.set(2, 2, 2);
```

### ✅ Usa offsets razonables para efectos
```typescript
// Corona: 0.1 - 1.0 unidades típicamente
coronaHeight: 0.3

// Disco de acreción: 0.2 - 5.0 unidades típicamente
diskInnerRadius: 0.2
diskOuterRadius: 2.5
```

### ✅ Resetea disposed en initialize
```typescript
initialize(scene, parentMesh, visualBody) {
  this.disposed = false;  // ¡Importante!
  // ... resto de la inicialización
}
```

## Extensibilidad

### Crear un Nuevo Componente Adaptativo

```typescript
export class MyEffectComponent implements IInspectableComponent {
  private disposed: boolean = false;
  private parentRadius: number = 1.0;
  
  initialize(scene, parentMesh, visualBody) {
    this.disposed = false;  // Resetear flag
    
    // Obtener radio actual
    const geometry = parentMesh.geometry as THREE.SphereGeometry;
    this.parentRadius = geometry.parameters?.radius ?? 1.0;
    
    // Suscribirse a cambios
    if (visualBody?.getComponent) {
      const geometryComp = visualBody.getComponent(GeometryComponent);
      if (geometryComp) {
        geometryComp.onGeometryChanged(this.handleGeometryChange);
      }
    }
    
    this.createEffect(scene);
  }
  
  private handleGeometryChange = (newRadius: number): void => {
    if (this.disposed) return;  // Protección
    
    this.parentRadius = newRadius;
    if (this.scene) {
      this.dispose(this.scene);
      this.createEffect(this.scene);
    }
  };
  
  private createEffect(scene) {
    // Usar parentRadius + config como offset
    const effectRadius = this.parentRadius + this.config.offset;
    // ... crear efecto
  }
  
  dispose(scene) {
    this.disposed = true;  // Marcar como disposed
    // ... limpiar recursos
  }
}
```

## Resumen

El sistema de componentes visuales permite:
- ✅ **Modularidad**: Añade/quita efectos dinámicamente
- ✅ **Adaptabilidad**: Los efectos se adaptan al tamaño base
- ✅ **Claridad**: Offsets en lugar de multiplicadores
- ✅ **Consistencia**: Un solo mecanismo para cambiar tamaño (radius)
- ✅ **Reutilización**: Los componentes persisten entre cambios de escena

**Regla de Oro**: Para objetos esféricos, SOLO usa `GeometryComponent.radius` para controlar el tamaño. La escala está deshabilitada intencionalmente.
