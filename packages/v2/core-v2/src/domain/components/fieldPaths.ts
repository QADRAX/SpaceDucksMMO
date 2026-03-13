import type { ComponentBase } from './types/core';

/**
 * Recursion depth limiter for `DotPaths`.
 * Index `N` yields depth `N-1`; avoids infinite recursion on nested objects.
 */
type Prev = [never, 0, 1, 2];

/**
 * Produces a string-literal union of all dot-notation paths reachable
 * from `T`, up to `Depth` levels deep.
 *
 * - Primitives yield their key directly (`'mass'`).
 * - Plain objects recurse with a dot separator (`'halfExtents.x'`).
 * - Arrays and readonly arrays are **not** recursed into.
 *
 * @example
 * ```ts
 * type Paths = DotPaths<{ a: number; b: { x: number; y: number } }>;
 * //   ^? 'a' | 'b' | 'b.x' | 'b.y'
 * ```
 */
type DotPaths<T, Depth extends number = 2> = [Depth] extends [never]
    ? never
    : {
        [K in keyof T & string]: T[K] extends ReadonlyArray<unknown>
        ? K
        : T[K] extends Record<string, unknown>
        ? K | `${K}.${DotPaths<T[K], Prev[Depth]>}`
        : K;
    }[keyof T & string];

/**
 * Keys excluded from the editable field surface.
 * These are structural — not inspector-editable properties.
 */
type StructuralKeys = 'type' | 'metadata' | 'enabled';

/**
 * Produces the string-literal union of all inspector-editable field paths
 * for a given component type, including dot-notation for nested objects.
 *
 * @example
 * ```ts
 * type RBFields = ComponentFieldPaths<RigidBodyComponent>;
 * //   ^? 'bodyType' | 'mass' | 'linearDamping' | 'angularDamping' | 'gravityScale' | 'startSleeping'
 *
 * type BoxFields = ComponentFieldPaths<BoxColliderComponent>;
 * //   ^? 'friction' | 'restitution' | 'isSensor' | 'halfExtents' | 'halfExtents.x' | 'halfExtents.y' | 'halfExtents.z'
 * ```
 */
export type ComponentFieldPaths<T extends ComponentBase<any, any>> =
    DotPaths<Omit<T, StructuralKeys>>;

/** Resolves the value type at a given dot-notation path within T. */
export type FieldPathValue<T, P extends string> =
    P extends `${infer Head}.${infer Tail}`
    ? Head extends keyof T
    ? FieldPathValue<T[Head], Tail>
    : never
    : P extends keyof T
    ? T[P]
    : never;

/** Resolves the value type for a field path on a component, excluding structural keys. */
export type ComponentFieldValue<
    T extends ComponentBase<any, any>,
    P extends string,
> = FieldPathValue<Omit<T, StructuralKeys>, P>;
