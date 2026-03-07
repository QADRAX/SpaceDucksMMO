import type { Result } from '../../utils';
import type { EngineUseCase, SceneUseCase, ViewportUseCase, EntityUseCase, ComponentUseCase, UseCase } from '../../useCases';

/* eslint-disable @typescript-eslint/no-explicit-any --
   `any` in type parameters is required for conditional-type inference
   across covariant / contravariant positions. Value-level code uses
   `unknown` exclusively. */

/** Union of all domain-tagged use case types the composer accepts. */
export type SupportedUseCase =
    | EngineUseCase<any, any>
    | SceneUseCase<any, any>
    | ViewportUseCase<any, any>
    | EntityUseCase<any, any>
    | ComponentUseCase<any, any, any>;

/** Wraps `O` in `Result` unless it already is one. */
export type WrapResult<O> = O extends Result<any> ? O : Result<O>;

/** Infers the method signature for a bound use case. */
export type BoundMethod<T extends SupportedUseCase> =
    T extends UseCase<any, infer P, infer O>
    ? [P] extends [void]
    ? () => WrapResult<O>
    : (params: P) => WrapResult<O>
    : never;

/* eslint-enable @typescript-eslint/no-explicit-any */
