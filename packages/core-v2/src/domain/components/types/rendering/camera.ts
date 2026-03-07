import type { ComponentBase } from '../core';

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
