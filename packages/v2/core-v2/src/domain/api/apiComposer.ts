import type { EngineState } from '../engine';
import type { ComponentType } from '../components';
import { ok, err } from '../utils';
import type { Result } from '../utils';
import type { SceneId, EntityId, ViewportId } from '../ids';
import type { APIComposer, SupportedUseCase } from './types';

/**
 * Creates a composable API builder bound to an engine state.
 *
 * State resolution per domain tag:
 * - `engine`    → uses the `EngineState` directly.
 * - `scene`     → resolves `SceneState` by `sceneId`.
 * - `entity`    → resolves `EntityState` by `entityId` within a scene.
 * - `component` → resolves `ComponentBase` by `componentType` within an entity.
 * - `viewport`  → resolves `ViewportState` by `viewportId`.
 *
 * @param engine - The root engine state to bind the API to.
 * @returns A new API composer instance.
 * @example
 * ```ts
 * const api = composeAPI(engine)
 *   .add('addScene', addSceneToEngine)
 *   .add('addEntity', addEntityToScene)
 *   .build();
 * ```
 */
export function composeAPI(engine: EngineState): APIComposer {
  const engineMethods: Record<string, Function> = {};
  const sceneMethods: Record<string, SupportedUseCase> = {};
  const entityMethods: Record<string, SupportedUseCase> = {};
  const componentMethods: Record<string, SupportedUseCase> = {};
  const viewportMethods: Record<string, SupportedUseCase> = {};

  /** Run every guard declared on the use case; short-circuit on first failure. */
  function runGuards(
    guards: ReadonlyArray<Function>,
    rootState: unknown,
    state: unknown,
    params: unknown,
  ): Result<void> | undefined {
    for (const guard of guards) {
      const result = (guard as Function)(rootState, state, params) as Result<void>;
      if (!result.ok) return result;
    }
    return undefined; // all passed
  }

  /** Wraps a value in a Result if it isn't one already. */
  function wrapResult(value: unknown): Result<unknown> {
    const isResult = typeof value === 'object' && value !== null && 'ok' in value;
    return isResult ? (value as Result<unknown>) : ok(value);
  }

  /** Factory for binding use cases to a specific state context. */
  function createBoundMethods(
    useCases: Record<string, SupportedUseCase>,
    state: unknown,
    rootState: unknown,
    domainName: string,
    id: string,
  ): Record<string, Function> {
    const bound: Record<string, Function> = {};
    for (const [key, useCase] of Object.entries(useCases)) {
      bound[key] = (params: unknown) => {
        if (!state) return err('not-found', `${domainName} '${id}' not found.`);
        if (useCase.guards.length) {
          const fail = runGuards(useCase.guards, rootState, state, params);
          if (fail) return fail;
        }
        const viewportContext =
          domainName === 'Viewport' && useCase.domain === 'viewport'
            ? { engine: rootState }
            : undefined;
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any --
           Runtime safety is guaranteed by the APIComposer.add() type checks. */
        return wrapResult((useCase as any).execute(state, params, viewportContext));
      };
    }
    return bound;
  }

  function add(key: string, useCase: SupportedUseCase): any {
    switch (useCase.domain) {
      case 'engine':
        engineMethods[key] = (params: unknown) => {
          if (useCase.guards.length) {
            const fail = runGuards(useCase.guards, engine, engine, params);
            if (fail) return fail;
          }
          return wrapResult(useCase.execute(engine, params));
        };
        break;
      case 'scene': sceneMethods[key] = useCase; break;
      case 'entity': entityMethods[key] = useCase; break;
      case 'component': componentMethods[key] = useCase; break;
      case 'viewport': viewportMethods[key] = useCase; break;
    }
    return composer;
  }

  function build(): any {
    return Object.freeze({
      ...engineMethods,

      scene: (sceneId: SceneId) => {
        const scene = engine.scenes.get(sceneId);
        const sceneBound = createBoundMethods(sceneMethods, scene, engine, 'Scene', sceneId);

        sceneBound.entity = (entityId: EntityId) => {
          const entity = scene?.entities.get(entityId);
          const entityBound = createBoundMethods(entityMethods, entity, scene, 'Entity', entityId);

          entityBound.component = (componentType: ComponentType) => {
            const comp = entity?.components.get(componentType);
            return Object.freeze(
              createBoundMethods(componentMethods, comp, entity, 'Component', componentType),
            );
          };

          return Object.freeze(entityBound);
        };

        return Object.freeze(sceneBound);
      },

      viewport: (viewportId: ViewportId) => Object.freeze(
        createBoundMethods(
          viewportMethods,
          engine.viewports.get(viewportId),
          engine,
          'Viewport',
          viewportId,
        ),
      ),
    });
  }

  const composer = { add, build } as unknown as APIComposer;
  return composer;
}
