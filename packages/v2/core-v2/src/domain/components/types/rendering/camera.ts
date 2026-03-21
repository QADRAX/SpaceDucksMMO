import type { ComponentBase } from '../core';

/** Perspective camera (matches typical game / glTF perspective). */
export interface CameraPerspectiveComponent extends ComponentBase<'cameraPerspective', CameraPerspectiveComponent> {
    fov: number;
    aspect: number;
    near: number;
    far: number;
}

/** Orthographic camera (glTF orthographic; half-height + aspect defines frustum width). */
export interface CameraOrthographicComponent extends ComponentBase<'cameraOrthographic', CameraOrthographicComponent> {
    /** Half height of the view volume at the near plane (world units); width = halfHeight × aspect. */
    halfHeight: number;
    aspect: number;
    near: number;
    far: number;
}

/** Single post-process effect descriptor. */
export interface PostProcessEffectDefinition {
    id: string;
    enabled: boolean;
    params: Readonly<Record<string, unknown>>;
}

/** Post-process chain attached to a camera entity. */
export interface PostProcessComponent extends ComponentBase<'postProcess', PostProcessComponent> {
    effects: ReadonlyArray<PostProcessEffectDefinition>;
}

/** Union of camera-related components. */
export type CameraComponent = CameraPerspectiveComponent | CameraOrthographicComponent | PostProcessComponent;
