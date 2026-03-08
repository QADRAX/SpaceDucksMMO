import type { ComponentBase } from '../core';
import type { ResourceRef } from '../../../resources';

/** Scene-level skybox/environment map component. */
export interface SkyboxComponent extends ComponentBase<'skybox', SkyboxComponent> {
    /** Reference to the 5-face skybox resource. */
    skybox: ResourceRef<'skybox'>;
}
