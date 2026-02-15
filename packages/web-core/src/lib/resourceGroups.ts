import {
  CUSTOM_MESH_RESOURCE_KINDS,
  ECS_TREE_RESOURCE_KINDS,
  MATERIAL_RESOURCE_KINDS,
  type EcsTreeResourceKind,
  type MaterialResourceKind,
} from '@/lib/types';

export type ResourceGroup = {
  id: string;
  label: string;
  /** All resource.kind values that belong to this group */
  kinds: readonly string[];
  /** Optional per-kind labels for nicer UI */
  kindLabels?: Partial<Record<string, string>>;
};

export const RESOURCE_GROUPS: readonly ResourceGroup[] = [
  {
    id: 'materials',
    label: 'Materials',
    kinds: MATERIAL_RESOURCE_KINDS,
    kindLabels: {
      basicMaterial: 'Basic Material',
      lambertMaterial: 'Lambert Material',
      phongMaterial: 'Phong Material',
      standardMaterial: 'Standard Material',
    } satisfies Record<MaterialResourceKind, string>,
  },
  {
    id: 'meshes',
    label: 'Meshes',
    kinds: CUSTOM_MESH_RESOURCE_KINDS,
    kindLabels: {
      customMesh: 'Custom Mesh (GLB)',
    },
  },
  {
    id: 'ecs',
    label: 'ECS',
    kinds: ECS_TREE_RESOURCE_KINDS,
    kindLabels: {
      prefab: 'Prefabs',
      scene: 'Scenes',
    } satisfies Record<EcsTreeResourceKind, string>,
  },
] as const;

export function getResourceGroup(groupId: string): ResourceGroup | null {
  return RESOURCE_GROUPS.find((g) => g.id === groupId) ?? null;
}

export function getKindLabel(group: ResourceGroup, kind: string): string {
  const explicit = group.kindLabels?.[kind];
  if (explicit) return explicit;

  const withSpaces = kind.replace(/([a-z])([A-Z])/g, '$1 $2');
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

export function isKindInGroup(group: ResourceGroup, kind: string): boolean {
  return group.kinds.includes(kind);
}
