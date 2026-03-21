import type { ComponentMetadata } from './types';
import type {
  ComponentByType,
  ComponentCreateParams,
  CreatableComponentType,
} from './types/factory';
import { LIGHT_SPECS } from './constants/rendering/light';
import { MATERIAL_SPECS } from './constants/rendering/material';
import { SHADER_MATERIAL_SPECS } from './constants/rendering/shaderMaterial';
import { GEOMETRY_SPECS } from './constants/rendering/geometrySpecs';
import { CAMERA_SPECS } from './constants/rendering/camera';
import { RIGGING_SPECS } from './constants/rendering/rigging';
import { TEXTURE_SPECS } from './constants/rendering/texture';
import { EFFECT_SPECS } from './constants/rendering/effects';
import { ENVIRONMENT_SPECS } from './constants/rendering/environment';
import { PHYSICS_SPECS } from './constants/physics/physicsSpecs';
import { IDENTITY_SPECS } from './constants/gameplay/identity';
import { SCRIPTING_SPECS } from './constants/gameplay/scripting';

/** Central registry of all component specs (metadata + defaults). */
const COMPONENT_SPECS: {
  [T in CreatableComponentType]: {
    metadata: ComponentMetadata<ComponentByType[T]>;
    defaults: Record<string, unknown>;
  };
} = {
  ...IDENTITY_SPECS,
  ...GEOMETRY_SPECS,
  ...MATERIAL_SPECS,
  ...SHADER_MATERIAL_SPECS,
  ...CAMERA_SPECS,
  ...RIGGING_SPECS,
  ...TEXTURE_SPECS,
  ...LIGHT_SPECS,
  ...EFFECT_SPECS,
  ...ENVIRONMENT_SPECS,
  ...PHYSICS_SPECS,
  ...SCRIPTING_SPECS,
};

/** All creatable component types (excludes metadata). */
export const CREATABLE_COMPONENT_TYPES = Object.keys(
  COMPONENT_SPECS,
) as CreatableComponentType[];

/** Creates any component from its type discriminator and optional overrides. */
export function createComponent<T extends CreatableComponentType>(
  type: T,
  overrides?: ComponentCreateParams[T],
): ComponentByType[T] {
  const spec = COMPONENT_SPECS[type];
  return {
    type,
    enabled: true,
    metadata: spec.metadata,
    ...spec.defaults,
    ...(overrides ?? {}),
  } as ComponentByType[T];
}

/** Returns the metadata for a given component type. */
export function getComponentMetadata<T extends CreatableComponentType>(
  type: T,
): ComponentMetadata<ComponentByType[T]> {
  return COMPONENT_SPECS[type].metadata;
}
