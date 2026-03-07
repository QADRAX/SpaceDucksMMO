import type {  ComponentBase  } from '../../../ecs';
import type {  ComponentSpec  } from '../../../types/../components';

/** Camera projection settings. */
export interface CameraViewComponent extends ComponentBase {
  type: 'cameraView';
  fov: number;
  near: number;
  far: number;
  aspect: number;
}

/** Single post-process effect descriptor. */
export interface PostProcessEffectDefinition {
  id: string;
  enabled: boolean;
  params: Readonly<Record<string, unknown>>;
}

/** Post-process chain attached to a camera entity. */
export interface PostProcessComponent extends ComponentBase {
  type: 'postProcess';
  effects: ReadonlyArray<PostProcessEffectDefinition>;
}

/** Union of camera-related components. */
export type CameraComponent = CameraViewComponent | PostProcessComponent;

/** Camera view spec. */
export const CAMERA_VIEW_SPEC: ComponentSpec<CameraViewComponent> = {
  metadata: {
    type: 'cameraView',
    label: 'Camera View',
    description: 'Perspective camera settings for rendering the scene.',
    category: 'Camera',
    icon: 'Camera',
    unique: true,
    inspector: {
      fields: [
        { key: 'fov', label: 'FOV', type: 'number', min: 1, max: 179, step: 1, unit: '°' },
        { key: 'near', label: 'Near', type: 'number', min: 0.001, step: 0.01 },
        { key: 'far', label: 'Far', type: 'number', min: 0.01, step: 1 },
        { key: 'aspect', label: 'Aspect', type: 'number', min: 0.1, step: 0.01 },
      ],
    },
  },
  defaults: { fov: 60, near: 0.1, far: 1000, aspect: 16 / 9 },
};

/** Post-process spec. */
export const POST_PROCESS_SPEC: ComponentSpec<PostProcessComponent> = {
  metadata: {
    type: 'postProcess',
    label: 'Post Process',
    description: 'Post-processing effect stack executed after camera rendering.',
    category: 'Camera',
    icon: 'Wand',
    unique: true,
    requires: ['cameraView'],
    inspector: {
      fields: [{ key: 'effects', label: 'Effects', type: 'object', description: 'Ordered list.' }],
    },
  },
  defaults: { effects: [] },
};

/** All camera specs keyed by type. */
export const CAMERA_SPECS = {
  cameraView: CAMERA_VIEW_SPEC,
  postProcess: POST_PROCESS_SPEC,
};
