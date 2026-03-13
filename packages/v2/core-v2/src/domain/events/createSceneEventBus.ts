import type { SceneEventBus, SceneEventEntry, SceneEventSubscription } from './types';

/** Creates a new in-frame event bus for a scene. */
export function createSceneEventBus(): SceneEventBus {
  const queue: SceneEventEntry[] = [];
  const subs: SceneEventSubscription[] = [];

  return {
    fire(name, data) {
      queue.push({ name, data });
    },

    on(slotId, name, cb) {
      const sub: SceneEventSubscription = { slotId, eventName: name, callback: cb };
      subs.push(sub);
      return () => {
        const idx = subs.indexOf(sub);
        if (idx >= 0) subs.splice(idx, 1);
      };
    },

    flush() {
      const snapshot = queue.splice(0, queue.length);
      for (const event of snapshot) {
        for (const sub of subs) {
          if (sub.eventName === event.name) {
            sub.callback(event.data);
          }
        }
      }
    },

    removeSlot(slotId) {
      for (let i = subs.length - 1; i >= 0; i--) {
        if (subs[i].slotId === slotId) subs.splice(i, 1);
      }
    },

    dispose() {
      queue.length = 0;
      subs.length = 0;
    },
  };
}
