import type {  ComponentBase  } from '../../../ecs';
import type {  ComponentSpec  } from '../../../types/../components';

/** Scene-level skybox/environment map component. */
export interface SkyboxComponent extends ComponentBase<'skybox'> {
  key: string;
}

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
      fields: [{ key: 'key', label: 'Key', type: 'string' }],
    },
  },
  defaults: { key: '' },
};

/** All environment specs keyed by type. */
export const ENVIRONMENT_SPECS = {
  skybox: SKYBOX_SPEC,
};
