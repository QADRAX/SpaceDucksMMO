import type {
    ComponentBase,
    ComponentFieldPaths,
    ComponentFieldValue,
} from '../../domain/components';
import type { Result } from '../../domain/utils';
import { err, ok } from '../../domain/utils';
import { validateFieldValue } from '../../domain/components/fieldValidation';
import { setFieldValue } from '../../domain/components/resolveFieldPath';
import { defineComponentUseCase } from '../../domain/useCases';

/**
 * Parameters for the setComponentField use case.
 *
 * @template TComponent - The concrete component type.
 * @template P          - The specific field path (used for typing value).
 */
export interface SetComponentFieldParams<
    TComponent extends ComponentBase<any, any> = ComponentBase<any, any>,
    P extends ComponentFieldPaths<TComponent> = any,
> {
    /** Inspector field key (supports dot-notation, e.g. `'halfExtents.x'`). */
    readonly fieldKey: P;
    /** Value to assign to the field. */
    readonly value: ComponentFieldValue<TComponent, P>;
}

/**
 * Sets a single field on a component after validating against
 * the inspector metadata constraints (type, min/max, enum options, nullable).
 *
 * Resolution order for applying the value:
 * 1. If the field declares a `set` accessor → uses it.
 * 2. Otherwise → sets via dot-notation path resolution.
 *
 * Returns `err('not-found', ...)` if the field key is not in the inspector,
 * or `err('validation', ...)` if the value fails constraint checks.
 */
export const setComponentField = defineComponentUseCase<
    ComponentBase<any, any>,
    SetComponentFieldParams<ComponentBase<any, any>>,
    Result<void>
>({
    name: 'setComponentField',
    execute(component, { fieldKey, value }) {
        const inspector = component.metadata.inspector;
        if (!inspector) {
            return err('not-found', `Component '${component.type}' has no inspector metadata.`);
        }

        const field = inspector.fields.find((f) => f.key === fieldKey);

        if (!field) {
            return err(
                'not-found',
                `Field '${fieldKey}' not found in component '${component.type}' inspector.`,
            );
        }

        // Validate against inspector constraints
        const validation = validateFieldValue(field, value);
        if (!validation.ok) return validation;

        // Apply the value
        if (field.set) {
            field.set(component, value);
        } else {
            setFieldValue(component, fieldKey, value);
        }

        return ok(undefined);
    },
});
