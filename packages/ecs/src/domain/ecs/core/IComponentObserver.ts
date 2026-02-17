import { ComponentType } from "./ComponentType";

export interface IComponentObserver {
  onComponentChanged(entityId: string, componentType: ComponentType): void;
  onComponentRemoved(entityId: string, componentType: ComponentType): void;
}

export default IComponentObserver;
