import { Transform } from "./Transform";
import { Component } from "./Component";
import { Result, ok, err } from '@client/domain/errors/EngineError';

type VoidResult = Result<void>;

export class Entity {
  readonly id: string;
  readonly transform: Transform;
  private components = new Map<string, Component>();
  private _parent?: Entity;
  private children: Entity[] = [];

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
    // notify observers registered on the component that it's being removed
    comp.notifyRemoved();
    this.components.delete(type);
    return ok(undefined);
  }
  getComponent<T extends Component>(type: string): T | undefined {
    return this.components.get(type) as T | undefined;
  }
  hasComponent(type: string): boolean {
    return this.components.has(type);
  }
  getAllComponents(): Component[] {
    return [...this.components.values()];
  }
  private validateComponent(component: Component): string[] {
    const errors: string[] = [];
    const meta = component.metadata;
    if (meta.unique && this.components.has(component.type))
      errors.push(`Component '${component.type}' is unique and already exists`);
    if (meta.requires)
      for (const r of meta.requires)
        if (!this.components.has(r))
          errors.push(
            `Component '${component.type}' requires '${r}' component`
          );
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
    for (const c of this.components.values())
      if (c.metadata.requires?.includes(type))
        errors.push(`Component '${c.type}' requires '${type}'`);
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
}

export default Entity;
