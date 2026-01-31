import { Component } from "../../core/Component";

/**
 * Base class for all light components.
 * Concrete light components must override `type` and `metadata`.
 */
export abstract class BaseLightComponent extends Component {
  abstract readonly type: string;
  // Shared helpers for lights could be added here later if needed.
}

export default BaseLightComponent;
