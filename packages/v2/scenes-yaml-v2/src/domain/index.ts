/** Domain: scene definition types, validation, schema, resource resolution. Solo core-v2. */
export type {
  SceneDefinition,
  EntityDefinition,
  TransformDefinition,
  Transform2dDefinition,
  ComponentsDefinition,
  ComponentValueYaml,
  Vec3Like,
  Vec2Like,
} from './sceneDefinition';

export { validateSceneDefinition } from './validation';
export type { ValidationError } from './validation';

export {
  inferResourceKindFromKey,
  inferFieldKeyForResourceKey,
  resolveShorthandToResourceRef,
  resolveScriptShorthand,
} from './resourceResolver';

export { buildComponentOverrides } from './buildComponentOverrides';
export { applyTransformToEntity } from './applyTransform';
export { applyTransform2dToEntity } from './applyTransform2d';

export { buildJsonSchemaFromSpecs } from './schemaGenerator';
