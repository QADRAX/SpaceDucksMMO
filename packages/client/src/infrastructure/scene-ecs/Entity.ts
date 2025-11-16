import { Transform } from './Transform';
import { Component } from './Component';
import type { ComponentMetadata } from './ComponentMetadata';

export class Entity {
  readonly id: string;
  
  /** Transform integrado - toda entity tiene posición/rotación/escala */
  readonly transform: Transform;
  
  private components = new Map<string, Component>();
  
  /** Jerarquía: entity padre (si existe) */
  private _parent?: Entity;
  
  /** Jerarquía: entities hijas */
  private children: Entity[] = [];

  constructor(id: string, position?: [number, number, number]) {
    this.id = id;
    this.transform = new Transform(position);
  }

  // --- Componentes ---

  addComponent<T extends Component>(component: T): this {
    // Validar antes de agregar
    const errors = this.validateComponent(component);
    
    if (errors.length > 0) {
      throw new Error(
        `Cannot add component '${component.type}' to entity '${this.id}':\n` +
        errors.map(e => `  - ${e}`).join('\n')
      );
    }
    
    // Establecer entityId en el componente
    component.setEntityId(this.id);
    
    // Agregar al mapa
    this.components.set(component.type, component);
    
    return this;
  }

  removeComponent(type: string): void {
    const component = this.components.get(type);
    if (!component) return;

    // Validar que ningún otro componente dependa de este
    const errors = this.validateRemoval(type);
    if (errors.length > 0) {
      throw new Error(
        `Cannot remove component '${type}' from entity '${this.id}':\n` +
        errors.map(e => `  - ${e}`).join('\n')
      );
    }

    this.components.delete(type);
  }

  getComponent<T extends Component>(type: string): T | undefined {
    return this.components.get(type) as T | undefined;
  }

  hasComponent(type: string): boolean {
    return this.components.has(type);
  }

  getAllComponents(): Component[] {
    return Array.from(this.components.values());
  }

  // --- Validación de componentes ---

  private validateComponent(component: Component): string[] {
    const errors: string[] = [];
    const meta = component.metadata;

    // 1. Validar unique: ¿ya existe uno de este tipo?
    if (meta.unique && this.components.has(component.type)) {
      errors.push(`Component '${component.type}' is unique and already exists`);
    }

    // 2. Validar requires: ¿existen los componentes requeridos?
    if (meta.requires) {
      for (const required of meta.requires) {
        if (!this.components.has(required)) {
          errors.push(`Component '${component.type}' requires '${required}' component`);
        }
      }
    }

    // 3. Validar conflicts: ¿hay componentes conflictivos?
    if (meta.conflicts) {
      for (const conflict of meta.conflicts) {
        if (this.components.has(conflict)) {
          errors.push(`Component '${component.type}' conflicts with existing '${conflict}' component`);
        }
      }
    }

    // 4. Validación custom del componente (si existe)
    if (typeof component.validate === 'function') {
      const customErrors = component.validate(this);
      errors.push(...customErrors);
    }

    return errors;
  }

  private validateRemoval(type: string): string[] {
    const errors: string[] = [];

    // Buscar componentes que requieran el que vamos a eliminar
    for (const component of this.components.values()) {
      if (component.metadata.requires?.includes(type)) {
        errors.push(`Component '${component.type}' requires '${type}'`);
      }
    }

    return errors;
  }

  // --- Jerarquía ---

  addChild(entity: Entity): void {
    if (entity._parent) {
      entity._parent.removeChild(entity.id);
    }

    entity._parent = this;
    this.children.push(entity);

    // Establecer relación de transforms
    entity.transform.setParent(this.transform);
  }

  removeChild(id: string): void {
    const index = this.children.findIndex(c => c.id === id);
    if (index >= 0) {
      const child = this.children[index];
      child._parent = undefined;
      child.transform.setParent(undefined);
      this.children.splice(index, 1);
    }
  }

  getChild(id: string): Entity | undefined {
    return this.children.find(c => c.id === id);
  }

  getChildren(): Entity[] {
    return [...this.children];
  }

  get parent(): Entity | undefined {
    return this._parent;
  }

  // --- Update ---

  update(dt: number): void {
    // Actualizar componentes
    for (const comp of this.components.values()) {
      comp.update(dt);
    }

    // Actualizar hijos
    for (const child of this.children) {
      child.update(dt);
    }
  }

  // --- Helpers ---

  /**
   * Obtiene información de compatibilidad de componentes para debugging.
   */
  getCompatibilityInfo(): {
    current: string[];
    canAdd: string[];
    cannotAdd: { type: string; reason: string }[];
  } {
    const current = Array.from(this.components.keys());
    const canAdd: string[] = [];
    const cannotAdd: { type: string; reason: string }[] = [];

    // Lista de todos los tipos de componentes conocidos
    // (esto se puede extender dinámicamente)
    const allComponentTypes = [
      'geometry', 'material', 'shaderMaterial', 
      'cameraView', 'cameraTarget', 'postProcess',
      'light', 'lensFlare', 
      'orbit', 'rotation'
    ];

    for (const type of allComponentTypes) {
      if (this.components.has(type)) continue;

      // Para validar necesitaríamos instancias dummy
      // Por ahora solo reportamos los que ya tiene
      // Este método se puede mejorar con un ComponentRegistry
    }

    return { current, canAdd, cannotAdd };
  }
}

export default Entity;
