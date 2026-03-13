# Asset Loaders - Pattern & Design

## Visión General

El sistema de loaders en `rendering-base` utiliza un **patrón de clase abstracta** que define un contrato claro para cargar cualquier tipo de asset (geometría, texturas, modelos, etc).

## Arquitectura

### BaseAssetLoader (Clase Abstracta Base)

La clase abstracta `BaseAssetLoader<T>` define el contrato que todos los loaders deben cumplir:

```typescript
export abstract class BaseAssetLoader<T = unknown> {
  // Tipo único identificador
  abstract readonly type: string;

  // Método principal: cargar un asset
  abstract load(source: string | ArrayBuffer, options?: Record<string, unknown>): Promise<T>;

  // Validación: puede este loader manejar la fuente?
  canHandle(source: string | ArrayBuffer): boolean;

  // Caché integrada
  protected cache = new Map<string, T>();
  protected getCached(key: string): T | undefined;
  protected setCached(key: string, asset: T): void;

  // Lifecycle
  clearCache(): void;
  dispose(): void;
}
```

### Loaders Concretos Abstract

Los loaders específicos del dominio extienden `BaseAssetLoader`:

```
BaseAssetLoader<T>
├── CustomGeometryLoader extends BaseAssetLoader<unknown>
├── FullGltfLoader extends BaseAssetLoader<unknown>
└── [future loaders]
```

**Nota**: Estos también son **abstract** porque su implementación específica del renderer pertenece a:
- `rendering-webgpu`: `ThreeCustomGeometryLoader extends CustomGeometryLoader`
- `rendering-webgl`: `GLCustomGeometryLoader extends CustomGeometryLoader`

## Nivel de Abstracción

```
rendering-base:      ← Abstracciones (implementaciones abstract - sin dependencias de framework)
├── BaseAssetLoader           [clase abstracta genérica]
├── CustomGeometryLoader      [clase abstracta específica del dominio]
└── FullGltfLoader            [clase abstracta específica del dominio]

rendering-webgpu:    ← Implementaciones Concretas (dependen de THREE.js)
├── ThreeCustomGeometryLoader extends CustomGeometryLoader
└── ThreeFullGltfLoader extends FullGltfLoader

rendering-webgl:     ← Implementaciones Concretas (dependen de WebGL)
├── GLCustomGeometryLoader extends CustomGeometryLoader
└── GLFullGltfLoader extends FullGltfLoader
```

## Ejemplo: Crear un Loader WebGPU

### 1. En rendering-webgpu: CustomGeometryLoader Implementation

```typescript
// rendering-webgpu/src/infrastructure/graphics/loaders/ThreeCustomGeometryLoader.ts
import { CustomGeometryLoader } from '@duckengine/rendering-base';
import * as THREE from 'three/webgpu';

export class ThreeCustomGeometryLoader extends CustomGeometryLoader {
  readonly type = 'custom-geometry';

  async load(
    source: string | ArrayBuffer,
    options?: Record<string, unknown>
  ): Promise<THREE.BufferGeometry> {
    // Chequear caché
    const cacheKey = typeof source === 'string' ? source : 'buffer';
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    // Implementar carga específica de Three.js
    let geometry: THREE.BufferGeometry;
    
    if (typeof source === 'string') {
      // Cargar desde URL usando THREE.BufferGeometryLoader
      const loader = new THREE.BufferGeometryLoader();
      geometry = await loader.loadAsync(source);
    } else {
      // Parsear ArrayBuffer
      geometry = this.parseCustomFormat(source);
    }

    // Caché el resultado
    this.setCached(cacheKey, geometry);
    return geometry;
  }

  private parseCustomFormat(buffer: ArrayBuffer): THREE.BufferGeometry {
    // Implementación específica de parsing
    // ...
    const geometry = new THREE.BufferGeometry();
    // ... set vertices, indices, etc
    return geometry;
  }

  canHandle(source: string | ArrayBuffer): boolean {
    if (typeof source === 'string') {
      return source.endsWith('.geo') || source.endsWith('.geom');
    }
    return true;
  }
}
```

### 2. En rendering-webgpu: glTF Loader Implementation

```typescript
// rendering-webgpu/src/infrastructure/graphics/loaders/ThreeFullGltfLoader.ts
import { FullGltfLoader } from '@duckengine/rendering-base';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three/webgpu';

export class ThreeFullGltfLoader extends FullGltfLoader {
  private gltfLoader = new GLTFLoader();

  async load(
    url: string,
    options?: Record<string, unknown>
  ): Promise<THREE.Group> {
    // Chequear caché
    const cached = this.getCached(url);
    if (cached) return cached;

    // Usar GLTFLoader de three.js
    const gltf = await this.gltfLoader.loadAsync(url);
    const scene = gltf.scene;

    // Caché
    this.setCached(url, scene);
    return scene;
  }
}
```

## Patrón de Uso

### En RenderFeatures o Coordinadores

```typescript
import { FullGltfLoader } from '@duckengine/rendering-base';

class ModelFeature implements IRenderFeature {
  constructor(private gltfLoader: FullGltfLoader) {}

  async loadModel(entity: Entity, url: string) {
    // Usa el loader de forma agnóstica
    const model = await this.gltfLoader.load(url);
    // ... render
  }
}
```

### Inyección de Dependencia

```typescript
// En aplicación cliente
import { ThreeFullGltfLoader } from '@duckengine/rendering-webgpu';

const gltfLoader = new ThreeFullGltfLoader();
const feature = new ModelFeature(gltfLoader);
```

## Ventajas del Diseño

✅ **Separación de responsabilidades**
- Domain: define contrato (abstract classes)
- Infrastructure: implementa (concrete classes)

✅ **Type-Safe**
- Genéricos: `BaseAssetLoader<T>` permite tipos específicos
- Compiler checks en tiempo de compilación

✅ **Extensible**
- Agregar nuevo loader es crear una nueva clase abstracta
- Implementar es extender y proporcionar lógica específica

✅ **Testeable**
- Mock loaders fácilmente en tests
- Inyección de dependencias

✅ **Cacheable**
- Caché integrada en base
- Evita reloads innecesarios

## Futuros Loaders

El patrón soporta cualquier tipo de loader:

```typescript
// Export en rendering-base
export abstract class TextureLoader extends BaseAssetLoader<Texture>;
export abstract class AudioLoader extends BaseAssetLoader<AudioBuffer>;
export abstract class DataLoader extends BaseAssetLoader<DataBlock>;

// En rendering-webgpu
export class ThreeTextureLoader extends TextureLoader;
export class ThreeAudioLoader extends AudioLoader;
```

---

**Conclusión**: El sistema de loaders proporciona una forma clara, extensible y type-safe de cargar cualquier tipo de asset, manteniendo la arquitectura limpia y el código agnóstico del framework.
