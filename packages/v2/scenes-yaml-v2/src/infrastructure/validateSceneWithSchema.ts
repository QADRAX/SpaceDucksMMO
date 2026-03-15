/**
 * Infrastructure: validate against JSON Schema using ajv.
 * Schema is embedded at build time (no fs) — compatible with browser/React SPA.
 */
import Ajv from 'ajv';
import { err, type Result } from '@duckengine/core-v2';
import type { SceneDefinition } from '../domain/sceneDefinition';
import { validateSceneDefinition } from '../domain/validation';
import { SCENE_SCHEMA } from './scene.schema.generated';

/** Path to the schema JSON file (for VS Code, CI). */
export const SCENE_SCHEMA_PATH = './res/scene.schema.json';

/**
 * Validates data against the generated JSON Schema.
 * Uses embedded schema — works in Node and browser.
 */
export function validateSceneWithSchema(data: unknown): Result<SceneDefinition> {
  const runtimeResult = validateSceneDefinition(data);
  if (!runtimeResult.ok) return runtimeResult;

  const schema = SCENE_SCHEMA;

  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (!valid && validate.errors?.length) {
    const first = validate.errors[0];
    const errPath =
      first.instancePath ||
      (first.params as { missingProperty?: string })?.missingProperty ||
      'root';
    return err('validation', `${errPath}: ${first.message}`, {
      errors: validate.errors,
    });
  }

  return runtimeResult;
}
