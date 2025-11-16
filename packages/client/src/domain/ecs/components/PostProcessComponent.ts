import { Component } from '../core/Component';
import type { ComponentMetadata } from '../core/ComponentMetadata';

export interface PostProcessEffectDefinition { name: string; type: string; enabled: boolean; parameters?: Record<string, any>; }

export class PostProcessComponent extends Component {
  readonly type = 'postProcess';
  readonly metadata: ComponentMetadata = { type: 'postProcess', unique: true, requires: ['cameraView'], conflicts: [] };
  effects: PostProcessEffectDefinition[];
  constructor(effects: PostProcessEffectDefinition[]) { super(); this.effects = effects; }
  setEffects(e: PostProcessEffectDefinition[]){ this.effects = e; this.notifyChanged(); }
}

export default PostProcessComponent;