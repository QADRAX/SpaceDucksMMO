import type { ResourceKind } from '../resources';
import { CREATABLE_COMPONENT_TYPES, getComponentMetadata } from './factory';
import type { ComponentType, InspectorFieldConfig, InspectorFieldType } from './types';

/**
 * Inspector field keys that hold resource references (ResourceRef).
 * Derived from component specs at runtime — single source of truth.
 */
export const RESOURCE_FIELD_KEYS: readonly string[] = (() => {
    const keys = new Set<string>();
    for (const type of CREATABLE_COMPONENT_TYPES) {
        const meta = getComponentMetadata(type);
        for (const field of meta.inspector?.fields ?? []) {
            const ft = (field as InspectorFieldConfig).type;
            if (ft === 'resource' || ft === 'reference') keys.add((field as InspectorFieldConfig).key);
        }
    }
    return [...keys];
})();

export type ResourceFieldKey = (typeof RESOURCE_FIELD_KEYS)[number];

/**
 * Infers the ResourceKind for a given inspector field based on component type,
 * field key, and field type. Returns null if the field does not reference a resource.
 */
export function inferResourceKindFromInspectorField(
    componentType: ComponentType,
    fieldKey: ResourceFieldKey | string,
    fieldType: InspectorFieldType | string | undefined,
): ResourceKind | null {
    if (!fieldType) return null;
    if (fieldType === 'texture') return 'texture';
    if (fieldType === 'resource' && fieldKey === 'material') return componentType as ResourceKind;
    if (fieldType === 'reference' && fieldKey === 'skybox') return 'skybox';
    if (fieldType === 'reference' && fieldKey === 'mesh') return 'mesh';
    if (fieldType === 'reference' && fieldKey === 'skeleton') return 'skeleton';
    return null;
}

/**
 * Infers ResourceKind from an inspector field config. Convenience overload.
 */
export function inferResourceKindFromFieldConfig(
    componentType: ComponentType,
    field: InspectorFieldConfig,
): ResourceKind | null {
    return inferResourceKindFromInspectorField(componentType, field.key, field.type);
}
