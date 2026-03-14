import type { PhysicsCollisionEvent } from '@duckengine/core-v2';
import { pairKey } from '../domain';

type EventQueue = {
  drainCollisionEvents?(callback: (h1: number, h2: number, started: boolean) => void): void;
  clear?(): void;
};

export interface RapierCollisionEventsHandle {
  registerColliderHandle(handle: number, colliderEntityId: string, bodyOwnerId: string): void;
  unregisterColliderHandle(handle: number): void;
  drain(eventQueue: EventQueue): void;
  getAccumulatedEvents(): PhysicsCollisionEvent[];
  clearAccumulatedEvents(): void;
  /** Resolve collider handle to body owner entity id (for raycast hit). */
  getBodyOwnerIdFromHandle(handle: number): string | undefined;
  dispose(): void;
}

export function createRapierCollisionEvents(): RapierCollisionEventsHandle {
  const colliderMetaByHandle = new Map<
    number,
    { colliderEntityId: string; bodyOwnerId: string }
  >();
  const activePairs = new Set<string>();
  const accumulatedEvents: PhysicsCollisionEvent[] = [];

  function removePairsInvolving(handle: number): void {
    for (const key of Array.from(activePairs)) {
      const [a, b] = key.split('|');
      if (Number(a) === handle || Number(b) === handle) activePairs.delete(key);
    }
  }

  function emit(kind: PhysicsCollisionEvent['kind'], h1: number, h2: number): void {
    const m1 = colliderMetaByHandle.get(h1);
    const m2 = colliderMetaByHandle.get(h2);
    if (!m1 || !m2) return;
    accumulatedEvents.push({
      kind,
      a: m1.bodyOwnerId,
      b: m2.bodyOwnerId,
      colliderA: m1.colliderEntityId,
      colliderB: m2.colliderEntityId,
    });
  }

  function registerColliderHandle(
    handle: number,
    colliderEntityId: string,
    bodyOwnerId: string
  ): void {
    colliderMetaByHandle.set(handle, { colliderEntityId, bodyOwnerId });
  }

  function unregisterColliderHandle(handle: number): void {
    colliderMetaByHandle.delete(handle);
    removePairsInvolving(handle);
  }

  function drain(eventQueue: EventQueue): void {
    if (!eventQueue?.drainCollisionEvents) return;
    const startedPairs: Array<[number, number]> = [];
    const endedPairs: Array<[number, number]> = [];
    eventQueue.drainCollisionEvents((h1: number, h2: number, started: boolean) => {
      if (started) startedPairs.push([h1, h2]);
      else endedPairs.push([h1, h2]);
    });
    for (const [h1, h2] of startedPairs) {
      const key = pairKey(h1, h2);
      if (activePairs.has(key)) continue;
      activePairs.add(key);
      emit('enter', h1, h2);
    }
    for (const [h1, h2] of endedPairs) {
      const key = pairKey(h1, h2);
      if (!activePairs.has(key)) continue;
      activePairs.delete(key);
      emit('exit', h1, h2);
    }
    for (const key of activePairs) {
      const [h1s, h2s] = key.split('|');
      emit('stay', Number(h1s), Number(h2s));
    }
  }

  function getAccumulatedEvents(): PhysicsCollisionEvent[] {
    return [...accumulatedEvents];
  }

  function clearAccumulatedEvents(): void {
    accumulatedEvents.length = 0;
  }

  function getBodyOwnerIdFromHandle(handle: number): string | undefined {
    return colliderMetaByHandle.get(handle)?.bodyOwnerId;
  }

  function dispose(): void {
    colliderMetaByHandle.clear();
    activePairs.clear();
    accumulatedEvents.length = 0;
  }

  return {
    registerColliderHandle,
    unregisterColliderHandle,
    drain,
    getAccumulatedEvents,
    clearAccumulatedEvents,
    getBodyOwnerIdFromHandle,
    dispose,
  };
}
