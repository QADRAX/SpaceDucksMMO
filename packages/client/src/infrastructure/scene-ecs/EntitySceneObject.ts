import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import { Entity } from './Entity';

/**
 * Adapter que convierte Entity en ISceneObject para compatibilidad con BaseScene.
 * 
 * Este es un wrapper delgado que delega toda la lógica a:
 * - Entity: gestión de componentes y transform
 * - RenderSyncSystem: sincronización con THREE.js
 * 
 * NO contiene lógica de rendering, solo adaptación de interfaces.
 */
export class EntitySceneObject implements ISceneObject {
  readonly id: string;
  readonly entity: Entity;

  constructor(entity: Entity) {
    this.id = entity.id;
    this.entity = entity;
  }

  /**
   * ISceneObject: agregar a la escena THREE.js.
   * El RenderSyncSystem se encarga de crear y agregar objetos THREE.js.
   * Este método es un no-op, la lógica está en BaseScene que llama a RenderSyncSystem.addEntity().
   */
  addTo(scene: any): void {
    // No-op: RenderSyncSystem gestiona la adición a THREE.Scene
  }

  /**
   * ISceneObject: remover de la escena THREE.js.
   * El RenderSyncSystem se encarga de limpiar objetos THREE.js.
   * Este método es un no-op, la lógica está en BaseScene que llama a RenderSyncSystem.removeEntity().
   */
  removeFrom(scene: any): void {
    // No-op: RenderSyncSystem gestiona la remoción
  }

  /**
   * ISceneObject: actualización por frame.
   * Delega al update de Entity, que actualiza sus componentes.
   */
  update(dt: number): void {
    this.entity.update(dt);
  }

  /**
   * ISceneObject: dispose de recursos.
   * Los recursos THREE.js se limpian en RenderSyncSystem.removeEntity().
   */
  dispose(): void {
    // No-op: RenderSyncSystem gestiona disposal de recursos THREE.js
  }
}

export default EntitySceneObject;
