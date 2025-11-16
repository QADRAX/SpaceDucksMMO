export interface IComponentObserver {
  onComponentChanged(entityId: string, componentType: string): void;
}

export default IComponentObserver;