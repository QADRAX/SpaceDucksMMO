import { Transform } from "./Transform";
import { Component } from "./Component";
import BaseGeometryComponent from "../components/geometry/BaseGeometryComponent";
import { Result, ok, err } from '../../errors/EngineError';

type VoidResult = Result<void>;

export type ComponentEventAction = 'added' | 'removed';

export interface ComponentEvent {
  entity: Entity;
  component: Component;
  action: ComponentEventAction;
}

export type ComponentListener = (event: ComponentEvent) => void;

export class Entity {
  readonly id: string;
  readonly transform: Transform;
  private components = new Map<string, Component>();
  private _parent?: Entity;
  private children: Entity[] = [];
  private componentListeners: ComponentListener[] = [];
  /**
   * Per-entity flag to indicate whether debug transform helpers should be
   * rendered for this entity. Default: false (disabled).
   * Scene-level master switch may override this (see BaseScene).
   */
  private _debugTransformEnabled = false;
  private debugTransformListeners: Array<(enabled: boolean) => void> = [];

  /** Per-entity flag to indicate whether collider debug helpers should be rendered. Default: false. */
  private _debugColliderEnabled = false;
  private debugColliderListeners: Array<(enabled: boolean) => void> = [];

  constructor(id: string, position?: [number, number, number]) {
    this.id = id;
    this.transform = new Transform(position);
  }
  addComponent<T extends Component>(component: T): this {
    const res = this.safeAddComponent(component);
    if (!res.ok) {
      throw new Error(res.error.message);
    }
    return this;
  }
  removeComponent(type: string): void {
    const res = this.safeRemoveComponent(type);
    if (!res.ok) throw new Error(res.error.message);
  }

  // New: safe Result-based variants which return structured errors instead of throwing
  safeAddComponent<T extends Component>(component: T): VoidResult {
    const errors = this.validateComponent(component);
    if (errors.length) {
      const message =
        `Cannot add component '${component.type}' to entity '${this.id}':\n` +
        errors.map((e) => `  - ${e}`).join('\n');
      return err('invalid-component', message, { errors });
    }
    component.setEntityId(this.id);
    this.components.set(component.type, component);
    this.notifyComponentEvent(component, 'added');
    return ok(undefined);
  }

  safeRemoveComponent(type: string): VoidResult {
    const comp = this.components.get(type);
    if (!comp) return ok(undefined);
    const errors = this.validateRemoval(type);
    if (errors.length) {
      const message =
        `Cannot remove component '${type}' from entity '${this.id}':\n` +
        errors.map((e) => `  - ${e}`).join('\n');
      return err('invalid-component', message, { errors });
    }

    this.notifyComponentEvent(comp, 'removed');
    comp.notifyRemoved();
    this.components.delete(type);
    return ok(undefined);
  }

  getComponent<T extends Component = Component>(type: string): T | undefined {
    return this.components.get(type) as T | undefined;
  }

  hasComponent(type: string): boolean {
    return this.components.has(type);
  }

  getAllComponents(): Component[] {
    return [...this.components.values()];
  }

  addComponentListener(listener: ComponentListener): void {
    if (!this.componentListeners.includes(listener)) this.componentListeners.push(listener);
  }

  removeComponentListener(listener: ComponentListener): void {
    const i = this.componentListeners.indexOf(listener);
    if (i >= 0) this.componentListeners.splice(i, 1);
  }

