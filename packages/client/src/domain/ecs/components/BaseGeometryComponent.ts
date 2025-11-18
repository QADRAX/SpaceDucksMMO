import { Component } from "../core/Component";
import type { ComponentMetadata } from "../core/ComponentMetadata";

export type Vector3Like = { x: number; y: number; z: number };

export abstract class BaseGeometryComponent extends Component {
  // concrete components should set their own `type` and `metadata`
  abstract getBoundingRadius(worldScale: Vector3Like): number;
}

export default BaseGeometryComponent;
