import type { ComponentType } from '../types/componentType';
import type { DebugKind } from '../types/debug';
import type { ComponentBase } from './component';

/** Fired when a component is added to or removed from an entity. */
export interface ComponentEvent {
  readonly entityId: string;
  readonly component: ComponentBase;
  readonly action: 'added' | 'removed';
}

/** Listener for structural component changes (add/remove). */
export type ComponentListener = (event: ComponentEvent) => void;

/** Listener for component field-level changes. */
export type ComponentChangeListener = (entityId: string, type: ComponentType) => void;

/** Listener for presentation changes (display name, gizmo icon). */
export type PresentationListener = (entityId: string) => void;

/** Listener for debug flag changes. */
export type DebugListener = (entityId: string, kind: DebugKind, enabled: boolean) => void;

/** Centralised observer hub for a single entity. */
export interface EntityObservers {
  fireComponentAdded(entityId: string, comp: ComponentBase): void;
  fireComponentRemoved(entityId: string, comp: ComponentBase): void;
  fireComponentChanged(entityId: string, type: ComponentType): void;
  firePresentationChanged(entityId: string): void;
  fireDebugChanged(entityId: string, kind: DebugKind, enabled: boolean): void;

  addComponentListener(fn: ComponentListener): void;
  removeComponentListener(fn: ComponentListener): void;
  addChangeListener(fn: ComponentChangeListener): void;
  removeChangeListener(fn: ComponentChangeListener): void;
  addPresentationListener(fn: PresentationListener): void;
  removePresentationListener(fn: PresentationListener): void;
  addDebugListener(fn: DebugListener): void;
  removeDebugListener(fn: DebugListener): void;
}

/** Creates a new observer hub with empty listener lists. */
export function createEntityObservers(): EntityObservers {
  const compListeners: ComponentListener[] = [];
  const changeListeners: ComponentChangeListener[] = [];
  const presListeners: PresentationListener[] = [];
  const debugListeners: DebugListener[] = [];

  function safeFire<A extends unknown[]>(list: Array<(...args: A) => void>, ...args: A): void {
    for (const fn of list) {
      try {
        fn(...args);
      } catch {
        /* swallow – observer must not break engine */
      }
    }
  }

  return {
    fireComponentAdded(entityId, comp) {
      safeFire(compListeners, { entityId, component: comp, action: 'added' });
    },
    fireComponentRemoved(entityId, comp) {
      safeFire(compListeners, { entityId, component: comp, action: 'removed' });
    },
    fireComponentChanged(entityId, type) {
      safeFire(changeListeners, entityId, type);
    },
    firePresentationChanged(entityId) {
      safeFire(presListeners, entityId);
    },
    fireDebugChanged(entityId, kind, enabled) {
      safeFire(debugListeners, entityId, kind, enabled);
    },

    addComponentListener(fn) {
      compListeners.push(fn);
    },
    removeComponentListener(fn) {
      remove(compListeners, fn);
    },
    addChangeListener(fn) {
      changeListeners.push(fn);
    },
    removeChangeListener(fn) {
      remove(changeListeners, fn);
    },
    addPresentationListener(fn) {
      presListeners.push(fn);
    },
    removePresentationListener(fn) {
      remove(presListeners, fn);
    },
    addDebugListener(fn) {
      debugListeners.push(fn);
    },
    removeDebugListener(fn) {
      remove(debugListeners, fn);
    },
  };
}

function remove<T>(arr: T[], item: T): void {
  const i = arr.indexOf(item);
  if (i >= 0) arr.splice(i, 1);
}
