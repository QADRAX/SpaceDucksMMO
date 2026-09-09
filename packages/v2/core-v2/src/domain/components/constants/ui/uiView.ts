import type { ComponentSpec } from '../../types/core';
import type { UiViewComponent } from '../../types/ui';

/** Duck UI view document component spec. */
export const UI_VIEW_SPEC: ComponentSpec<UiViewComponent> = {
  metadata: {
    type: 'uiView',
    label: 'UI View',
    description: 'Duck UI document (view tree) mounted in the entity transform2d root box.',
    category: 'UI',
    icon: 'Layout',
    unique: true,
    requires: ['transform2d'],
    conflicts: ['uiSpa'],
    inspector: {
      fields: [
        {
          key: 'document',
          label: 'Document',
          type: 'object',
          description: 'Inline UiNode tree or uiDocument resource ref.',
        },
        {
          key: 'bindings',
          label: 'Bindings',
          type: 'object',
          description: 'Serializable data bindings for the view.',
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
    document: null,
    bindings: {},
    uiTarget: {},
  },
};
