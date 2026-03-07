import type { ComponentBase } from './types/core';
import type { CreatableComponentType, ComponentByType } from './types/factory';

/**
 * Readonly snapshot of a specific component, typed by its discriminator.
 * Analogous to `EntityView` / `TransformView` at API boundaries.
 */
export type ComponentView<T extends CreatableComponentType = CreatableComponentType> =
    Readonly<ComponentByType[T]>;

/**
 * Creates a frozen, typed snapshot of a component for external consumers.
 * The returned object is a shallow copy with `Object.freeze` applied.
 */
export function createComponentView<T extends CreatableComponentType>(
    component: ComponentByType[T],
): ComponentView<T> {
    return Object.freeze({ ...component }) as ComponentView<T>;
}

/**
 * Creates a frozen snapshot from a generic `ComponentBase`.
 * The consumer can narrow the type via the `type` discriminator field.
 */
export function createComponentViewFromBase(
    component: ComponentBase,
): Readonly<ComponentBase> {
    return Object.freeze({ ...component });
}
