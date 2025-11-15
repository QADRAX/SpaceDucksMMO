import IComponent from './IComponent';

export class Entity {
  readonly id: string;
  private components = new Map<string, IComponent>();

  constructor(id: string) {
    this.id = id;
  }

  addComponent(component: IComponent): this {
    this.components.set(component.type, component);
    return this;
  }

  removeComponent(type: string): void {
    this.components.delete(type);
  }

  getComponent<T extends IComponent>(type: string): T | undefined {
    return this.components.get(type) as T | undefined;
  }

  update(dt: number): void {
    for (const comp of this.components.values()) {
      if (comp.update) comp.update(dt);
    }
  }
}

export default Entity;
