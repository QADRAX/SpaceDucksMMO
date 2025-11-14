# Visual Components System

Sistema genérico de renderizado 3D usando composición sobre herencia.

## 🏗️ Arquitectura

### Principios de Diseño

- **Composición sobre Herencia**: Los efectos se añaden como componentes modulares
- **Infraestructura Genérica**: VisualBody puede renderizar cualquier objeto 3D
- **Separación de Responsabilidades**: Cada componente maneja una funcionalidad específica
- **Reutilización**: Los mismos componentes se pueden combinar de diferentes formas
- **Clean Code**: Código organizado en carpetas lógicas

### Filosofía

- **VisualBody** = Infraestructura (contenedor genérico 3D, no sabe qué renderiza)
- **Componentes** = Definen QUÉ renderizar (geometría, materiales, efectos)
- **Builders** = Capa de dominio (definen CUÁLES componentes usar para tipos específicos)

### Estructura de Carpetas

```
visual-components/
├── VisualBody.ts                 # Contenedor genérico de objetos 3D
├── Skybox.ts                     # Implementación de skybox
├── components/                    # Componentes modulares
│   ├── IVisualComponent.ts       # Interface base
│   ├── GeometryComponent.ts      # Gestión de geometría (esfera, caja, etc.)
│   ├── MaterialComponent.ts      # Propiedades de material PBR
│   ├── EmissiveComponent.ts      # Efectos emisivos/glow
│   ├── TextureComponent.ts       # Carga de texturas con fallback
│   ├── TintComponent.ts          # Coloración/tinte
│   ├── BrightnessComponent.ts    # Ajuste de brillo
│   ├── AtmosphereComponent.ts    # Atmósfera con shader Fresnel
│   ├── CoronaComponent.ts        # Corona/glow para estrellas
│   ├── LightEmissionComponent.ts # PointLight para iluminación
│   ├── RotationComponent.ts      # Rotación continua
│   ├── AccretionDiskComponent.ts # Disco de acreción (agujeros negros)
│   ├── EventHorizonComponent.ts  # Horizonte de eventos (agujeros negros)
│   ├── JetStreamComponent.ts     # Jets relativistas (agujeros negros)
│   └── index.ts
├── builders/                      # Factories para tipos comunes
│   ├── StarBuilder.ts            # Constructor de estrellas
│   ├── PlanetBuilder.ts          # Constructor de planetas
│   ├── BlackHoleBuilder.ts       # Constructor de agujeros negros
│   ├── SkyboxBuilder.ts          # Constructor de skybox
│   └── index.ts
└── index.ts                       # Exports públicos
```

## 🌌 ComponentSkybox

Skybox basado en el sistema de componentes, comparte los mismos componentes modulares que los cuerpos celestes.

### Uso con Builder (Recomendado)

```ts
import { SkyboxBuilder } from '@client/infrastructure/scene-objects/visual-components';

// Opción 1: Milky Way preset (común para menús)
const skybox = SkyboxBuilder.createMilkyWay('menu-skybox', textureResolver);

// Opción 2: Milky Way con configuración custom
const skybox = SkyboxBuilder.createMilkyWay('menu-skybox', textureResolver, {
  brightness: 2.0,
  rotationSpeed: 0.00005
});

// Opción 3: Starfield básico
const skybox = SkyboxBuilder.createStarfield('game-skybox', textureResolver);

// Opción 4: Estático (sin rotación)
const skybox = SkyboxBuilder.createStatic('static-skybox', textureResolver, {
  texture: 'stars_milky_way',
  brightness: 1.5
});

// Opción 5: Configuración completa manual
const skybox = SkyboxBuilder.create('custom-skybox', textureResolver, {
  texture: 'stars_milky_way',
  radius: 1000,
  rotationSpeed: 0.00002,
  brightness: 1.5,
  tint: 0xff8844,
  tintIntensity: 0.3
});

this.addObject(engine, skybox);
```

### Uso Directo (Avanzado)

```ts
import { ComponentSkybox } from '@client/infrastructure/scene-objects/visual-components';

const skybox = new ComponentSkybox('menu-skybox', textureResolver, {
  texture: 'stars_milky_way',  // 'stars' o 'stars_milky_way'
  radius: 1000,                 // Radio grande para envolver la escena
  rotationSpeed: 0.00002,       // Rotación muy lenta
  brightness: 1.5,              // Brillo aumentado
  tint: 0xffffff,               // Sin tinte (blanco puro)
  segments: 64,                 // Calidad de la geometría
  depthWrite: false             // No escribir en depth buffer
});

this.addObject(engine, skybox);
```

