import type { ComponentSpec } from '../../types/core';
import type { UiCustomComponent } from '../../types/ui';

/** Custom UI component spec (resource-backed SPA / app). */
export const UI_CUSTOM_SPEC: ComponentSpec<UiCustomComponent> = {
  metadata: {
    type: 'uiCustom',
    label: 'UI Custom',
    description: 'Custom UI resource mounted in the entity transform2d root box.',
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
          description: 'ResourceRef to a spa (custom UI entry) asset.',
        },
        {
          key: 'props',
          label: 'Props',
          type: 'object',
          description: 'Generic key→value props injected into the custom UI (YAML + Lua).',
        },
        {
          key: 'uiTarget',
          label: 'UI Target',
          type: 'object',
          description: 'Viewport filter (viewportIds / cameraIds / cameraTags). Empty = all.',
        },
      ],
    },
  },
  defaults: {
    spa: null,
    props: {},
    uiTarget: {},
  },
};
