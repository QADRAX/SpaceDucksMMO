# Asset Loaders Refactoring - Summary

## ¿Qué Cambió?

### ❌ Antes (Confuso)

```typescript
// No era claro qué hacer con estos
export class CustomGeometryLoader {
  async load(source: string | ArrayBuffer): Promise<unknown> {
    throw new Error('not implemented');
  }
}

export class FullGltfLoader {
  async load(url: string): Promise<unknown> {
    throw new Error('not implemented');
  }
}

export function extractGltfAnimations(gltfObject: unknown): unknown[] {
  return [];  // ¿Qué retorna? ¿Cómo usarlo?
}
```

**Problemas:**
- ❓ No claro si son abstracciones o implementaciones
- ❓ Sin caché
- ❓ Sin validación
- ❓ Sin tipo genérico
- ❓ Sin patrón consistente

### ✅ Ahora (Claro y Extensible)

```typescript
// 1. Clase abstracta base con todas las herramientas necesarias
export abstract class BaseAssetLoader<T = unknown> {
  abstract readonly type: string;
  abstract load(source: string | ArrayBuffer, options?: Record<string, unknown>): Promise<T>;
  canHandle(source: string | ArrayBuffer): boolean;
  protected cache = new Map<string, T>();
  clearCache(): void;
  dispose(): void;
}

// 2. Loaders específicos del dominio que heredan contrato
export abstract class CustomGeometryLoader extends BaseAssetLoader<unknown> {
  readonly type = 'custom-geometry';
  abstract load(source: string | ArrayBuffer, options?: Record<string, unknown>): Promise<unknown>;
  canHandle(source: string | ArrayBuffer): boolean {
    // Validación específica de geometría
  }
}

export abstract class FullGltfLoader extends BaseAssetLoader<unknown> {
  readonly type = 'gltf';
  abstract load(url: string, options?: Record<string, unknown>): Promise<unknown>;
  canHandle(source: string | ArrayBuffer): boolean {
    // Validación de .gltf/.glb magic numbers
  }
}

// 3. Helpers mejorados con tipos explícitos
export function extractGltfAnimations(gltfObject: unknown): Array<{ name: string; duration: number }> {
  // Retorna estructura clara, maps correctamente
}
```

## Beneficios

### 1. **Claridad Arquitectónica**
```
rendering-base
├── BaseAssetLoader (contrato genérico)
├── CustomGeometryLoader (contrato específico)
└── FullGltfLoader (contrato específico)
     ↓ Implementadas en:
rendering-webgpu
├── ThreeCustomGeometryLoader (THREE.js impl)
└── ThreeFullGltfLoader (THREE.js impl)
```

### 2. **Type Safety**
```typescript
// Genérico permite tipos específicos
class MyLoader extends BaseAssetLoader<THREE.BufferGeometry> {
  async load(): Promise<THREE.BufferGeometry> { ... }
}

// Compiler checks automático
const geom = await loader.load(url);
// ✅ geom: THREE.BufferGeometry (type-safe)
```

### 3. **Built-in Cache**
```typescript
// Cache automático en la base
protected getCached(key: string): T | undefined;
protected setCached(key: string, asset: T): void;

// Subclasses ganan caché gratis
class ThreeGltfLoader extends FullGltfLoader {
  async load(url: string) {
    const cached = this.getCached(url);  // ✅ Funciona
    if (cached) return cached;
    // load...
  }
}
```

### 4. **Validación**
```typescript
// FullGltfLoader now validates magic numbers
canHandle(source: string | ArrayBuffer): boolean {
  if (typeof source === 'string') {
    return source.endsWith('.gltf') || source.endsWith('.glb');
  }
  if (source instanceof ArrayBuffer) {
    // Check 'glTF' magic bytes: [0x67, 0x6C, 0x54, 0x46]
    const view = new Uint8Array(source);
    return view[0] === 0x67 && view[1] === 0x6C && view[2] === 0x54 && view[3] === 0x46;
  }
  return false;
}
```

### 5. **Consistent Lifecycle**
```typescript
// Todos los loaders siguen el mismo patrón
loader.load(source, options);
loader.clearCache();
loader.dispose();
```

## Cómo Usar en Renderers

### rendering-webgpu

```typescript
import { FullGltfLoader, CustomGeometryLoader } from '@duckengine/rendering-base';
import * as THREE from 'three/webgpu';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Implementación concreta
export class ThreeFullGltfLoader extends FullGltfLoader {
  private gltfLoader = new GLTFLoader();

  async load(url: string, options?: Record<string, unknown>): Promise<THREE.Group> {
    const cached = this.getCached(url);
    if (cached) return cached;

    const gltf = await this.gltfLoader.loadAsync(url);
    this.setCached(url, gltf.scene);
    return gltf.scene;
  }
}

// En features
export class ModelFeature implements IRenderFeature {
  constructor(private gltfLoader: ThreeFullGltfLoader) {}

  async onAttach(entity: Entity, context: RenderContext) {
    const modelComponent = entity.getComponent(ModelComponent);
    const model = await this.gltfLoader.load(modelComponent.url);
    context.registry.set(entity.id, { object3D: model });
  }
}
```

### rendering-webgl (future)

```typescript
export class GLFullGltfLoader extends FullGltfLoader {
  async load(url: string): Promise<GLTFData> {
    // WebGL-specific implementation
  }
}
```

## Archivo de Documentación

Consulta `ASSET_LOADERS.md` para:
- Patrón completo
- Ejemplos de implementación
- Casos de uso
- Futuros loaders

## Compilación

✅ `npm run build` - Sin errores

```bash
> @duckengine/rendering-base@0.1.0 build
> tsc -p tsconfig.json

# ✓ Compila correctamente
```

---

**Conclusión:** Los loaders ahora siguen un patrón claro, extensible y type-safe que simplifica la implementación de nuevos renderers.
