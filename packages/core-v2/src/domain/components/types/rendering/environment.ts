import type { ComponentBase } from '../core';

/** Scene-level skybox/environment map component. */
export interface SkyboxComponent extends ComponentBase<'skybox'> {
    key: string;
}
