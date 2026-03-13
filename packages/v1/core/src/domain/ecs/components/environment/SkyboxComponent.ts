import { Component } from "../../core/Component";
import type { ComponentMetadata } from "../../core/ComponentMetadata";

/**
 * Scene skybox/background.
 *
 * Design:
 * - This is intended to be unique per scene (enforced by core scene validation via metadata).
 * - It references a web-core Resource key (kind: "skybox") which the renderer resolves at runtime.
 */
export class SkyboxComponent extends Component {
  readonly type = "skybox";

  readonly metadata: ComponentMetadata<SkyboxComponent> = {
    type: "skybox",
    label: "Skybox",
    description:
      "Scene background skybox. References a web-core resource key (kind: skybox). Only one skybox is allowed per scene.",
    category: "Rendering",
    icon: "Sun",
    unique: true,
    // Enforced at scene level by core using metadata.
    uniqueInScene: true,
    requires: [],
    conflicts: [
      // Skybox should not coexist with geometry on the same entity.
      "boxGeometry",
      "sphereGeometry",
      "planeGeometry",
      "cylinderGeometry",
      "coneGeometry",
      "torusGeometry",
      "customGeometry",
    ],
    inspector: {
      fields: [
        {
          key: "key",
          label: "Skybox Resource",
          type: "string",
          description: "Resource key for a skybox (web-core resource key).",
          default: "",
          get: (c) => c.key,
          set: (c, v) => {
            c.key = String(v ?? "");
            c.notifyChanged();
          },
        },
        {
          key: "enabled",
          label: "Enabled",
          type: "boolean",
          description: "Whether the skybox is enabled.",
          default: true,
          get: (c) => c.enabled,
          set: (c, v) => {
            c.enabled = Boolean(v);
          },
        },
      ],
    },
  };

  /** Web-core resource key (kind: skybox). */
  key: string;

  constructor(params?: { key?: string; enabled?: boolean }) {
    super();
    this.key = params?.key ?? "";
    this.enabled = params?.enabled ?? true;
  }
}

export default SkyboxComponent;
