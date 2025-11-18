import type { JSX as PreactJSX } from 'preact/jsx-runtime';

// Re-export Preact JSX types into the global `JSX` namespace so editors
// and TypeScript can resolve `JSX.TargetedEvent`, `JSX.Element`, etc.
// Place this at the repository root so TS Server picks it up automatically.

declare global {
  namespace JSX {
    export type Element = PreactJSX.Element;
    export type IntrinsicElements = PreactJSX.IntrinsicElements;
    export type IntrinsicAttributes = PreactJSX.IntrinsicAttributes;
    export type ElementChildrenAttribute = PreactJSX.ElementChildrenAttribute;
    export type TargetedEvent<T = Element, E = Event> = PreactJSX.TargetedEvent<T, E>;
    export type TargetedMouseEvent<T = Element> = PreactJSX.TargetedMouseEvent<T>;
    export type LibraryManagedAttributes<C, P> = PreactJSX.LibraryManagedAttributes<C, P>;
  }
}

export {};
