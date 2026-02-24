export type ScriptEventListener = {
    slotId: string;
    callback: (data: Record<string, unknown>) => void;
};

export class SceneEventBus {
    private listeners = new Map<string, Set<ScriptEventListener>>();
    private queue: Array<{ name: string; data: Record<string, unknown> }> = [];

    subscribe(name: string, slotId: string, callback: (data: Record<string, unknown>) => void): () => void {
        let set = this.listeners.get(name);
        if (!set) {
            set = new Set();
            this.listeners.set(name, set);
        }
        const listener = { slotId, callback };
        set.add(listener);

        return () => {
            set.delete(listener);
        };
    }

    unsubscribeAll(slotId: string): void {
        for (const set of this.listeners.values()) {
            for (const listener of set) {
                if (listener.slotId === slotId) {
                    set.delete(listener);
                }
            }
        }
    }

    fire(name: string, data: Record<string, unknown> = {}): void {
        this.queue.push({ name, data });
    }

    flush(): void {
        if (this.queue.length === 0) return;

        // Grab the current queue and reset it.
        // Any events fired by handlers during this flush will go into the NEXT frame's queue.
        const currentQueue = this.queue;
        this.queue = [];

        for (const event of currentQueue) {
            const set = this.listeners.get(event.name);
            if (set) {
                for (const listener of set) {
                    try {
                        listener.callback(event.data);
                    } catch (err) {
                        console.error(`[SceneEventBus] Error in event listener for event '${event.name}':`, err);
                    }
                }
            }
        }
    }

    dispose(): void {
        this.listeners.clear();
        this.queue = [];
    }
}
