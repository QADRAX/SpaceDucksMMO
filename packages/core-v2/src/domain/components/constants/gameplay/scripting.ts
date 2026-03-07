import type { ComponentSpec } from '../../types/core';
import type { ScriptComponent, ScriptReference } from '../../types/gameplay/scripting';

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
