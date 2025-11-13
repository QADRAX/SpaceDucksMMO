# Celestial Body System

Sistema componentizado y genérico para crear cuerpos celestes (estrellas, planetas, lunas) con una arquitectura limpia y modular.

## 🏗️ Arquitectura

### Principios de Diseño

- **Composición sobre Herencia**: Los efectos se añaden como componentes modulares
- **Separación de Responsabilidades**: Cada componente maneja una funcionalidad específica
- **Reutilización**: Los mismos componentes se pueden combinar de diferentes formas
- **Clean Code**: Código organizado en carpetas lógicas

### Estructura de Carpetas

```
celestial/
├── CelestialBody.ts              # Clase base que compone componentes
├── components/                    # Componentes modulares
│   ├── ICelestialComponent.ts    # Interface base
│   ├── TextureComponent.ts       # Carga de texturas con fallback
│   ├── TintComponent.ts          # Coloración/tinte
│   ├── AtmosphereComponent.ts    # Atmósfera con shader Fresnel
│   ├── CoronaComponent.ts        # Corona/glow para estrellas
│   ├── LightEmissionComponent.ts # PointLight para iluminación
│   ├── RotationComponent.ts      # Rotación continua
│   └── index.ts
├── builders/                      # Factories para tipos comunes
│   ├── StarBuilder.ts            # Constructor de estrellas
│   ├── PlanetBuilder.ts          # Constructor de planetas
│   └── index.ts
└── index.ts                       # Exports públicos
```

## 📦 Componentes Disponibles

### TextureComponent
Carga texturas con fallback de calidad automático (8k → 4k → 2k).

```ts
new TextureComponent(textureResolver, {
  textureId: 'sun',
  textureType: 'diffuse',
  applyAsEmissive: true  // Para estrellas
})
```

### TintComponent
Aplica coloración a la textura.

```ts
new TintComponent({
  tintColor: 0xff6644,  // Naranja rojizo
  intensity: 0.3        // 30% de intensidad
})
```

### AtmosphereComponent
Añade atmósfera con efecto Fresnel.

```ts
new AtmosphereComponent({
  color: 0x88ccff,      // Azul claro
  thickness: 1.05,      // 5% más grande que el planeta
  intensity: 2.0        // Intensidad del glow
})
```

### CoronaComponent
Corona/glow para estrellas con pulsación opcional.

```ts
new CoronaComponent({
  color: 0xffdd44,
  radiusMultiplier: 1.4,
  intensity: 1.5,
  enablePulse: true,
  pulseSpeed: 1.0
})
```

### LightEmissionComponent
PointLight para que el cuerpo emita luz.

```ts
new LightEmissionComponent({
  color: 0xffaa44,
  intensity: 6.0,
  range: 15,
  castShadow: true
})
```

### RotationComponent
Rotación continua del cuerpo.

```ts
new RotationComponent({
  speed: 0.1  // radianes por segundo
})
```

## 🚀 Uso

### Opción 1: Builders (Recomendado)

Para tipos comunes (estrellas, planetas), usa los builders:

```ts
import { StarBuilder, PlanetBuilder } from '@client/infrastructure/scene-objects/celestial';

// Crear un sol
const sun = StarBuilder.create('sun', textureResolver, {
  radius: 1.2,
  coronaColor: 0xffdd44,
  lightIntensity: 6.0,
  rotationSpeed: 0.1
});

// Crear un planeta rocoso tipo Marte
const mars = PlanetBuilder.create('mars', textureResolver, {
  radius: 0.5,
  tintColor: 0xff6644,
  tintIntensity: 0.3,
  hasAtmosphere: true,
  atmosphereColor: 0xffaa88,
  rotationSpeed: 0.05
});

// Añadir a la escena
this.addObject(engine, sun);
this.addObject(engine, mars);
```

### Opción 2: Composición Manual

Para cuerpos celestes personalizados, compone los componentes manualmente:

```ts
import { CelestialBody } from '@client/infrastructure/scene-objects/celestial';
import {
  TextureComponent,
  TintComponent,
  CoronaComponent,
  LightEmissionComponent,
  RotationComponent
} from '@client/infrastructure/scene-objects/celestial/components';

// Crear base
const customStar = new CelestialBody('red-giant', {
  radius: 2.5,
  emissive: 0xff0000,
  emissiveIntensity: 3.0
});

// Añadir componentes según necesites
customStar
  .addComponent(new TextureComponent(textureResolver, {
    textureId: 'sun',
    applyAsEmissive: true
  }))
  .addComponent(new TintComponent({
    tintColor: 0xff0000,
    intensity: 0.8
  }))
  .addComponent(new CoronaComponent({
    color: 0xff4400,
    radiusMultiplier: 2.0,
    intensity: 3.0,
    enablePulse: true
  }))
  .addComponent(new LightEmissionComponent({
    color: 0xff2200,
    intensity: 10.0,
    range: 25
  }))
  .addComponent(new RotationComponent({
    speed: 0.05
  }));

this.addObject(engine, customStar);
```

