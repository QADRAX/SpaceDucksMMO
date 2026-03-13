import type { ComponentBase } from '../core';

/** Display name component used for scene/editor identity. */
export interface NameComponent extends ComponentBase<'name', NameComponent> {
    value: string;
}
