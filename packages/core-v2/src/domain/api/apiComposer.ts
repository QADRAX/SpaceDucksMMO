import type { EngineState } from '../engine';
import type { Result } from '../utils';
import { ok, err } from '../utils';
import type { EngineUseCase } from '../useCases';
import type { SceneUseCase } from '../useCases';
import type { ViewportUseCase } from '../useCases';

/* eslint-disable @typescript-eslint/no-explicit-any --
   `any` in type parameters is required for conditional-type inference
   across covariant / contravariant positions. Value-level code uses
   `unknown` exclusively. */

/** Union of all domain-tagged use case types the composer accepts. */
type SupportedUseCase =
  | EngineUseCase<any, any>
  | SceneUseCase<any, any>
  | ViewportUseCase<any, any>;

/** Wraps `O` in `Result` unless it already is one. */
type WrapResult<O> = O extends Result<any> ? O : Result<O>;

/**
 * Infers the API method signature from a use case type.
 *
 * - **engine** — bound directly; signature matches the use case.
 * - **scene** — prepends `sceneId` argument; output wrapped in `Result`.
 * - **viewport** — prepends `viewportId` argument; output wrapped in `Result`.
 *
 * When the use case declares guards, the output is always wrapped in
 * `Result` because a guard may fail before `execute` runs.
 */
type InferMethod<T extends SupportedUseCase> =
  T extends EngineUseCase<infer P, infer O>
    ? [P] extends [void]
      ? () => O
      : (params: P) => O
    : T extends SceneUseCase<infer P, infer O>
      ? [P] extends [void]
        ? (sceneId: string) => WrapResult<O>
        : (sceneId: string, params: P) => WrapResult<O>
      : T extends ViewportUseCase<infer P, infer O>
        ? [P] extends [void]
          ? (viewportId: string) => WrapResult<O>
          : (viewportId: string, params: P) => WrapResult<O>
        : never;

/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Composable API builder. Register use cases with `.add(key, useCase)`,
 * then call `.build()` to produce the frozen, fully-typed API object.
 *
 * Guards declared on each use case are executed automatically before
 * `execute` — the composer reads `useCase.guards` and runs them with
 * `(engine, resolvedState, params)`. No extra wiring needed.
 */
export interface APIComposer<TApi> {
  /** Bind a use case to the API under the given key. */
  add<K extends string, T extends SupportedUseCase>(
    key: K,
    useCase: T,
  ): APIComposer<TApi & { readonly [P in K]: InferMethod<T> }>;

  /** Freeze and return the composed API object. */
  build(): Readonly<TApi>;
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
 * - `engine`   → uses the `EngineState` directly.
 * - `scene`    → resolves `SceneState` by `sceneId` (first argument).
 * - `viewport` → resolves `ViewportState` by `viewportId` (first argument).
 *
 * @example
 * ```ts
 * const api = composeAPI(engine)
 *   .add('addScene', addSceneToEngine)
 *   .add('pause', pauseEngine)
 *   .add('addEntity', addEntityToScene)
 *   .add('setScene', setViewportScene)   // guards auto-read from UC
 *   .add('setCamera', setViewportCamera) // guards auto-read from UC
 *   .add('enable', enableViewport)
 *   .build();
 *
 * api.addScene({ sceneId: 'main' });
 * api.pause();
 * api.addEntity('main', { entity });
 * api.setScene('vp1', { sceneId: 'main' });   // guardSceneExists runs first
 * api.setCamera('vp1', { cameraEntityId: 'cam1' }); // guardCameraInScene runs first
 * api.enable('vp1');
 * ```
 */
export function composeAPI(engine: EngineState): APIComposer<Record<never, never>> {
  const methods: Record<string, Function> = {};

  /** Run every guard declared on the use case; short-circuit on first failure. */
  function runGuards(
    guards: ReadonlyArray<Function>,
    state: unknown,
    params: unknown,
  ): Result<void> | undefined {
    for (const guard of guards) {
      const result = (guard as Function)(engine, state, params) as Result<void>;
      if (!result.ok) return result;
    }
    return undefined; // all passed
  }

  function add(key: string, useCase: SupportedUseCase): APIComposer<Record<never, never>> {
    const guards = useCase.guards;

    switch (useCase.domain) {
      case 'engine':
        methods[key] = (params: unknown) => {
          if (guards.length) {
            const fail = runGuards(guards, engine, params);
            if (fail) return fail;
          }
          return useCase.execute(engine, params);
        };
        break;

      case 'scene':
        methods[key] = (sceneId: string, params?: unknown) => {
          const scene = engine.scenes.get(sceneId);
          if (!scene) return err('not-found', `Scene '${sceneId}' not found.`);
          if (guards.length) {
            const fail = runGuards(guards, scene, params);
            if (fail) return fail;
          }
          return wrapResult(useCase.execute(scene, params));
        };
        break;

      case 'viewport':
        methods[key] = (viewportId: string, params?: unknown) => {
          const vp = engine.viewports.get(viewportId);
          if (!vp) return err('not-found', `Viewport '${viewportId}' not found.`);
          if (guards.length) {
            const fail = runGuards(guards, vp, params);
            if (fail) return fail;
          }
          return wrapResult(useCase.execute(vp, params));
        };
        break;
    }

    // The generic accumulation happens at the type level via APIComposer.
    // At runtime the same builder instance is returned.
    return composer;
  }

  function build(): Readonly<Record<never, never>> {
    return Object.freeze({ ...methods }) as Readonly<Record<never, never>>;
  }

  // Cast once: the external generic interface drives the type safety,
  // the concrete implementation is untyped internally.
  const composer = { add, build } as unknown as APIComposer<Record<never, never>>;
  return composer;
}