## 🎨 Ejemplos de Configuración

### Estrella Amarilla (Sol)

```ts
const sun = StarBuilder.create('sun', textureResolver, {
  radius: 1.2,
  coronaColor: 0xffdd44,
  coronaIntensity: 1.5,
  lightIntensity: 6.0,
  lightColor: 0xffaa44
});
```

### Estrella Roja

```ts
const redStar = StarBuilder.create('red-star', textureResolver, {
  radius: 1.5,
  textureId: 'sun',
  coronaColor: 0xff4422,
  lightColor: 0xff3311,
  lightIntensity: 4.0,
  emissiveColor: 0xff2200
});
```

### Planeta Rocoso con Atmósfera (Tierra)

```ts
const earth = PlanetBuilder.create('earth', textureResolver, {
  radius: 1.0,
  textureId: 'rocky-planet',
  tintColor: 0x4488cc,
  tintIntensity: 0.4,
  hasAtmosphere: true,
  atmosphereColor: 0x88ccff,
  atmosphereThickness: 1.08,
  atmosphereIntensity: 2.5
});
```

### Planeta Desértico (Marte)

```ts
const mars = PlanetBuilder.create('mars', textureResolver, {
  radius: 0.5,
  tintColor: 0xff6644,
  tintIntensity: 0.3,
  hasAtmosphere: true,
  atmosphereColor: 0xffaa88,
  atmosphereThickness: 1.03,
  atmosphereIntensity: 1.2,
  roughness: 0.95
});
```

### Planeta sin Atmósfera (Mercurio)

```ts
const mercury = PlanetBuilder.create('mercury', textureResolver, {
  radius: 0.38,
  tintColor: 0x999999,
  tintIntensity: 0.2,
  hasAtmosphere: false,
  roughness: 0.98,
  rotationSpeed: 0.02
});
```

## 🔧 API Avanzada

### Acceder a Componentes

```ts
// Obtener un componente específico
const tintComp = planet.getComponent(TintComponent);
if (tintComp) {
  tintComp.setTint(0xff0000, 0.5);
}

const lightComp = star.getComponent(LightEmissionComponent);
if (lightComp) {
  lightComp.setIntensity(8.0);
}
```

### Posicionamiento

```ts
// Posicionar en el espacio
sun.setPosition(0, 0, 0);
mars.setPosition(3, 0, 0);
```

### Recarga de Texturas

```ts
// El sistema automáticamente recarga texturas cuando cambia la calidad
// Si usas BaseScene, esto se maneja automáticamente
await planet.reloadTexture();
```

## 🎯 Ventajas del Sistema

1. **Modular**: Cada efecto es un componente independiente
2. **Reutilizable**: Los mismos componentes funcionan para cualquier cuerpo celeste
3. **Extensible**: Fácil añadir nuevos componentes sin modificar código existente
4. **Mantenible**: Código organizado en archivos pequeños y enfocados
5. **Flexible**: Combina componentes de cualquier forma para crear efectos únicos
6. **Tipado**: Full TypeScript con interfaces claras
7. **Performante**: Componentes opcionales, solo pagas por lo que usas

## 🔄 Migración desde Sistema Antiguo

Si usabas `RockyTexturedPlanet` o `TexturedSunStar`:

```ts
// Antes
const planet = new RockyTexturedPlanet('rocky-1', textureResolver, {
  radius: 0.5,
  tint: 0xff6644,
  tintIntensity: 0.3,
  hasAtmosphere: true
});

// Ahora (equivalente con builders)
const planet = PlanetBuilder.create('rocky-1', textureResolver, {
  radius: 0.5,
  tintColor: 0xff6644,
  tintIntensity: 0.3,
  hasAtmosphere: true
});
```

## 📝 Crear Nuevos Componentes

Para añadir nuevos efectos, implementa `ICelestialComponent`:

```ts
import type { ICelestialComponent } from './ICelestialComponent';
import * as THREE from 'three';

export class MyCustomComponent implements ICelestialComponent {
  initialize(scene: THREE.Scene, parentMesh: THREE.Mesh): void {
    // Setup: crear meshes, luces, etc.
  }

  update(deltaTime: number): void {
    // Lógica cada frame
  }

  dispose(scene: THREE.Scene): void {
    // Limpiar recursos
  }
}
```

Luego úsalo:

```ts
celestialBody.addComponent(new MyCustomComponent());
```
