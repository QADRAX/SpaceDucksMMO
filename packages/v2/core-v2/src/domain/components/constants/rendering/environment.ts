import type { ComponentSpec } from '../../types/core';
import type { SkyboxComponent } from '../../types/rendering/environment';
/** Skybox spec. */
export const SKYBOX_SPEC: ComponentSpec<SkyboxComponent> = {
  metadata: {
    type: 'skybox',
    label: 'Skybox',
    category: 'Rendering',
    icon: 'Sun',
    unique: true,
    uniqueInScene: true,
    conflicts: [
      'boxGeometry',
      'sphereGeometry',
      'planeGeometry',
      'cylinderGeometry',
      'coneGeometry',
      'torusGeometry',
      'customGeometry',
    ],
    inspector: {
      fields: [{ key: 'skybox', label: 'Skybox Resource', type: 'reference' }],
    },
  },
  defaults: { skybox: undefined as any },
};

/** All environment specs keyed by type. */
export const ENVIRONMENT_SPECS = {
  skybox: SKYBOX_SPEC,
};
