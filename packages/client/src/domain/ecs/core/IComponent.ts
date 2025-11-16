import type { ComponentMetadata } from "./ComponentMetadata";

interface IComponent {
  readonly type: string;
  readonly metadata: ComponentMetadata;
  update(dt: number): void;
  validate?(entity: any): string[];
  notifyRemoved(): void;
}

export default IComponent;
