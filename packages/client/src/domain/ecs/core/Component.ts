import { ComponentMetadata } from "./ComponentMetadata";
import IComponent from "./IComponent";
import IComponentObserver from "./IComponentObserver";


export abstract class Component implements IComponent {
  abstract readonly type: string;
  abstract readonly metadata: ComponentMetadata;
  protected entityId?: string;
  protected observers: IComponentObserver[] = [];

  addObserver(observer: IComponentObserver): void {
    if (!this.observers.includes(observer)) this.observers.push(observer);
  }
  removeObserver(observer: IComponentObserver): void {
    const i = this.observers.indexOf(observer);
    if (i >= 0) this.observers.splice(i, 1);
  }
  protected notifyChanged(): void {
    if (!this.entityId) return;
    for (const o of this.observers) o.onComponentChanged(this.entityId, this.type);
  }
  setEntityId(id: string): void { this.entityId = id; }
  update(dt: number): void { /* optional override */ }
  validate?(entity: any): string[];
}

export default Component;