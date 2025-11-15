import type IScene from '@client/domain/ports/IScene';
import type IRenderingEngine from '@client/domain/ports/IRenderingEngine';
import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import type { IInspectable } from '@client/domain/scene/IInspectable';
import { isInspectable } from '@client/domain/scene/IInspectable';
import type { CameraBody } from '@client/infrastructure/scene-objects/cameras';
import * as THREE from 'three';

export interface SceneObjectInfo {
  id: string;
  typeName: string;
  isInspectable: boolean;
  object: ISceneObject;
}

/**
 * Scene Editor Service
 * 
 * Provides runtime manipulation of the current scene:
 * - Add/remove objects dynamically
 * - Select objects for inspection
 * - Get/set object properties
 * - List all objects in scene
 * 
 * Usage:
 * ```ts
 * const editor = new SceneEditor(engine);
 * 
 * // Set current scene
 * editor.setScene(currentScene);
 * 
 * // Add object
 * const planet = PlanetBuilder.create(...);
 * editor.addObject(planet);
 * 
 * // Select and inspect
 * editor.selectObject('planet-1');
 * const selected = editor.getSelectedObject();
 * if (isInspectable(selected)) {
 *   selected.setProperty('radius', 2.5);
 * }
 * 
 * // Remove object
 * editor.removeObject('planet-1');
 * ```
 */
export class SceneEditor {
  private currentScene: IScene | null = null;
  private sceneObjects: Map<string, ISceneObject> = new Map();
  private selectedObjectId: string | null = null;
  private selectionCallbacks: Array<(objectId: string | null) => void> = [];
  private changeCallbacks: Array<() => void> = [];

  constructor(private engine: IRenderingEngine) {}

  /**
   * Set the current scene to edit.
   * Automatically extracts objects from BaseScene if available.
   */
  setScene(scene: IScene | null): void {
    this.currentScene = scene;
    this.sceneObjects.clear();
    this.selectedObjectId = null;

    if (scene && 'getObjects' in scene) {
      const objects = (scene as any).getObjects() as ISceneObject[];
      objects.forEach(obj => {
        this.sceneObjects.set(obj.id, obj);
      });
    }

    this.notifyChange();
  }

  /**
   * Get current scene being edited
   */
  getScene(): IScene | null {
    return this.currentScene;
  }

  /**
   * Add an object to the current scene
   */
  addObject(obj: ISceneObject, position?: THREE.Vector3): void {
    if (!this.currentScene) {
      console.warn('[SceneEditor] Cannot add object: no scene set');
      return;
    }

    // Prevent adding multiple cameras
    if (isInspectable(obj)) {
      const typeName = obj.getTypeName?.();
      if (typeName?.includes('Camera')) {
        // Check if scene already has a camera
        const hasCamera = Array.from(this.sceneObjects.values()).some(existing => {
          if (!isInspectable(existing)) return false;
          const existingType = existing.getTypeName?.();
          return existingType?.includes('Camera');
        });
        
        if (hasCamera) {
          console.warn('[SceneEditor] Cannot add camera: scene already has a camera');
          alert('Scene can only have one camera. Delete the existing camera first.');
          return;
        }
      }
    }

    // Add to scene
    this.engine.add(obj);
    
    // Set position if provided
    if (position) {
      const transform = isInspectable(obj) ? (obj as IInspectable).getTransform() : null;
      if (transform) {
        transform.position.copy(position);
      }
    }

    // Track object
    this.sceneObjects.set(obj.id, obj);

    // If scene has addObject method (BaseScene), use it
    if ('addObject' in this.currentScene && typeof (this.currentScene as any).addObject === 'function') {
      // Already added to engine, but BaseScene needs to track it
      const baseScene = this.currentScene as any;
      if (!baseScene.objects) {
        baseScene.objects = [];
      }
      if (!baseScene.objects.includes(obj)) {
        baseScene.objects.push(obj);
      }
    }

    this.notifyChange();
  }

