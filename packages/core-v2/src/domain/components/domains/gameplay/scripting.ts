import type {  ComponentBase  } from '../../../ecs';
import type {  ComponentSpec  } from '../../../types/../components';

/** Reference to an attached script with per-instance configuration. */
export interface ScriptReference {
  scriptId: string;
  enabled: boolean;
  properties: Record<string, unknown>;
}

/** Script container component. Array order defines execution order. */
export interface ScriptComponent extends ComponentBase<'script'> {
  scripts: ScriptReference[];
}

/** Script component spec. */
export const SCRIPT_SPEC: ComponentSpec<ScriptComponent> = {
  metadata: {
    type: 'script',
    label: 'Scripts',
    category: 'Scripting',
    icon: 'FileCode',
    unique: true,
    inspector: {
      fields: [
        {
          key: 'scripts',
          label: 'Scripts',
          type: 'object',
          description: 'Managed by custom editor UI.',
        },
      ],
    },
  },
  defaults: { scripts: [] },
};

/** All scripting specs keyed by type. */
export const SCRIPTING_SPECS = {
  script: SCRIPT_SPEC,
};
