import { Component } from "../../core/Component";
import type { ComponentMetadata } from "../../core/ComponentMetadata";
import type { ComponentType } from "../../core/ComponentType";

export abstract class BaseMaterialComponent extends Component {
  // marker base for all material components
  abstract readonly type: ComponentType;
  abstract readonly metadata: ComponentMetadata;
}

export default BaseMaterialComponent;
