import type { PresentationListener, DebugListener, EntityObservers } from './types';
import type { ComponentListener, ComponentChangeListener } from '../components';

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
