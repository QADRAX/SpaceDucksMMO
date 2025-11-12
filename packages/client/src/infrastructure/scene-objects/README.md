# Scene Objects Library

Reusable, configurable 3D objects that can be used across multiple scenes in the game.

## Available Objects

### SunStar

A realistic sun-like star with configurable appearance and effects.

**Features:**
- Customizable radius, colors, and rotation speed
- Outer corona/glow effect with breathing animation
- Optional point light emission
- Subtle pulsing effect
- Runtime color updates

**Usage:**

```typescript
import { SunStar } from '@client/infrastructure/scene-objects';

// Default yellow sun
const sun = new SunStar('main-sun');

// Custom orange giant star
const orangeStar = new SunStar('orange-giant', {
  radius: 2.5,
  color: 0xff6600,
  glowColor: 0xff9944,
  lightColor: 0xff7700,
  rotationSpeed: 0.05
});

// Blue dwarf star (fast rotation, no pulse)
const blueDwarf = new SunStar('blue-dwarf', {
  radius: 0.8,
  color: 0x88ccff,
  glowColor: 0xaaddff,
  lightColor: 0x88ccff,
  rotationSpeed: 0.4,
  enablePulse: false
});

// Red giant (large, slow, intense)
const redGiant = new SunStar('red-giant', {
  radius: 3.0,
  color: 0xff3300,
  glowColor: 0xff6633,
  lightIntensity: 4.0,
  lightRange: 25,
  rotationSpeed: 0.02
});

// Distant star (dim light)
const distantStar = new SunStar('distant', {
  radius: 0.5,
  lightIntensity: 0.5,
  lightRange: 8
});

// Add to scene
scene.setup(engine);
engine.add(sun);

// Position in space
sun.setPosition(10, 0, -20);

// Change color at runtime
sun.setColor(0xff0000); // Turn red
sun.setGlowColor(0xff6666); // Adjust glow
```

**Configuration Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `radius` | number | 1.2 | Radius of the main sun sphere |
| `color` | number | 0xffaa00 | Main color of the sun surface (hex) |
| `glowColor` | number | 0xffdd44 | Corona/glow color (hex) |
| `glowRadiusMultiplier` | number | 1.25 | Corona radius relative to main radius |
| `glowOpacity` | number | 0.15 | Corona base opacity (0-1) |
| `rotationSpeed` | number | 0.1 | Rotation speed in rad/s |
| `enablePulse` | boolean | true | Enable pulsing scale effect |
| `pulseIntensity` | number | 0.05 | Pulse magnitude (0-1) |
| `lightIntensity` | number | 2.0 | Point light intensity (0 to disable) |
| `lightRange` | number | 15 | Point light range in units |
| `lightColor` | number | 0xffaa44 | Light color (hex) |

**Preset Examples:**

```typescript
// Our Sun (Sol)
const sol = new SunStar('sol', {
  radius: 1.2,
  color: 0xffaa00,
  glowColor: 0xffdd44
});

// Betelgeuse (red supergiant)
const betelgeuse = new SunStar('betelgeuse', {
  radius: 4.0,
  color: 0xff4500,
  glowColor: 0xff6347,
  rotationSpeed: 0.01,
  lightIntensity: 5.0,
  lightRange: 40
});

// Sirius (blue-white)
const sirius = new SunStar('sirius', {
  radius: 1.0,
  color: 0xaaccff,
  glowColor: 0xccddff,
  lightColor: 0xaaccff,
  rotationSpeed: 0.3
});

// White dwarf (small, hot)
const whiteDwarf = new SunStar('white-dwarf', {
  radius: 0.3,
  color: 0xeeffff,
  glowColor: 0xffffff,
  lightIntensity: 1.0,
  rotationSpeed: 0.5,
  enablePulse: false
});
```

## Creating New Scene Objects

To add a new reusable scene object:

1. Create `infrastructure/scene-objects/MyObject.ts`
2. Implement `ISceneObject` interface
3. Add configuration interface if needed
4. Export from `infrastructure/scene-objects/index.ts`
5. Document usage in this file

Example structure:

```typescript
import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import * as THREE from 'three';

export interface MyObjectConfig {
  size?: number;
  color?: number;
}

export class MyObject implements ISceneObject {
  readonly id: string;
  private config: Required<MyObjectConfig>;

  constructor(id: string, config: MyObjectConfig = {}) {
    this.id = id;
    this.config = {
      size: config.size ?? 1.0,
      color: config.color ?? 0xffffff,
    };
  }

  addTo(scene: THREE.Scene): void {
    // Create and add meshes
  }

  update(dt: number): void {
    // Per-frame logic
  }

  dispose(): void {
    // Cleanup resources
  }
}
```

## Best Practices

- **Single Responsibility**: Each scene object should represent one logical entity
- **Configuration**: Expose meaningful parameters via config interface
- **Defaults**: Provide sensible defaults for all config options
- **Documentation**: Add JSDoc comments with usage examples
- **Cleanup**: Always dispose geometries and materials in `dispose()`
- **Position**: Provide `setPosition()` method for easy placement
- **Runtime Updates**: Add setter methods for properties that might change (colors, scale, etc.)

