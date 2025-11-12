import type IRenderingEngine from '@client/domain/ports/IRenderingEngine';
import type { TextureResolverService } from '@client/application/TextureResolverService';
import type { SettingsService } from '@client/application/SettingsService';
import { BaseScene } from '@client/infrastructure/scenes/BaseScene';
import SceneId from '@client/domain/scene/SceneId';
import * as THREE from 'three';
import { TexturedSunStar, RockyPlanet, RockyTexturedPlanet, Skybox } from '@client/infrastructure/scene-objects';

/**
 * Main menu background scene: ambient, non-interactive visual backdrop.
 * Features planets, sun, and starfield skybox.
 */
export class MainMenuScene extends BaseScene {
  readonly id = SceneId.MainMenu;
  private camera: THREE.Camera | null = null;
  private cameraAngle: number = 0;
  private cameraDistance: number = 5;
  private cameraHeight: number = 1;
  
  constructor(
    private textureResolver: TextureResolverService,
    settingsService: SettingsService
  ) {
    super(settingsService);
  }

  setup(engine: IRenderingEngine): void {
    // Call parent setup to initialize texture reload system
    super.setup(engine);
    
    // Configure camera position for menu view
    const camera = engine.getCamera();
    this.camera = camera;
    
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.position.set(0, this.cameraHeight, this.cameraDistance);
      camera.lookAt(0, 0, 0);
    }

    // Setup lighting - solo el sol ilumina la escena
    const scene = engine.getScene();

    // Add scene objects
    const star = new TexturedSunStar('menu-sun', this.textureResolver, {
      radius: 1,
      glowColor: 0xffdd44,
      glowRadiusMultiplier: 1.7,
      glowIntensity: 0.004,
      innerGlowRadius: 1.03,
      innerGlowIntensity: 0.8,
      rotationSpeed: -0.03,
      lightIntensity: 6.0,
      emissiveIntensity: 4.0,
      enablePulse: true
    });
    
    // Textured planet with rocky-planet.jpg
    const rockyTextured = new RockyTexturedPlanet('planet-textured-rocky', this.textureResolver, {
      radius: 0.5,
      roughness: 0.8,
      metalness: 0.1,
      rotationSpeed: 0.04,
      hasAtmosphere: false
    });
    
    // Planet 1: Earth-like with blue atmosphere
    const earthPlanet = new RockyPlanet('planet-earth', {
      radius: 0.4,
      surfaceColor: 0x4488cc,
      secondaryColor: 0x228844,
      hasAtmosphere: true,
      atmosphereColor: 0x88ccff,
      atmosphereOpacity: 2.5,
      atmosphereThickness: 1.3,
      roughness: 0.7,
      metalness: 0.2,
      rotationSpeed: 0.03
    });
    
    // Planet 2: Mars-like with thin red atmosphere
    const marsPlanet = new RockyPlanet('planet-mars', {
      radius: 0.3,
      surfaceColor: 0xcc6644,
      secondaryColor: 0x884422,
      hasAtmosphere: true,
      atmosphereColor: 0xff4422,
      atmosphereOpacity: 2.0,
      atmosphereThickness: 1.25,
      roughness: 0.9,
      metalness: 0.1,
      rotationSpeed: 0.05
    });
    
    // Planet 3: Desert/Venus-like with thick orange atmosphere
    const venusPlanet = new RockyPlanet('planet-venus', {
      radius: 0.35,
      surfaceColor: 0xe89b3c,
      secondaryColor: 0xd4843d,
      hasAtmosphere: true,
      atmosphereColor: 0xffaa00,
      atmosphereOpacity: 3.0,
      atmosphereThickness: 1.35,
      roughness: 0.6,
      metalness: 0.15,
      rotationSpeed: -0.02 // rotación inversa
    });
    
    // Planet 4: Icy/frozen with cyan atmosphere
    const icePlanet = new RockyPlanet('planet-ice', {
      radius: 0.25,
      surfaceColor: 0xaaddff,
      secondaryColor: 0x6699cc,
      hasAtmosphere: true,
      atmosphereColor: 0x00ffff,
      atmosphereOpacity: 2.2,
      atmosphereThickness: 1.28,
      roughness: 0.3,
      metalness: 0.4,
      rotationSpeed: 0.08
    });
    
    // Planet 5: Rocky without atmosphere (like Mercury)
    const mercuryPlanet = new RockyPlanet('planet-mercury', {
      radius: 0.2,
      surfaceColor: 0x8c7853,
      secondaryColor: 0x6b5d4f,
      hasAtmosphere: false,
      roughness: 0.95,
      metalness: 0.05,
      rotationSpeed: 0.02
    });
    
    // Starfield skybox background
    const skybox = new Skybox('menu-skybox', this.textureResolver, {
      texture: 'stars_milky_way',
      radius: 1000,
      rotationSpeed: 0.00002,
      brightness: 1.5, // Más brillante que el default
      tint: 0xffffff, // Sin tinte (blanco puro)
      segments: 64, // Suave y detallado
      depthWrite: false // No escribe en depth buffer
    });
    
    // Add all objects using addObject to enable automatic texture reloading
    this.addObject(engine, skybox);
    this.addObject(engine, star);
    this.addObject(engine, rockyTextured);
    this.addObject(engine, earthPlanet);
    this.addObject(engine, marsPlanet);
    this.addObject(engine, venusPlanet);
    this.addObject(engine, icePlanet);
    this.addObject(engine, mercuryPlanet);
    
    // Position textured planet prominently
    const rockyObj = rockyTextured.getObject3D();
    if (rockyObj) rockyObj.position.set(-3.5, 0, 0);
    
    // Position planets in different locations to see them all
    const earthObj = earthPlanet.getObject3D();
    if (earthObj) earthObj.position.set(3, 0, 0);
    
    const marsObj = marsPlanet.getObject3D();
    if (marsObj) marsObj.position.set(-2.5, 0.5, 1);
    
    const venusObj = venusPlanet.getObject3D();
    if (venusObj) venusObj.position.set(1, -0.5, -3);
    
    const iceObj = icePlanet.getObject3D();
    if (iceObj) iceObj.position.set(-1.5, 1, -2);
    
    const mercuryObj = mercuryPlanet.getObject3D();
    if (mercuryObj) mercuryObj.position.set(2, -1, 2);
  }

  update(dt: number): void {
    // Update all scene objects
    this.objects.forEach(obj => obj.update(dt));
    
    // Orbit camera around rocky textured planet to test lighting
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.cameraAngle += 0.0003 * dt; // Faster to see full orbit
      
      // Rocky planet is at position (-3.5, 0, 0)
      const planetPos = new THREE.Vector3(-3.5, 0, 0);
      const orbitRadius = 1.5; // Closer to see lighting detail
      
      const x = planetPos.x + Math.cos(this.cameraAngle) * orbitRadius;
      const z = planetPos.z + Math.sin(this.cameraAngle) * orbitRadius;
      
      this.camera.position.set(x, planetPos.y, z);
      this.camera.lookAt(planetPos);
    }
  }

  teardown(engine: IRenderingEngine): void {
    // Call parent teardown to cleanup subscriptions and objects
    super.teardown(engine);
    
    this.camera = null;
    
    // Clear lights (Three.js will keep references otherwise)
    const scene = engine.getScene();
    const lights = scene.children.filter(child => child instanceof THREE.Light);
    lights.forEach(light => scene.remove(light));
  }
}

export default MainMenuScene;
