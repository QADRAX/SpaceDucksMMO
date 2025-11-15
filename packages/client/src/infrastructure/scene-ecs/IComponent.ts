export interface IComponent {
  /** Unique component type key */
  readonly type: string;
  /** Optional per-frame update */
  update?(dt: number): void;
}

export default IComponent;