### Componentes Utilizados

- **TextureComponent**: Carga la textura del skybox con fallback de calidad
- **BrightnessComponent**: Ajusta el brillo global del skybox
- **TintComponent**: Aplica coloración si tintIntensity > 0
- **RotationComponent**: Rotación continua del skybox

### Métodos Runtime

```ts
// Cambiar textura en runtime
await skybox.setTexture('stars');

// Ajustar rotación
skybox.setRotationSpeed(0.00005);

// Ajustar brillo
skybox.setBrightness(2.0);

// Aplicar tinte
skybox.setTint(0xff8844, 0.3);
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

### BrightnessComponent
Ajusta el brillo del material.

```ts
new BrightnessComponent({
  brightness: 1.5  // 150% de brillo (1.0 = normal)
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
import { StarBuilder, PlanetBuilder } from '@client/infrastructure/scene-objects/visual-components';

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

Para objetos personalizados, compone los componentes manualmente:

```ts
import { VisualBody } from '@client/infrastructure/scene-objects/visual-components';\nimport {\n  GeometryComponent,\n  MaterialComponent,\n  EmissiveComponent,\n  TextureComponent,\n  TintComponent,\n  CoronaComponent,\n  LightEmissionComponent,\n  RotationComponent\n} from '@client/infrastructure/scene-objects/visual-components/components';\n\n// Crear contenedor\nconst customStar = new VisualBody('red-giant');\n\n// Añadir componentes base\ncustomStar.addComponent(\n  new GeometryComponent({\n    type: 'sphere',\n    radius: 2.5,\n    segments: 128\n  })\n);\n\ncustomStar.addComponent(\n  new MaterialComponent({\n    color: 0xffffff,\n    roughness: 1.0,\n    metalness: 0.0\n  })\n);\n\ncustomStar.addComponent(\n  new EmissiveComponent({\n    color: 0xff0000,\n    intensity: 3.0\n  })\n);\n\n// Añadir componentes visuales según necesites\ncustomStar\n  .addComponent(new TextureComponent(textureResolver, {\n    textureId: 'sun',\n    applyAsEmissive: true\n  }))\n  .addComponent(new TintComponent({\n    tintColor: 0xff0000,
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

Para añadir nuevos efectos, implementa `IVisualComponent`:

```ts
import type { IVisualComponent } from './IVisualComponent';\nimport * as THREE from 'three';\n\nexport class MyCustomComponent implements IVisualComponent {
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
visualBody.addComponent(new MyCustomComponent());
```

## ⚫ Agujeros Negros (Black Holes)

Sistema completo para crear agujeros negros con efectos visuales avanzados:

### Componentes Especializados

#### AccretionDiskComponent
Disco de acreción rotatorio con gradiente de color del borde interno caliente al externo frío.

```ts
import { AccretionDiskComponent } from './components';

visualBody.addComponent(new AccretionDiskComponent({
  innerRadius: 1.2,
  outerRadius: 3.5,
  innerColor: 0xffaa00,    // Caliente (naranja)
  outerColor: 0x4488ff,    // Frío (azul)
  rotationSpeed: 0.5,
  segments: 128,
  opacity: 0.8,
  emissiveIntensity: 2.5
}));
```

**Características:**
- Geometría de anillo (RingGeometry)
- Shader personalizado con gradiente radial
- Rotación animada
- Blending aditivo para efecto de brillo
- Semi-transparente con propiedades emisivas

#### EventHorizonComponent
Horizonte de eventos con distorsión espacial y efecto de borde (Fresnel).

```ts
import { EventHorizonComponent } from './components';

visualBody.addComponent(new EventHorizonComponent({
  radiusMultiplier: 1.3,
  color: 0x000000,
  distortionStrength: 0.1,
  pulseSpeed: 0.5,
  enablePulse: true
}));
```

**Características:**
- Esfera oscura con brillo en los bordes (efecto Fresnel)
- Distorsión de vértices con ruido
- Pulsación opcional
- Renderizado desde el interior (BackSide)

#### JetStreamComponent
Jets relativistas de partículas desde los polos.

```ts
import { JetStreamComponent } from './components';

visualBody.addComponent(new JetStreamComponent({
  length: 5.0,
  radius: 0.3,
  color: 0x88ccff,
  intensity: 1.5,
  particleCount: 200,
  speed: 2.0
}));
```

**Características:**
- Sistema de partículas (Points)
- Jets desde ambos polos (arriba/abajo)
- Animación de flujo de partículas
- Blending aditivo para apariencia energética
- Reciclado de partículas para rendimiento

### BlackHoleBuilder

Builder con presets predefinidos para crear agujeros negros rápidamente:

#### Preset: Standard
```ts
import { BlackHoleBuilder } from './builders';

const blackHole = BlackHoleBuilder.create('bh-1', textureResolver, {
  radius: 0.8,
  diskInnerColor: 0xffaa00,
  diskOuterColor: 0x4488ff,
  enableJets: true
});
```

#### Preset: Supermassive
Agujero negro supermasivo con disco de acreción grande e intenso.

```ts
const blackHole = BlackHoleBuilder.createSupermassive('bh-super', textureResolver);
```

**Características:**
- Radio: 1.5
- Disco: 2.0 → 6.0
- Colores: Rojo intenso → Azul
- Jets largos (8.0) y rápidos
- 300 partículas en jets

#### Preset: Stellar
Agujero negro de masa estelar, más pequeño y tranquilo.

```ts
const blackHole = BlackHoleBuilder.createStellar('bh-stellar', textureResolver);
```

**Características:**
- Radio: 0.5
- Disco: 0.8 → 2.0
- Sin jets
- Rotación más rápida

#### Preset: Quasar
Núcleo galáctico activo extremadamente brillante y activo.

```ts
const blackHole = BlackHoleBuilder.createQuasar('quasar-1', textureResolver);
```

**Características:**
- Disco muy brillante (blanco → azul)
- Jets extremadamente largos (10.0)
- 400 partículas en jets
- Jets muy rápidos (speed: 4.0)
- Rotación rápida del disco

### Uso en ObjectFactory

Los agujeros negros están integrados en el factory:

```ts
// Desde el UI o código
const blackHole = objectFactory.createBlackHole({
  preset: 'supermassive',
  position: [0, 0, 0]
});

// Custom
const blackHole = objectFactory.createBlackHole({
  radius: 1.0,
  diskInnerColor: 0xff0000,
  diskOuterColor: 0x0000ff,
  enableJets: false
});
```

### Propiedades Inspeccionables

Todos los agujeros negros son editables en el Object Inspector:

**Accretion Disk:**
- `disk.innerColor` - Color del borde interno caliente
- `disk.outerColor` - Color del borde externo frío
- `disk.rotationSpeed` - Velocidad de rotación (0-2)
- `disk.opacity` - Transparencia (0-1)

**Event Horizon:**
- `horizon.color` - Color del horizonte de eventos
- `horizon.distortion` - Intensidad de distorsión (0-0.5)
- `horizon.pulseSpeed` - Velocidad de pulsación (0-2)

**Jet Streams:**
- `jet.color` - Color de los jets
- `jet.speed` - Velocidad del flujo de partículas (0-5)

### Tipos de Agujero Negro Disponibles

En el Scene Hierarchy se pueden crear:

- **Black Hole** - Configuración estándar balanceada
- **Black Hole (Supermassive)** - Gigante con disco intenso
- **Black Hole (Stellar)** - Pequeño sin jets
- **Quasar** - Núcleo galáctico activo extremo

### Patrón de Sincronización de Posición

Todos los componentes de agujero negro siguen el patrón de sincronización de posición:

```ts
export class AccretionDiskComponent implements IVisualComponent {
  private parentMesh?: THREE.Mesh;

  initialize(scene: THREE.Scene, parentMesh: THREE.Mesh): void {
    this.parentMesh = parentMesh;
    // ... crear meshes
  }

  update(deltaTime: number): void {
    // Sincronizar posición con el objeto padre cada frame
    if (this.parentMesh) {
      this.diskMesh.position.copy(this.parentMesh.position);
    }
    // ... resto de lógica de animación
  }
}
```

Este patrón asegura que todos los efectos visuales sigan al objeto cuando se mueve su transform en el inspector.

