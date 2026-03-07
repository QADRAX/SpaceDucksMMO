/** Entry queued in the in-frame event bus. */
export interface ScriptEventEntry {
  readonly name: string;
  readonly data: Record<string, unknown>;
}

/** Subscription handle returned by `on()`. */
export interface ScriptEventSubscription {
  readonly slotId: string;
  readonly eventName: string;
  readonly callback: (data: Record<string, unknown>) => void;
}

/**
 * In-frame event bus for script-to-script communication.
 *
 * Events are queued via `fire()` during hooks and delivered
 * synchronously when `flush()` is called (after earlyUpdate).
 * Cleared every frame.
 */
export interface ScriptEventBus {
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
