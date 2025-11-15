import type { AvailableComponent } from './ComponentPicker';
import { GeometryComponent } from '@client/infrastructure/scene-objects/visual-components/components/GeometryComponent';
import { MaterialComponent } from '@client/infrastructure/scene-objects/visual-components/components/MaterialComponent';
import { TextureComponent } from '@client/infrastructure/scene-objects/visual-components/components/TextureComponent';
import { TintComponent } from '@client/infrastructure/scene-objects/visual-components/components/TintComponent';
import { EmissiveComponent } from '@client/infrastructure/scene-objects/visual-components/components/EmissiveComponent';
import { CoronaComponent } from '@client/infrastructure/scene-objects/visual-components/components/CoronaComponent';
import { AtmosphereComponent } from '@client/infrastructure/scene-objects/visual-components/components/AtmosphereComponent';
import { LightEmissionComponent } from '@client/infrastructure/scene-objects/visual-components/components/LightEmissionComponent';
import { RotationComponent } from '@client/infrastructure/scene-objects/visual-components/components/RotationComponent';
import { BrightnessComponent } from '@client/infrastructure/scene-objects/visual-components/components/BrightnessComponent';
import { GridComponent } from '@client/infrastructure/scene-objects/helpers/components/GridComponent';
import { AxesComponent } from '@client/infrastructure/scene-objects/helpers/components/AxesComponent';
import { AccretionDiskComponent } from '@client/infrastructure/scene-objects/visual-components/components/AccretionDiskComponent';
import { EventHorizonComponent } from '@client/infrastructure/scene-objects/visual-components/components/EventHorizonComponent';
import { JetStreamComponent } from '@client/infrastructure/scene-objects/visual-components/components/JetStreamComponent';
import { GravitationalLensingComponent } from '@client/infrastructure/scene-objects/visual-components/components/GravitationalLensingComponent';

/**
 * Registry of all available visual components that can be added to objects
 */
export function getAvailableComponents(): AvailableComponent[] {
  return [
    // Geometry
    {
      id: 'geometry',
      name: 'Geometry',
      category: 'Geometry',
      description: 'Basic shape (sphere, box, custom mesh)',
      icon: '📐',
      factory: () => new GeometryComponent({ type: 'sphere', radius: 1.0 })
    },
    
    // Material
    {
      id: 'material',
      name: 'Material',
      category: 'Material',
      description: 'Surface appearance (color, roughness, metalness)',
      icon: '🎨',
      factory: () => new MaterialComponent({ color: 0xffffff, roughness: 0.7, metalness: 0.3 })
    },
    
    // Texture
    {
      id: 'texture',
      name: 'Texture',
      category: 'Material',
      description: 'Apply texture map to surface',
      icon: '🖼️',
      factory: () => new TextureComponent(null as any, { textureId: 'earth' }) // textureResolver will be injected
    },
    
    // Tint
    {
      id: 'tint',
      name: 'Tint',
      category: 'Material',
      description: 'Color tint overlay on texture',
      icon: '🎨',
      factory: () => new TintComponent({ tintColor: 0xffffff, intensity: 0.5 })
    },
    
    // Emission
    {
      id: 'emissive',
      name: 'Emissive',
      category: 'Emission',
      description: 'Make object glow (self-illumination)',
      icon: '💡',
      factory: () => new EmissiveComponent({ color: 0xffaa00, intensity: 1.0 })
    },
    
    // Brightness
    {
      id: 'brightness',
      name: 'Brightness',
      category: 'Emission',
      description: 'Adjust overall brightness/intensity',
      icon: '🔆',
      factory: () => new BrightnessComponent({ brightness: 1.0 })
    },
    
    // Effects - Corona
    {
      id: 'corona',
      name: 'Corona',
      category: 'Effects',
      description: 'Atmospheric glow around object',
      icon: '🌟',
      factory: () => new CoronaComponent({ color: 0xffdd44, radiusMultiplier: 1.2, intensity: 1.5 })
    },
    
    // Effects - Atmosphere
    {
      id: 'atmosphere',
      name: 'Atmosphere',
      category: 'Effects',
      description: 'Planetary atmosphere effect',
      icon: '🌍',
      factory: () => new AtmosphereComponent({ color: 0x4488ff, thickness: 0.1, intensity: 1.0 })
    },
    
    // Lighting
    {
      id: 'light-emission',
      name: 'Light Emission',
      category: 'Lighting',
      description: 'Emit light into scene (point light)',
      icon: '☀️',
      factory: () => new LightEmissionComponent({ color: 0xffaa00, intensity: 2.0, range: 100 })
    },
    
    // Animation - Rotation
    {
      id: 'rotation',
      name: 'Rotation',
      category: 'Animation',
      description: 'Continuous rotation animation',
      icon: '🔄',
      factory: () => new RotationComponent({ speed: 0.1 })
    },
    
    // Helpers - Grid
    {
      id: 'grid',
      name: 'Grid Helper',
      category: 'Helpers',
      description: 'Visual reference grid',
      icon: '📏',
      factory: () => new GridComponent({ size: 20, divisions: 20 })
    },
    
    // Helpers - Axes
    {
      id: 'axes',
      name: 'Axes Helper',
      category: 'Helpers',
      description: 'XYZ axes indicator',
      icon: '📍',
      factory: () => new AxesComponent({ size: 5 })
    },
    
    // Black Hole - Accretion Disk
    {
      id: 'accretion-disk',
      name: 'Accretion Disk',
      category: 'Black Hole',
      description: 'Rotating disk of superheated matter',
      icon: '🌀',
      factory: () => new AccretionDiskComponent({
        innerRadius: 0.2, // Offset from parent surface
        outerRadius: 2.5, // Offset from parent surface
        innerColor: 0xffaa00,
        outerColor: 0xff0000,
        rotationSpeed: 0.2
      })
    },
    
    // Black Hole - Event Horizon
    {
      id: 'event-horizon',
      name: 'Event Horizon',
      category: 'Black Hole',
      description: 'Black sphere with gravitational lensing',
      icon: '⚫',
      factory: () => new EventHorizonComponent({ radiusMultiplier: 1.0, color: 0x000000, distortionStrength: 0.5 })
    },
    
    // Black Hole - Jet Stream
    {
      id: 'jet-stream',
      name: 'Jet Stream',
      category: 'Black Hole',
      description: 'High-energy particle streams',
      icon: '🚀',
      factory: () => new JetStreamComponent({ length: 8, radius: 0.2, color: 0x4488ff, intensity: 2.0 })
    },
    
    // Black Hole - Gravitational Lensing
    {
      id: 'gravitational-lensing',
      name: 'Gravitational Lensing',
      category: 'Black Hole',
      description: 'Space-time distortion effect',
      icon: '🌌',
      factory: () => new GravitationalLensingComponent({
        strength: 1.0,
        radius: 4.0, // Offset from parent surface
        falloff: 0.15,
        enableBloom: true,
        bloomStrength: 1.5
      })
    }
  ];
}

