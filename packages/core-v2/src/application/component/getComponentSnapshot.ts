import type { ComponentBase, ComponentType } from '../../domain/components';
import { defineComponentUseCase } from '../../domain/useCases';

/**
 * Returns a frozen, readonly snapshot of the component.
 *
 * The snapshot carries the concrete type fields (e.g. `mass`, `bodyType`
 * for a `rigidBody`). Consumers can narrow via the `type` discriminator:
 *
 * ```ts
 * const snap = api.scene('main').entity('e1').component('rigidBody').snapshot();
 * if (snap.ok && snap.value.type === 'rigidBody') {
 *   console.log(snap.value.mass); // fully typed
 * }
 * ```
 */
export const getComponentSnapshot = defineComponentUseCase<
    ComponentBase<ComponentType, any>,
    void,
    Readonly<ComponentBase>
>({
    name: 'getComponentSnapshot',
    execute(component) {
        return Object.freeze({ ...component });
    },
});
