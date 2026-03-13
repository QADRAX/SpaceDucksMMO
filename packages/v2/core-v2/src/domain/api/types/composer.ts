import type { CreatableComponentType, ComponentByType } from '../../components/types/factory';
import type { SupportedUseCase, BoundMethod } from './useCase';
import type { NarrowComponentScope } from './component';
import type { EngineUseCase, SceneUseCase, EntityUseCase, ComponentUseCase, ViewportUseCase } from '../../useCases';

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
