import * as React from 'react';

/**
 * Returns a stable function reference that always calls the latest version
 * of the provided callback. Useful for event handlers in render-loop code
 * where stale closures are common.
 */
export function useStableEvent<T extends (...args: any[]) => any>(fn: T): T {
    const ref = React.useRef(fn);
    React.useLayoutEffect(() => {
        ref.current = fn;
    });
    return React.useCallback((...args: any[]) => ref.current(...args), []) as T;
}
