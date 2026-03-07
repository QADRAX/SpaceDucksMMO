import type { ComponentMetadata } from '../types/componentMetadata';
import type {
  ComponentByType,
  ComponentCreateParams,
  CreatableComponentType,
} from './componentFactoryTypes';
import { LIGHT_SPECS } from './domains/rendering/light';
import { MATERIAL_SPECS } from './domains/rendering/material';
import { SHADER_MATERIAL_SPECS } from './domains/rendering/shaderMaterial';
import { GEOMETRY_SPECS } from './domains/rendering/geometrySpecs';
import { CAMERA_SPECS } from './domains/rendering/camera';
import { TEXTURE_SPECS } from './domains/rendering/texture';
import { EFFECT_SPECS } from './domains/rendering/effects';
import { ENVIRONMENT_SPECS } from './domains/rendering/environment';
import { PHYSICS_SPECS } from './domains/physics/physicsSpecs';
import { IDENTITY_SPECS } from './domains/gameplay/identity';
import { SCRIPTING_SPECS } from './domains/gameplay/scripting';

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
  ...TEXTURE_SPECS,
  ...LIGHT_SPECS,
  ...EFFECT_SPECS,
  ...ENVIRONMENT_SPECS,
  ...PHYSICS_SPECS,
  ...SCRIPTING_SPECS,
};

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
