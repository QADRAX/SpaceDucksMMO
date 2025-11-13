import type IRenderingEngine from '@client/domain/ports/IRenderingEngine';
import type { TextureResolverService } from '@client/application/TextureResolverService';
import type { SettingsService } from '@client/application/SettingsService';
import { BaseScene } from '@client/infrastructure/scenes/BaseScene';
import SceneId from '@client/domain/scene/SceneId';
import * as THREE from 'three';
import { StarBuilder, PlanetBuilder } from '@client/infrastructure/scene-objects/celestial';
import { Skybox } from '@client/infrastructure/scene-objects';

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

    // Create sun using StarBuilder
    const star = StarBuilder.create('menu-sun', this.textureResolver, {
      radius: 1.0,
      textureId: 'sun',
      coronaColor: 0xffdd44,
      coronaRadius: 1.04,
      coronaIntensity: 1.4,
      coronaPulse: true,
      lightIntensity: 6.0,
      lightColor: 0xffaa44,
      rotationSpeed: 0.1,
      emissiveColor: 0xffaa00,
      emissiveIntensity: 4.0,
    });
    
    // Rocky textured planet using PlanetBuilder
    const rockyTextured = PlanetBuilder.create('planet-textured-rocky', this.textureResolver, {
      radius: 0.5,
      textureId: 'rocky-planet',
      tintColor: 0xffffff,
      tintIntensity: 0,
      hasAtmosphere: false,
      roughness: 0.8,
      metalness: 0.1,
      rotationSpeed: 0.04,
    });
    
    // Planet 1: Earth-like with blue atmosphere
    const earthPlanet = PlanetBuilder.create('planet-earth', this.textureResolver, {
      radius: 0.4,
      textureId: 'rocky-planet',
      tintColor: 0x4488cc,
      tintIntensity: 0.5,
      hasAtmosphere: true,
      atmosphereColor: 0x88ccff,
      atmosphereThickness: 1.3,
      atmosphereIntensity: 2.5,
      roughness: 0.7,
      metalness: 0.2,
      rotationSpeed: 0.03,
    });
    
    // Planet 2: Mars-like with thin red atmosphere
    const marsPlanet = PlanetBuilder.create('planet-mars', this.textureResolver, {
      radius: 0.3,
      textureId: 'rocky-planet',
      tintColor: 0xcc6644,
      tintIntensity: 0.6,
      hasAtmosphere: true,
      atmosphereColor: 0xff4422,
      atmosphereThickness: 1.25,
      atmosphereIntensity: 2.0,
      roughness: 0.9,
      metalness: 0.1,
      rotationSpeed: 0.05,
    });
    
    // Planet 3: Desert/Venus-like with thick orange atmosphere
    const venusPlanet = PlanetBuilder.create('planet-venus', this.textureResolver, {
      radius: 0.35,
      textureId: 'rocky-planet',
      tintColor: 0xe89b3c,
      tintIntensity: 0.7,
      hasAtmosphere: true,
      atmosphereColor: 0xffaa00,
      atmosphereThickness: 1.35,
      atmosphereIntensity: 3.0,
      roughness: 0.6,
      metalness: 0.15,
      rotationSpeed: 0.02,
    });
    
    // Planet 4: Icy/frozen with cyan atmosphere
    const icePlanet = PlanetBuilder.create('planet-ice', this.textureResolver, {
      radius: 0.25,
      textureId: 'rocky-planet',
      tintColor: 0xaaddff,
      tintIntensity: 0.8,
      hasAtmosphere: true,
      atmosphereColor: 0x00ffff,
      atmosphereThickness: 1.28,
      atmosphereIntensity: 2.2,
      roughness: 0.3,
      metalness: 0.4,
      rotationSpeed: 0.08,
    });
    
    // Planet 5: Rocky without atmosphere (like Mercury)
    const mercuryPlanet = PlanetBuilder.create('planet-mercury', this.textureResolver, {
      radius: 0.2,
      textureId: 'rocky-planet',
      tintColor: 0x8c7853,
      tintIntensity: 0.4,
      hasAtmosphere: false,
      roughness: 0.95,
      metalness: 0.05,
      rotationSpeed: 0.02,
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
    
    // Position celestial bodies using setPosition (new API)
    star.setPosition(0, 0, 0);
    rockyTextured.setPosition(-3.5, 0, 0);
    earthPlanet.setPosition(3, 0, 0);
    marsPlanet.setPosition(-2.5, 0.5, 1);
    venusPlanet.setPosition(1, -0.5, -3);
    icePlanet.setPosition(-1.5, 1, -2);
    mercuryPlanet.setPosition(2, -1, 2);
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

/* ========================================
 * SISTEMA DE CUERPOS CELESTES COMPONENTIZADO
 * ========================================
 * 
 * Esta escena usa el nuevo sistema de builders celestiales:
 * 
 * ✅ StarBuilder: Crea estrellas con corona, luz y efectos
 * ✅ PlanetBuilder: Crea planetas con texturas, tintes y atmósferas
 * 
 * Características:
 * - Componentes modulares (TextureComponent, TintComponent, AtmosphereComponent, etc.)
 * - Sistema de composición limpio
 * - Recarga automática de texturas cuando cambia la calidad
 * - API consistente con setPosition() y getComponent()
 * 
 * Documentación completa: celestial/README.md
 * Ejemplo detallado: celestial/EXAMPLE.ts
 * 
 * Ventajas vs sistema legacy:
 * - Más flexible y extensible
 * - Código más limpio y organizado
 * - Fácil añadir nuevos efectos
 * - Mejor separación de responsabilidades
 * - Reutilización de componentes
 */
