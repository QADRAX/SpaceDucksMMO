import SceneId from '@client/domain/scene/SceneId';
import { SceneFactory, type SceneDefinition } from '../SceneFactory';
import type { TextureResolverService } from '@client/application/TextureResolverService';
import { StarBuilder, PlanetBuilder, SkyboxBuilder } from '@client/infrastructure/scene-objects/visual-components';
import { OrbitCameraBuilder } from '@client/infrastructure/scene-objects/cameras';
import * as THREE from 'three';

/**
 * Main menu scene - Ambient background with planets and sun
 * Declarative definition without class boilerplate
 */
export function createMainMenuSceneDefinition(textureResolver: TextureResolverService): SceneDefinition {
  return SceneFactory.define(SceneId.MainMenu)
    .withCameraObject(OrbitCameraBuilder.create('menu-camera', {
      fov: 75,
      orbit: {
        distance: 1.5,
        height: 0,
        speed: 0.0003,
        autoRotate: true
      },
      target: new THREE.Vector3(-3.5, 0, 0)
    }))
    .addObject(SkyboxBuilder.createStarfield('menu-skybox', textureResolver, {
      brightness: 1.5,
      rotationSpeed: 0.00002
    }))
    .addObject(StarBuilder.create('menu-sun', textureResolver, {
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
    }), { position: [0, 0, 0] })
    .addObject(PlanetBuilder.create('planet-textured-rocky', textureResolver, {
      radius: 0.5,
      textureId: 'rocky-planet',
      tintColor: 0xffffff,
      tintIntensity: 0,
      hasAtmosphere: false,
      roughness: 0.8,
      metalness: 0.1,
      rotationSpeed: 0.04,
    }), { position: [-3.5, 0, 0] })
    .addObject(PlanetBuilder.create('planet-earth', textureResolver, {
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
    }), { position: [3, 0, 0] })
    .addObject(PlanetBuilder.create('planet-mars', textureResolver, {
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
    }), { position: [-2.5, 0.5, 1] })
    .addObject(PlanetBuilder.create('planet-venus', textureResolver, {
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
    }), { position: [1, -0.5, -3] })
    .addObject(PlanetBuilder.create('planet-ice', textureResolver, {
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
    }), { position: [-1.5, 1, -2] })
    .addObject(PlanetBuilder.create('planet-mercury', textureResolver, {
      radius: 0.2,
      textureId: 'rocky-planet',
      tintColor: 0x8c7853,
      tintIntensity: 0.4,
      hasAtmosphere: false,
      roughness: 0.95,
      metalness: 0.05,
      rotationSpeed: 0.02,
    }), { position: [2, -1, 2] })
    .build();
}
