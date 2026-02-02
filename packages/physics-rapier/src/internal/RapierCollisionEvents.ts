import type { PhysicsCollisionEvent } from "@duckengine/core";

/**
 * Converts Rapier collision callbacks into an engine-friendly event stream:
 * enter/stay/exit with body owner ids and collider entity ids.
 */
export class RapierCollisionEvents {
  private readonly collisionListeners = new Set<(ev: PhysicsCollisionEvent) => void>();
  private readonly colliderMetaByHandle = new Map<number, { colliderEntityId: string; bodyOwnerId: string }>();
  private readonly activePairs = new Set<string>();

  subscribe(listener: (ev: PhysicsCollisionEvent) => void): () => void {
    this.collisionListeners.add(listener);
    return () => this.collisionListeners.delete(listener);
  }

  registerColliderHandle(handle: number, colliderEntityId: string, bodyOwnerId: string): void {
    this.colliderMetaByHandle.set(handle, { colliderEntityId, bodyOwnerId });
  }

  unregisterColliderHandle(handle: number): void {
    this.colliderMetaByHandle.delete(handle);
    this.removePairsInvolving(handle);
  }

  drain(eventQueue: any): void {
    if (!eventQueue) return;
    if (this.collisionListeners.size === 0) {
      try {
        eventQueue.clear?.();
      } catch {}
      return;
    }

    const startedPairs: Array<[number, number]> = [];
    const endedPairs: Array<[number, number]> = [];

    try {
      eventQueue.drainCollisionEvents((h1: number, h2: number, started: boolean) => {
        if (started) startedPairs.push([h1, h2]);
        else endedPairs.push([h1, h2]);
      });
    } catch {
      return;
    }

    for (const [h1, h2] of startedPairs) {
      const key = this.pairKey(h1, h2);
      if (this.activePairs.has(key)) continue;
      this.activePairs.add(key);
      this.emitCollision("enter", h1, h2);
    }

    for (const [h1, h2] of endedPairs) {
      const key = this.pairKey(h1, h2);
      if (!this.activePairs.has(key)) continue;
      this.activePairs.delete(key);
      this.emitCollision("exit", h1, h2);
    }

    for (const key of this.activePairs) {
      const [h1s, h2s] = key.split("|");
      const h1 = Number(h1s);
      const h2 = Number(h2s);
      this.emitCollision("stay", h1, h2);
    }
  }

  dispose(): void {
    this.collisionListeners.clear();
    this.colliderMetaByHandle.clear();
    this.activePairs.clear();
  }

  private emitCollision(kind: "enter" | "stay" | "exit", h1: number, h2: number): void {
    const m1 = this.colliderMetaByHandle.get(h1);
    const m2 = this.colliderMetaByHandle.get(h2);
    if (!m1 || !m2) return;

    const ev: PhysicsCollisionEvent = {
      kind,
      a: m1.bodyOwnerId,
      b: m2.bodyOwnerId,
      colliderA: m1.colliderEntityId,
      colliderB: m2.colliderEntityId,
    };

    for (const l of this.collisionListeners) {
      try {
        l(ev);
      } catch {}
    }
  }

  private pairKey(h1: number, h2: number): string {
    return h1 < h2 ? `${h1}|${h2}` : `${h2}|${h1}`;
  }

  private removePairsInvolving(handle: number): void {
    if (this.activePairs.size === 0) return;
    // Best-effort cleanup; do not emit exits here to avoid double firing.
    for (const key of Array.from(this.activePairs)) {
      const [a, b] = key.split("|");
      if (Number(a) === handle || Number(b) === handle) this.activePairs.delete(key);
    }
  }
}

export default RapierCollisionEvents;
