import { Component } from "../../core/Component";
import type { ComponentType } from "../../core/ComponentType";

export abstract class BaseMaterialComponent extends Component {
  // marker base for all material components
  abstract readonly type: ComponentType;
  metadata = { type: 'BaseMaterial' };

}

export default BaseMaterialComponent;
