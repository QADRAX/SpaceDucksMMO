/**
 * Infrastructure: load scene from YAML string.
 * Uses js-yaml (external dep). Orchestrates domain + application.
 */
import yaml from 'js-yaml';
import type { DuckEngineAPI, SceneId } from '@duckengine/core-v2';
import { err, ok, type Result } from '@duckengine/core-v2';
import { validateSceneDefinition } from '../domain/validation';
import type { SceneDefinition } from '../domain/sceneDefinition';
import { buildEntitiesFromDefinition } from '../application/buildEntitiesFromDefinition';

/**
 * Parse and validate YAML only. Use for tests that want to fail before loading.
 */
export function parseAndValidateSceneYaml(yamlStr: string): Result<SceneDefinition> {
  let data: unknown;
  try {
    data = yaml.load(yamlStr);
  } catch (e) {
    return err('validation', `YAML parse error: ${(e as Error).message}`);
  }
  return validateSceneDefinition(data);
}

/**
 * Full load: parse, validate, add entities to scene.
 * Synchronous; resource loading is handled by the resource coordinator when entities are added.
 */
export function loadSceneFromYaml(
  api: DuckEngineAPI,
  sceneId: SceneId,
  yamlStr: string,
): Result<void> {
  const parseResult = parseAndValidateSceneYaml(yamlStr);
  if (!parseResult.ok) return parseResult;

  const buildResult = buildEntitiesFromDefinition(parseResult.value);
  if (!buildResult.ok) return buildResult;

  const sceneApi = api.scene(sceneId as string);
  for (const entity of buildResult.value) {
    const addResult = sceneApi.addEntity({ entity });
    if (!addResult.ok) return addResult;
  }

  return ok(undefined);
}
