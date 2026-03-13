import { Component } from "../../core/Component";

export type Vector3Like = { x: number; y: number; z: number };

export abstract class BaseGeometryComponent extends Component {
  // concrete components should set their own `type` and `metadata`

  /** Whether the mesh created for this geometry should cast shadows. */
  castShadow?: boolean;

  /** Whether the mesh created for this geometry should receive shadows. */
  receiveShadow?: boolean;

  abstract getBoundingRadius(worldScale: Vector3Like): number;
}

export default BaseGeometryComponent;
