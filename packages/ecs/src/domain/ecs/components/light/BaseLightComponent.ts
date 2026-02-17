import { Component } from "../../core/Component";
import type { ComponentType } from '../../core/ComponentType';

/**
 * Base class for all light components.
 * Concrete light components must override `type` and `metadata`.
 */
export abstract class BaseLightComponent extends Component {
  abstract readonly type: ComponentType;
  // Shared helpers for lights could be added here later if needed.
}

export default BaseLightComponent;
