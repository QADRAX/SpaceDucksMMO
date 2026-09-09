import type { ComponentSpec } from '../../types/core';
import type { UiSpaComponent } from '../../types/ui';

/** Custom SPA UI component spec. */
export const UI_SPA_SPEC: ComponentSpec<UiSpaComponent> = {
  metadata: {
    type: 'uiSpa',
    label: 'UI SPA',
    description: 'Custom SPA resource mounted in the entity transform2d root box.',
    category: 'UI',
    icon: 'AppWindow',
    unique: true,
    requires: ['transform2d'],
    conflicts: ['uiView'],
    inspector: {
      fields: [
        {
          key: 'spa',
          label: 'SPA',
          type: 'resource',
          description: 'ResourceRef to a spa asset.',
        },
        {
          key: 'props',
          label: 'Props',
          type: 'object',
          description: 'Instance props (YAML + Lua UI.setProps).',
        },
      ],
    },
  },
  defaults: {
    spa: null,
    props: {},
  },
};
