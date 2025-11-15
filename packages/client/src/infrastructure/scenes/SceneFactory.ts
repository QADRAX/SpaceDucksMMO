import type IRenderingEngine from '@client/domain/ports/IRenderingEngine';
import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import type { ISceneController } from '@client/domain/scene/ISceneController';
import type { SettingsService } from '@client/application/SettingsService';
import { BaseScene } from './BaseScene';
import SceneId from '@client/domain/scene/SceneId';
import * as THREE from 'three';
import { CameraBody, type CameraBodyConfig } from '@client/infrastructure/scene-objects/cameras';

/**
 * Object configuration for scene setup
 */
export interface SceneObjectConfig {
  object: ISceneObject;
  position?: [number, number, number];
}

/**
 * Complete scene definition
 */
export interface SceneDefinition {
  id: SceneId;
  camera: CameraBody;  // Camera is mandatory and always a CameraBody
  objects: SceneObjectConfig[];
  controllers?: ISceneController[];
}

/**
 * Generic scene created from declarative definition
 */
class DeclarativeScene extends BaseScene {
  readonly id: SceneId;
  private definition: SceneDefinition;
  private camera: THREE.PerspectiveCamera | null = null;

  constructor(definition: SceneDefinition, settingsService: SettingsService) {
    super(settingsService);
    this.id = definition.id;
    this.definition = definition;
  }

  setup(engine: IRenderingEngine): void {
    super.setup(engine);

    // Setup camera - wrap engine camera with CameraObject for inspection
    const camera = engine.getCamera();
    this.camera = camera instanceof THREE.PerspectiveCamera ? camera : null;

    if (this.camera) {
      // Wrap the engine's camera with the CameraBody from definition
      const cameraObj = this.definition.camera;
      
      // Re-create wrapping the engine's camera
      const wrappedCamera = new CameraBody(
        cameraObj.id,
        { externalCamera: this.camera }
      );
      
      // Copy all managed components from the definition camera with metadata
      const managedComponents = cameraObj.getManagedComponents();
      for (const managed of managedComponents) {
        wrappedCamera.addManagedComponent(managed.component, managed.metadata);
      }
      
      // Copy all properties from the definition camera to the wrapped one
      const props = cameraObj.getInspectableProperties();
      for (const prop of props) {
        try {
          wrappedCamera.setProperty(prop.name, cameraObj.getProperty(prop.name));
        } catch (e) {
          // Skip properties that can't be set
        }
      }
      
      // Add camera as first object in the scene
      this.definition.objects.unshift({ object: wrappedCamera });
    }

    // Add all objects using builder
    const builder = this.setupScene(engine);
    
    for (const objConfig of this.definition.objects) {
      builder.add(objConfig.object, {
        position: objConfig.position
      });
    }
    
    builder.build();

    // Add controllers
    if (this.definition.controllers) {
      for (const controller of this.definition.controllers) {
        this.addController(controller);
        controller.enable();
      }
    }
  }

}

/**
 * Factory for creating scenes from declarative definitions
 */
export class SceneFactory {
  /**
   * Create a scene from a declarative definition
   */
  static createScene(definition: SceneDefinition, settingsService: SettingsService): BaseScene {
    return new DeclarativeScene(definition, settingsService);
  }

  /**
   * Builder for creating scene definitions fluently
   */
  static define(id: SceneId): SceneDefinitionBuilder {
    return new SceneDefinitionBuilder(id);
  }
}

/**
 * Fluent builder for scene definitions
 */
export class SceneDefinitionBuilder {
  private definition: Partial<SceneDefinition> & { id: SceneId; objects: SceneObjectConfig[]; controllers?: ISceneController[] };

  constructor(id: SceneId) {
    this.definition = {
      id,
      objects: [],
      controllers: []
    };
  }

  /**
   * Configure camera using CameraBody (appears in scene hierarchy)
   */
  withCameraObject(cameraObject: CameraBody): this {
    this.definition.camera = cameraObject;
    return this;
  }

  /**
   * Add an object to the scene
   */
  addObject(object: ISceneObject, options?: { position?: [number, number, number] }): this {
    this.definition.objects.push({
      object,
      position: options?.position
    });
    return this;
  }

  /**
   * Add multiple objects to the scene
   */
  addObjects(...configs: SceneObjectConfig[]): this {
    this.definition.objects.push(...configs);
    return this;
  }

  /**
   * Add a controller to the scene
   */
  addController(controller: ISceneController): this {
    if (!this.definition.controllers) {
      this.definition.controllers = [];
    }
    this.definition.controllers.push(controller);
    return this;
  }

  /**
   * Build the scene definition
   */
  build(): SceneDefinition {
    if (!this.definition.camera) {
      throw new Error('Scene must have a camera. Use withCameraObject() to add one.');
    }
    return this.definition as SceneDefinition;
  }
}
