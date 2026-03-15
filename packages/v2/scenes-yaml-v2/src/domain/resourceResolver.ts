/**
 * Resolves resource shorthand (string keys) to component field overrides.
 * Maps prefixes (materials/, textures/, meshes/, etc.) to ResourceRef fields.
 */
import type { ResourceKind } from '@duckengine/core-v2';
import {
  createResourceRef,
  createResourceKey,
  getComponentMetadata,
  inferResourceKindFromInspectorField,
} from '@duckengine/core-v2';
import type { ComponentType, CreatableComponentType } from '@duckengine/core-v2';

/** Infer ResourceKind from resource key prefix. */
export function inferResourceKindFromKey(key: string): ResourceKind | null {
  if (key.startsWith('materials/')) return 'standardMaterial'; // default material kind
  if (key.startsWith('textures/')) return 'texture';
  if (key.startsWith('meshes/')) return 'mesh';
  if (key.startsWith('skyboxes/')) return 'skybox';
  if (key.startsWith('scripts/') || key.startsWith('builtin://') || key.startsWith('test://'))
    return 'script';
  return null;
}

/** Infer the target field key for a component type when given a resource key. */
export function inferFieldKeyForResourceKey(
  componentType: ComponentType,
  resourceKey: string,
): string | null {
  const kind = inferResourceKindFromKey(resourceKey);
  if (!kind) return null;

  const meta = getComponentMetadata(componentType as CreatableComponentType);
  const fields = meta.inspector?.fields ?? [];
  for (const field of fields) {
    const fieldType = (field as { type?: string }).type;
    const fieldKey = (field as { key: string }).key;
    const inferred = inferResourceKindFromInspectorField(componentType, fieldKey, fieldType);
    if (inferred === kind) return fieldKey;
    // resource type: material field matches material component type
    if (fieldType === 'resource' && kind === componentType) return fieldKey;
    if (fieldType === 'reference' && fieldKey === 'skybox' && kind === 'skybox') return fieldKey;
    if (fieldType === 'reference' && fieldKey === 'mesh' && kind === 'mesh') return fieldKey;
    if (fieldType === 'texture' && kind === 'texture') return fieldKey;
  }
  return null;
}

/**
 * Resolve a shorthand string to a ResourceRef for a given component type.
 * Returns the field key and the ResourceRef value.
 */
export function resolveShorthandToResourceRef(
  componentType: ComponentType,
  shorthand: string,
): { fieldKey: string; value: unknown } | null {
  const fieldKey = inferFieldKeyForResourceKey(componentType, shorthand);
  if (!fieldKey) return null;

  let kind: ResourceKind | null = inferResourceKindFromKey(shorthand);
  if (!kind) return null;

  // For material components, the material field expects the same kind as the component
  const meta = getComponentMetadata(componentType as CreatableComponentType);
  const field = meta.inspector?.fields?.find((f: { key: string }) => f.key === fieldKey) as
    | { type?: string }
    | undefined;
  if (field?.type === 'resource') {
    kind = componentType as ResourceKind;
  }

  const ref = createResourceRef(createResourceKey(shorthand), kind);
  return { fieldKey, value: ref };
}

/**
 * For script component: shorthand "builtin://x" or "scripts/x" becomes ScriptReference.
 */
export function resolveScriptShorthand(
  shorthand: string,
): { scriptId: string; enabled: boolean; properties: Record<string, unknown> } {
  const scriptId =
    shorthand.startsWith('builtin://') || shorthand.startsWith('test://')
      ? shorthand
      : shorthand.startsWith('scripts/')
        ? shorthand
        : `scripts/${shorthand}`;
  return { scriptId, enabled: true, properties: {} };
}
