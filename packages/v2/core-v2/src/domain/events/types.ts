/** Entry queued in the in-frame event bus. */
export interface SceneEventEntry {
  readonly name: string;
  readonly data: Record<string, unknown>;
}

/** Subscription handle returned by `on()`. */
export interface SceneEventSubscription {
  readonly slotId: string;
  readonly eventName: string;
  readonly callback: (data: Record<string, unknown>) => void;
}

/**
 * In-frame event bus for script-to-script and UI communication.
 * Events are queued via `fire()` and delivered synchronously when `flush()` is called.
 */
export interface SceneEventBus {
  /** Queue an event for delivery this frame. */
  fire(name: string, data: Record<string, unknown>): void;
  /** Subscribe to a named event. Returns an unsubscribe function. */
  on(slotId: string, name: string, cb: (data: Record<string, unknown>) => void): () => void;
  /** Deliver all queued events to matching subscribers, then clear the queue. */
  flush(): void;
  /** Remove all subscriptions for a specific slot (used on slot teardown). */
  removeSlot(slotId: string): void;
  /** Clear all subscriptions and queued events. */
  dispose(): void;
}