  private notifyComponentEvent(component: Component, action: ComponentEventAction): void {
    const ev: ComponentEvent = { entity: this, component, action };
    for (const l of this.componentListeners) l(ev);
  }
  private validateComponent(component: Component): string[] {
    const errors: string[] = [];
    const meta = component.metadata;
    if (meta.unique && this.components.has(component.type))
      errors.push(`Component '${component.type}' is unique and already exists`);
    if (meta.requires)
      for (const r of meta.requires) {
        // special-case: 'geometry' requirement is satisfied by any concrete BaseGeometryComponent
        if (r === 'geometry') {
          const hasGeom = [...this.components.values()].some((c) => c instanceof BaseGeometryComponent);
          if (!hasGeom) errors.push(`Component '${component.type}' requires '${r}' component`);
        } else if (!this.components.has(r)) {
          errors.push(`Component '${component.type}' requires '${r}' component`);
        }
      }
    if (meta.conflicts)
      for (const c of meta.conflicts)
        if (this.components.has(c))
          errors.push(
            `Component '${component.type}' conflicts with existing '${c}' component`
          );
    if (typeof component.validate === "function")
      errors.push(...(component.validate(this) || []));
    return errors;
  }
  private validateRemoval(type: string): string[] {
    const errors: string[] = [];
    for (const c of this.components.values()) {
      const reqs = c.metadata.requires || [];
      for (const r of reqs) {
        // if the other component requires 'geometry' and we're removing a concrete geometry, block
        if (r === 'geometry') {
          const removed = this.components.get(type);
          if (removed && removed instanceof BaseGeometryComponent) {
            errors.push(`Component '${c.type}' requires '${r}'`);
          }
        } else if (r === type) {
          errors.push(`Component '${c.type}' requires '${type}'`);
        }
      }
    }
    return errors;
  }
  addChild(entity: Entity): void {
    if (entity._parent) entity._parent.removeChild(entity.id);
    entity._parent = this;
    this.children.push(entity);
    entity.transform.setParent(this.transform);
  }
  removeChild(id: string): void {
    const i = this.children.findIndex((c) => c.id === id);
    if (i >= 0) {
      const child = this.children[i];
      child._parent = undefined;
      child.transform.setParent(undefined);
      this.children.splice(i, 1);
    }
  }
  getChild(id: string): Entity | undefined {
    return this.children.find((c) => c.id === id);
  }
  getChildren(): Entity[] {
    return [...this.children];
  }
  get parent(): Entity | undefined {
    return this._parent;
  }
  update(dt: number): void {
    for (const comp of this.components.values()) {
      if ((comp as any).enabled === false) continue;
      comp.update(dt);
    }
    for (const child of this.children) child.update(dt);
  }

  /**
   * Enable or disable debug transform helpers for this entity.
   * Calling this will notify any listeners (e.g., the debug system) so
   * they can create/destroy or show/hide helpers accordingly.
   */
  setDebugTransformEnabled(enabled: boolean): void {
    if (this._debugTransformEnabled === enabled) return;
    this._debugTransformEnabled = enabled;
    for (const l of this.debugTransformListeners) {
      try {
        l(enabled);
      } catch (e) {
        /* swallow listener errors */
      }
    }
  }

  /** Returns whether debug transform helpers are enabled for this entity. */
  isDebugTransformEnabled(): boolean {
    return this._debugTransformEnabled;
  }

  /** Register a listener for debug flag changes. */
  addDebugTransformListener(listener: (enabled: boolean) => void): void {
    if (!this.debugTransformListeners.includes(listener)) this.debugTransformListeners.push(listener);
  }

  /** Enable or disable debug collider helpers for this entity. */
  setDebugColliderEnabled(enabled: boolean): void {
    if (this._debugColliderEnabled === enabled) return;
    this._debugColliderEnabled = enabled;
    for (const l of this.debugColliderListeners) {
      try {
        l(enabled);
      } catch {
        /* swallow listener errors */
      }
    }
  }

  /** Returns whether debug collider helpers are enabled for this entity. */
  isDebugColliderEnabled(): boolean {
    return this._debugColliderEnabled;
  }

  /** Register a listener for collider debug flag changes. */
  addDebugColliderListener(listener: (enabled: boolean) => void): void {
    if (!this.debugColliderListeners.includes(listener)) this.debugColliderListeners.push(listener);
  }

  /** Remove a previously registered collider debug flag listener. */
  removeDebugColliderListener(listener: (enabled: boolean) => void): void {
    const i = this.debugColliderListeners.indexOf(listener);
    if (i >= 0) this.debugColliderListeners.splice(i, 1);
  }

  /** Remove a previously registered debug flag listener. */
  removeDebugTransformListener(listener: (enabled: boolean) => void): void {
    const i = this.debugTransformListeners.indexOf(listener);
    if (i >= 0) this.debugTransformListeners.splice(i, 1);
  }
}

export default Entity;
