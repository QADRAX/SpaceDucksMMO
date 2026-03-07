import type { EngineState } from '../engine';
import type { ComponentType, ComponentBase } from '../components';
import type { CreatableComponentType, ComponentByType } from '../components/types/factory';
import type { ComponentFieldPaths, ComponentFieldValue } from '../components/fieldPaths';
import type { Result } from '../utils';
import { ok, err } from '../utils';
import type { UseCase, EngineUseCase } from '../useCases';
import type { SceneUseCase } from '../useCases';
import type { ViewportUseCase } from '../useCases';
import type { EntityUseCase } from '../useCases';
import type { ComponentUseCase } from '../useCases';

/* eslint-disable @typescript-eslint/no-explicit-any --
   `any` in type parameters is required for conditional-type inference
   across covariant / contravariant positions. Value-level code uses
   `unknown` exclusively. */

/** Union of all domain-tagged use case types the composer accepts. */
type SupportedUseCase =
  | EngineUseCase<any, any>
  | SceneUseCase<any, any>
  | ViewportUseCase<any, any>
  | EntityUseCase<any, any>
  | ComponentUseCase<any, any, any>;

/** Wraps `O` in `Result` unless it already is one. */
type WrapResult<O> = O extends Result<any> ? O : Result<O>;

/** Infers the method signature for a bound use case. */
type BoundMethod<T extends SupportedUseCase> =
  T extends UseCase<any, infer P, infer O>
  ? [P] extends [void]
  ? () => WrapResult<O>
  : (params: P) => WrapResult<O>
  : never;

/**
 * Given the accumulated component methods `TMethods` and a resolved
 * concrete component type `TComp`, narrows `setField`'s params so
 * that `fieldKey` autocompletes to the component's editable field paths.
 * All other methods are passed through unchanged.
 */
type NarrowComponentScope<TMethods, TComp extends ComponentBase<any, any>> = {
  [K in keyof TMethods]: K extends 'setField'
  ? <P extends ComponentFieldPaths<TComp>>(params: {
    readonly fieldKey: P;
    readonly value: ComponentFieldValue<TComp, P>;
  }) => TMethods[K] extends (...args: any) => infer R ? R : never
  : TMethods[K];
};

/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Composable API builder. Register use cases with `.add(key, useCase)`,
 * then call `.build()` to produce the frozen, fully-typed API object.
 *
 * Supports 5 domain levels:
 * - `engine`    → root methods on the API object.
 * - `scene`     → scoped via `api.scene(id)`.
 * - `entity`    → scoped via `api.scene(id).entity(id)`.
 * - `component` → scoped via `api.scene(id).entity(id).component(type)`.
 * - `viewport`  → scoped via `api.viewport(id)`.
 */
export interface APIComposer<
  TEngine = {},
  TScene = {},
  TEntity = {},
  TComponent = {},
  TViewport = {},
> {
  /** Bind a use case to the API. */
  add<K extends string, T extends SupportedUseCase>(
    key: K,
    useCase: T,
  ): T extends EngineUseCase<any, any>
    ? APIComposer<TEngine & { readonly [P in K]: BoundMethod<T> }, TScene, TEntity, TComponent, TViewport>
    : T extends SceneUseCase<any, any>
    ? APIComposer<TEngine, TScene & { readonly [P in K]: BoundMethod<T> }, TEntity, TComponent, TViewport>
    : T extends EntityUseCase<any, any>
    ? APIComposer<TEngine, TScene, TEntity & { readonly [P in K]: BoundMethod<T> }, TComponent, TViewport>
    : T extends ComponentUseCase<any, any, any>
    ? APIComposer<TEngine, TScene, TEntity, TComponent & { readonly [P in K]: BoundMethod<T> }, TViewport>
    : T extends ViewportUseCase<any, any>
    ? APIComposer<TEngine, TScene, TEntity, TComponent, TViewport & { readonly [P in K]: BoundMethod<T> }>
    : never;

  /** Freeze and return the composed API object. */
  build(): Readonly<
    TEngine & {
      readonly scene: (id: string) => Readonly<TScene & {
        readonly entity: (id: string) => Readonly<TEntity & {
          readonly component: <T extends CreatableComponentType>(type: T) =>
            Readonly<NarrowComponentScope<TComponent, ComponentByType[T]>>;
        }>;
      }>;
      readonly viewport: (id: string) => Readonly<TViewport>;
    }
  >;
}


function isResult(value: unknown): value is Result<unknown> {
  return typeof value === 'object' && value !== null && 'ok' in value;
}

function wrapResult(value: unknown): Result<unknown> {
  return isResult(value) ? value : ok(value);
}

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
 * @example
 * ```ts
 * const api = composeAPI(engine)
 *   .add('addScene', addSceneToEngine)
 *   .add('pause', pauseEngine)
 *   .add('addEntity', addEntityToScene)
 *   .add('addComponent', addComponentToEntity)
 *   .add('setEnabled', setComponentEnabled)
 *   .add('setScene', setViewportScene)
 *   .add('enable', enableViewport)
 *   .build();
 *
 * api.addScene({ sceneId: 'main' });
 *
 * const scene = api.scene('main');
 * scene.addEntity({ entity });
 *
 * const entity = api.scene('main').entity('player');
 * entity.addComponent({ component });
 *
 * const comp = api.scene('main').entity('player').component('rigidBody');
 * comp.setEnabled({ enabled: false });
 *
 * const vp = api.viewport('vp1');
 * vp.setScene({ sceneId: 'main' });
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

  function add(key: string, useCase: SupportedUseCase): any {
    switch (useCase.domain) {
      case 'engine':
        engineMethods[key] = (params: unknown) => {
          if (useCase.guards.length) {
            const fail = runGuards(useCase.guards, engine, engine, params);
            if (fail) return fail;
          }
          const out = useCase.execute(engine, params);
          return wrapResult(out);
        };
        break;
      case 'scene':
        sceneMethods[key] = useCase;
        break;
      case 'entity':
        entityMethods[key] = useCase;
        break;
      case 'component':
        componentMethods[key] = useCase;
        break;
      case 'viewport':
        viewportMethods[key] = useCase;
        break;
    }
    return composer;
  }

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
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any --
             type safety enforced at add()-time; runtime state matches the domain tag. */
        return wrapResult((useCase as any).execute(state, params));
      };
    }
    return bound;
  }

  function build(): any {
    return Object.freeze({
      ...engineMethods,

      scene: (sceneId: string) => {
        const scene = engine.scenes.get(sceneId);

        const sceneBound = createBoundMethods(
          sceneMethods, scene, engine, 'Scene', sceneId,
        );

        sceneBound.entity = (entityId: string) => {
          const entity = scene?.entities.get(entityId);

          const entityBound = createBoundMethods(
            entityMethods, entity, scene, 'Entity', entityId,
          );

          entityBound.component = (componentType: ComponentType) => {
            const comp = entity?.components.get(componentType);

            return Object.freeze(
              createBoundMethods(
                componentMethods, comp, entity, 'Component', componentType,
              ),
            );
          };

          return Object.freeze(entityBound);
        };

        return Object.freeze(sceneBound);
      },

      viewport: (viewportId: string) =>
        Object.freeze(
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
