import { Component } from "../core/Component";
import type { ComponentMetadata } from "../core/ComponentMetadata";

export interface PostProcessEffectDefinition {
  name: string;
  type: string;
  enabled: boolean;
  parameters?: Record<string, any>;
}

export class PostProcessComponent extends Component {
  readonly type = "postProcess";
  readonly metadata: ComponentMetadata = {
    type: "postProcess",
    label: "Post Process Effects",
    description: "Applies post-processing effects to the camera view, such as filters and visual enhancements.",
    category: "Rendering",
    icon: "Filter",
    unique: true,
    requires: ["cameraView"],
    conflicts: [],
    inspector: {
      fields: [
          {
            key: "effects",
            label: "Effects",
            type: "object",
            description: "List of post-processing effects to apply.",
            get: (c: PostProcessComponent) => c.effects,
          },
      ],
    },
  };
  effects: PostProcessEffectDefinition[];
  constructor(effects: PostProcessEffectDefinition[]) {
    super();
    this.effects = effects;
  }
  setEffects(e: PostProcessEffectDefinition[]) {
    this.effects = e;
    this.notifyChanged();
  }
}

export default PostProcessComponent;