  /**
   * Remove an object from the current scene
   */
  removeObject(objectId: string): void {
    const obj = this.sceneObjects.get(objectId);
    if (!obj) {
      console.warn(`[SceneEditor] Object not found: ${objectId}`);
      return;
    }

    // Remove from engine
    this.engine.remove(objectId);

    // Dispose if possible
    if (obj.dispose) {
      obj.dispose();
    }

    // Remove from BaseScene tracking if applicable
    if (this.currentScene && 'objects' in this.currentScene) {
      const baseScene = this.currentScene as any;
      if (Array.isArray(baseScene.objects)) {
        const index = baseScene.objects.indexOf(obj);
        if (index !== -1) {
          baseScene.objects.splice(index, 1);
        }
      }
    }

    // Untrack
    this.sceneObjects.delete(objectId);

    // Deselect if was selected
    if (this.selectedObjectId === objectId) {
      this.selectObject(null);
    }

    this.notifyChange();
  }

  /**
   * Select an object for inspection
   */
  selectObject(objectId: string | null): void {
    if (objectId && !this.sceneObjects.has(objectId)) {
      console.warn(`[SceneEditor] Cannot select unknown object: ${objectId}`);
      return;
    }

    this.selectedObjectId = objectId;
    this.notifySelection(objectId);
  }

  /**
   * Get currently selected object
   */
  getSelectedObject(): ISceneObject | null {
    if (!this.selectedObjectId) return null;
    return this.sceneObjects.get(this.selectedObjectId) || null;
  }

  /**
   * Get selected object ID
   */
  getSelectedObjectId(): string | null {
    return this.selectedObjectId;
  }

  /**
   * List all objects in the current scene
   */
  listObjects(): SceneObjectInfo[] {
    return Array.from(this.sceneObjects.values()).map(obj => ({
      id: obj.id,
      typeName: this.getObjectTypeName(obj),
      isInspectable: isInspectable(obj),
      object: obj
    }));
  }

  /**
   * Get an object by ID
   */
  getObject(objectId: string): ISceneObject | null {
    return this.sceneObjects.get(objectId) || null;
  }

  /**
   * Subscribe to selection changes
   */
  onSelectionChange(callback: (objectId: string | null) => void): () => void {
    this.selectionCallbacks.push(callback);
    return () => {
      const index = this.selectionCallbacks.indexOf(callback);
      if (index !== -1) {
        this.selectionCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to scene changes (add/remove objects)
   */
  onChange(callback: () => void): () => void {
    this.changeCallbacks.push(callback);
    return () => {
      const index = this.changeCallbacks.indexOf(callback);
      if (index !== -1) {
        this.changeCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectObject(null);
  }

  /**
   * Get object count
   */
  getObjectCount(): number {
    return this.sceneObjects.size;
  }

  /**
   * Update camera target to follow an object
   */
  updateCameraTarget(cameraId: string, targetObjectId: string): void {
    const camera = this.sceneObjects.get(cameraId);
    const targetObj = this.sceneObjects.get(targetObjectId);

    if (!camera || !targetObj) {
      console.warn('[SceneEditor] Camera or target object not found');
      return;
    }

    // Check if camera is a CameraBody
    if (isInspectable(camera) && camera.getTypeName?.()?.includes('Camera')) {
      // TODO: Implement target tracking with new component architecture
      // The new CameraBody doesn't have setTargetFromObject/setTargetObjectTransform methods
      // This functionality needs to be reimplemented using TargetTrackingComponent
      console.warn('[SceneEditor] Camera target tracking not yet implemented with new component architecture');
      
      // const cameraObj = camera as unknown as CameraBody;
      // Get target object position
      // const targetInspectable = isInspectable(targetObj) ? targetObj : null;
      // if (targetInspectable) {
      //   const targetTransform = targetInspectable.getTransform();
      //   if (targetTransform) {
      //     // Need to use TargetTrackingComponent instead
      //   }
      // }
    }
  }

  private notifySelection(objectId: string | null): void {
    this.selectionCallbacks.forEach(cb => cb(objectId));
  }

  private notifyChange(): void {
    this.changeCallbacks.forEach(cb => cb());
  }

  private getObjectTypeName(obj: ISceneObject): string {
    if (isInspectable(obj) && obj.getTypeName) {
      return obj.getTypeName();
    }

    // Fallback: parse from ID or constructor name
    const id = obj.id.toLowerCase();
    if (id.includes('planet')) return 'Planet';
    if (id.includes('star')) return 'Star';
    if (id.includes('moon')) return 'Moon';
    if (id.includes('light')) return 'Light';
    if (id.includes('skybox')) return 'Skybox';
    if (id.includes('grid')) return 'Grid Helper';
    if (id.includes('axes')) return 'Axes Helper';

    return 'Object';
  }
}

export default SceneEditor;
