import type { ComponentSpec } from '../../types/core';
import type { CameraViewComponent, PostProcessComponent } from '../../types/rendering/camera';
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
