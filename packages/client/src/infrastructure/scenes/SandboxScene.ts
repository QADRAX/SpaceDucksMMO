import type IRenderingEngine from '@client/domain/ports/IRenderingEngine';
import type { TextureResolverService } from '@client/application/TextureResolverService';
import type { SettingsService } from '@client/application/SettingsService';
import { BaseScene } from '@client/infrastructure/scenes/BaseScene';
import SceneId from '@client/domain/scene/SceneId';
import * as THREE from 'three';
import { StarBuilder, PlanetBuilder, SkyboxBuilder } from '@client/infrastructure/scene-objects/visual-components';

/**
 * Sandbox Scene - Testing and prototyping environment
 * 
 * Purpose:
 * - Rapid prototyping of new visual components
 * - Testing visual object behaviors
 * - Experimenting with lighting and materials
 * - Interactive camera control for detailed inspection
 * 
 * Features:
 * - Orbiting camera with mouse control (future)
 * - Grid helper for spatial reference
 * - Axis helper for orientation
 * - Configurable lighting setup
 * - Easy object addition/removal
 */
export class SandboxScene extends BaseScene {
  readonly id = SceneId.Sandbox;
  
  private camera: THREE.PerspectiveCamera | null = null;
  private cameraDistance: number = 10;
  private cameraAngle: number = 0;
  private gridHelper: THREE.GridHelper | null = null;
  private axesHelper: THREE.AxesHelper | null = null;
  
  constructor(
    private textureResolver: TextureResolverService,
    settingsService: SettingsService
  ) {
    super(settingsService);
  }

  setup(engine: IRenderingEngine): void {
    super.setup(engine);
    
    const scene = engine.getScene();
    const camera = engine.getCamera();
    this.camera = camera instanceof THREE.PerspectiveCamera ? camera : null;

    // Configure camera for object inspection
    if (this.camera) {
      this.camera.position.set(0, 5, this.cameraDistance);
      this.camera.lookAt(0, 0, 0);
    }

    // Add helpers for spatial reference
    this.addHelpers(scene);
    
    // Add ambient light for general visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // Add directional light for shadows and depth
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Skybox for context
    const skybox = SkyboxBuilder.createStarfield('sandbox-skybox', this.textureResolver, {
      brightness: 0.8 // Dimmer to focus on test objects
    });

    // ===================================
    // SANDBOX OBJECTS - Add your test objects here!
    // ===================================
    
    // Example: Test planet with atmosphere
    const testPlanet = PlanetBuilder.create('test-planet', this.textureResolver, {
      radius: 2,
      textureId: 'rocky-planet',
      tintColor: 0x4488ff,
      tintIntensity: 0.4,
      hasAtmosphere: true,
      atmosphereColor: 0x88ccff,
      atmosphereThickness: 1.2,
      atmosphereIntensity: 2.0,
      rotationSpeed: 0.02,
    });

    // Example: Small moon orbiting
    const testMoon = PlanetBuilder.create('test-moon', this.textureResolver, {
      radius: 0.5,
      textureId: 'rocky-planet',
      tintColor: 0xaaaaaa,
      tintIntensity: 0.3,
      hasAtmosphere: false,
      rotationSpeed: 0.05,
    });

    // Example: Test star
    const testStar = StarBuilder.create('test-star', this.textureResolver, {
      radius: 1.5,
      textureId: 'sun',
      coronaColor: 0xffaa44,
      coronaIntensity: 1.5,
      lightIntensity: 3.0,
      lightColor: 0xffddaa,
      rotationSpeed: 0.03,
    });

    // Setup scene with fluent API
    this.setupScene(engine)
      .add(skybox)
      .add(testPlanet, { position: [0, 0, 0] })
      .add(testMoon, { position: [4, 0, 0] })
      .add(testStar, { position: [-6, 2, -3] })
      .build();
  }

  private addHelpers(scene: THREE.Scene): void {
    // Grid helper (XZ plane)
    this.gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    scene.add(this.gridHelper);

    // Axes helper (RGB = XYZ)
    this.axesHelper = new THREE.AxesHelper(5);
    scene.add(this.axesHelper);
  }

  update(dt: number): void {
    // Update all scene objects
    this.objects.forEach(obj => obj.update(dt));
    
    // Slowly orbit camera around origin
    if (this.camera) {
      this.cameraAngle += 0.0001 * dt;
      
      const x = Math.cos(this.cameraAngle) * this.cameraDistance;
      const z = Math.sin(this.cameraAngle) * this.cameraDistance;
      
      this.camera.position.set(x, 5, z);
      this.camera.lookAt(0, 0, 0);
    }
  }

  teardown(engine: IRenderingEngine): void {
    super.teardown(engine);
    
    const scene = engine.getScene();
    
    // Remove helpers
    if (this.gridHelper) {
      scene.remove(this.gridHelper);
      this.gridHelper.dispose();
      this.gridHelper = null;
    }
    
    if (this.axesHelper) {
      scene.remove(this.axesHelper);
      this.axesHelper.dispose();
      this.axesHelper = null;
    }
    
    // Clear lights
    const lights = scene.children.filter(child => child instanceof THREE.Light);
    lights.forEach(light => scene.remove(light));
    
    this.camera = null;
  }
}

export default SandboxScene;

/* ========================================
 * SANDBOX SCENE - QUICK START GUIDE
 * ========================================
 * 
 * This scene is your playground for testing visual components!
 * 
 * HOW TO ADD TEST OBJECTS:
 * 
 * 1. Create your objects using builders:
 *    ```ts
 *    const myObject = PlanetBuilder.create('test-id', this.textureResolver, {
 *      radius: 1.0,
 *      tintColor: 0xff0000,
 *      // ... your config
 *    });
 *    ```
 * 
 * 2. Add to scene with position:
 *    ```ts
 *    this.setupScene(engine)
 *      .add(myObject, { position: [x, y, z] })
 *      .build();
 *    ```
 * 
 * HELPERS:
 * - Grid: XZ plane with 1-unit spacing
 * - Axes: Red=X, Green=Y, Blue=Z
 * - Camera: Slow auto-orbit for 360° view
 * 
 * LIGHTING:
 * - Ambient: Soft fill light (0.3)
 * - Directional: Main light with shadows (0.7)
 * - Star objects: Add their own point lights
 * 
 * TIPS:
 * - Adjust cameraDistance for closer/farther view
 * - Toggle helpers visibility by commenting gridHelper/axesHelper
 * - Use different tint colors to distinguish test objects
 * - Check console for texture loading and component info
 */
