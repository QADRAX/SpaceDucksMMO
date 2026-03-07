import type { ComponentBase } from '../../components';
import type { ComponentFieldPaths, ComponentFieldValue } from '../../components/fieldPaths';

/* eslint-disable @typescript-eslint/no-explicit-any --
   `any` in type parameters is required for conditional-type inference
   across covariant / contravariant positions. Value-level code uses
   `unknown` exclusively. */

/**
 * Given the accumulated component methods `TMethods` and a resolved
 * concrete component type `TComp`, narrows `setField`'s params so
 * that `fieldKey` autocompletes to the component's editable field paths.
 * All other methods are passed through unchanged.
 */
export type NarrowComponentScope<TMethods, TComp extends ComponentBase<any, any>> = {
    [K in keyof TMethods]: K extends 'setField'
    ? <P extends ComponentFieldPaths<TComp>>(params: {
        readonly fieldKey: P;
        readonly value: ComponentFieldValue<TComp, P>;
    }) => TMethods[K] extends (...args: any) => infer R ? R : never
    : TMethods[K];
};

/* eslint-enable @typescript-eslint/no-explicit-any */
