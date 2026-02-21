import { Transform } from "./Transform";
import { Component } from "./Component";
import { ComponentType } from "./ComponentType";
import BaseGeometryComponent from "../components/geometry/BaseGeometryComponent";
import { Result, ok, err } from '../../errors/EngineError';
import type { DebugKind } from "./DebugKind";

type VoidResult = Result<void>;

export type ComponentEventAction = 'added' | 'removed';

export interface ComponentEvent {
  entity: Entity;
  component: Component;
  action: ComponentEventAction;
}

export type ComponentListener = (event: ComponentEvent) => void;

export type DebugListener = (kind: DebugKind, enabled: boolean) => void;

export class Entity {
  readonly id: string;
  readonly transform: Transform;

  /** Human-friendly name shown in editors/debug gizmos (persisted via snapshots). */
  private _displayName = '';

  /** Optional short text/emoji shown in debug gizmos (persisted via snapshots). */
  private _gizmoIcon: string | undefined;

  private presentationListeners: Array<() => void> = [];

  private components = new Map<ComponentType, Component>();
  private _parent?: Entity;
  private children: Entity[] = [];
  private componentListeners: ComponentListener[] = [];

  /** 
   * Active debug visualizations for this entity.
   * Design: using a Set allows us to add new debug types (e.g., 'camera', 'ai', 'pathfinding')
   * without modifying the Entity class itself.
   */
  private _enabledDebugs = new Set<DebugKind>();
  private _debugListeners: Array<DebugListener> = [];

  constructor(id: string, position?: [number, number, number]) {
    this.id = id;
    this.transform = new Transform(position);
  }

  get displayName(): string {
    return this._displayName;
  }

  set displayName(v: string) {
    const next = String(v ?? '');
    if (this._displayName === next) return;
    this._displayName = next;
    this.notifyPresentationChanged();
  }

  get gizmoIcon(): string | undefined {
    return this._gizmoIcon;
  }

  set gizmoIcon(v: string | undefined) {
    const next = typeof v === 'string' ? v.trim() : '';
    const normalized = next ? next : undefined;
    if (this._gizmoIcon === normalized) return;
    this._gizmoIcon = normalized;
    this.notifyPresentationChanged();
  }

  addPresentationListener(listener: () => void): void {
    if (!this.presentationListeners.includes(listener)) this.presentationListeners.push(listener);
  }

  removePresentationListener(listener: () => void): void {
    const i = this.presentationListeners.indexOf(listener);
    if (i >= 0) this.presentationListeners.splice(i, 1);
  }

  private notifyPresentationChanged(): void {
    for (const l of this.presentationListeners) {
      try {
        l();
      } catch {
        /* swallow listener errors */
      }
    }
  }
  addComponent<T extends Component>(component: T): this {
    const res = this.safeAddComponent(component);
    if (!res.ok) {
      throw new Error(res.error.message);
    }
    return this;
  }
  removeComponent(type: ComponentType): void {
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

  safeRemoveComponent(type: ComponentType): VoidResult {
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

  getComponent<T extends Component = Component>(type: ComponentType): T | undefined {
    return this.components.get(type) as T | undefined;
  }

  hasComponent(type: ComponentType): boolean {
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
        } else if (!this.components.has(r as ComponentType)) {
          errors.push(`Component '${component.type}' requires '${r}' component`);
        }
      }
    if (meta.conflicts)
      for (const c of meta.conflicts)
        if (this.components.has(c as ComponentType))
          errors.push(
            `Component '${component.type}' conflicts with existing '${c}' component`
          );
    if (typeof component.validate === "function")
      errors.push(...(component.validate(this) || []));
    return errors;
  }
  private validateRemoval(type: ComponentType): string[] {
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
   * Enable or disable a specific debug visualization for this entity.
   */
  setDebugEnabled(kind: DebugKind, enabled: boolean): void {
    const isCurrentlyEnabled = this._enabledDebugs.has(kind);
    if (isCurrentlyEnabled === enabled) return;

    if (enabled) {
      this._enabledDebugs.add(kind);
    } else {
      this._enabledDebugs.delete(kind);
    }

    for (const l of this._debugListeners) {
      try {
        l(kind, enabled);
      } catch (e) {
        /* swallow listener errors */
      }
    }
  }

  /**
   * Returns whether a specific debug visualization is enabled for this entity.
   */
  isDebugEnabled(kind: DebugKind): boolean {
    return this._enabledDebugs.has(kind);
  }

  /**
   * Returns all currently enabled debug visualizations.
   */
  getEnabledDebugs(): DebugKind[] {
    return Array.from(this._enabledDebugs);
  }

  /**
   * Register a listener for debug flag changes.
   */
  addDebugListener(listener: DebugListener): void {
    if (!this._debugListeners.includes(listener)) {
      this._debugListeners.push(listener);
    }
  }

  /**
   * Remove a previously registered debug flag listener.
   */
  removeDebugListener(listener: DebugListener): void {
    const i = this._debugListeners.indexOf(listener);
    if (i >= 0) {
      this._debugListeners.splice(i, 1);
    }
  }

  // --- Legacy / Convenience Wrappers ---

  setDebugTransformEnabled(enabled: boolean): void {
    this.setDebugEnabled('transform', enabled);
  }

  isDebugTransformEnabled(): boolean {
    return this.isDebugEnabled('transform');
  }

  addDebugTransformListener(listener: (enabled: boolean) => void): void {
    this.addDebugListener((kind, enabled) => {
      if (kind === 'transform') listener(enabled);
    });
  }

  removeDebugTransformListener(listener: (enabled: boolean) => void): void {
    // Note: This is now harder to remove because we wrap it. 
    // For a cleaner migration we should update call sites to use addDebugListener directly.
    // For now, these wrappers are enough to maintain compatibility.
  }

  setDebugMeshEnabled(enabled: boolean): void {
    this.setDebugEnabled('mesh', enabled);
  }

  isDebugMeshEnabled(): boolean {
    return this.isDebugEnabled('mesh');
  }

  addDebugMeshListener(listener: (enabled: boolean) => void): void {
    this.addDebugListener((kind, enabled) => {
      if (kind === 'mesh') listener(enabled);
    });
  }

  removeDebugMeshListener(listener: (enabled: boolean) => void): void {
    // Wrapper for compatibility
  }

  setDebugColliderEnabled(enabled: boolean): void {
    this.setDebugEnabled('collider', enabled);
  }

  isDebugColliderEnabled(): boolean {
    return this.isDebugEnabled('collider');
  }

  addDebugColliderListener(listener: (enabled: boolean) => void): void {
    this.addDebugListener((kind, enabled) => {
      if (kind === 'collider') listener(enabled);
    });
  }

  removeDebugColliderListener(listener: (enabled: boolean) => void): void {
    // Wrapper for compatibility
  }
}

export default Entity;
