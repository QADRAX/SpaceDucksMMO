import type { IPhysicsSystem } from "./IPhysicsSystem";
import type { PhysicsCollisionEvent, PhysicsCollisionEventKind } from "./PhysicsTypes";

export type EntityCollisionHandler = (ev: {
  kind: PhysicsCollisionEventKind;
  /** The entity id you subscribed for (body-owner scope). */
  self: string;
  /** The other body-owner entity id. */
  other: string;
  /** Collider entity ids if available (useful for compound colliders). */
  selfCollider?: string;
  otherCollider?: string;
  /** Original raw event from backend. */
  raw: PhysicsCollisionEvent;
}) => void;

export type ColliderCollisionHandler = (ev: {
  kind: PhysicsCollisionEventKind;
  /** The collider entity id you subscribed for (collider scope). */
  self: string;
  /** The other collider entity id (if known). */
  other?: string;
  /** Body-owner entity ids (useful if you want high-level entity resolution). */
  selfBody: string;
  otherBody: string;
  raw: PhysicsCollisionEvent;
}) => void;

/**
 * Convenience layer over IPhysicsSystem.subscribeCollisions.
 *
 * Goals:
 * - Subscribe per entity (rigidbody owner) without manually filtering events.
 * - Optionally subscribe per collider entity (useful for compound setups).
 * - Dispatch the event to both sides with `self/other` normalized.
 */
export class CollisionEventsHub {
  private readonly entityListeners = new Map<string, Set<EntityCollisionHandler>>();
  private readonly entityListenersByKind = new Map<PhysicsCollisionEventKind, Map<string, Set<EntityCollisionHandler>>>();

  private readonly colliderListeners = new Map<string, Set<ColliderCollisionHandler>>();
  private readonly colliderListenersByKind = new Map<PhysicsCollisionEventKind, Map<string, Set<ColliderCollisionHandler>>>();

  private unsubscribeFromPhysics?: () => void;

  attach(system: IPhysicsSystem | undefined): void {
    this.detach();
    if (!system?.subscribeCollisions) return;
    this.unsubscribeFromPhysics = system.subscribeCollisions((ev) => this.onRawCollision(ev));
  }

  detach(): void {
    this.unsubscribeFromPhysics?.();
    this.unsubscribeFromPhysics = undefined;
  }

  dispose(): void {
    this.detach();
    this.entityListeners.clear();
    this.colliderListeners.clear();
    this.entityListenersByKind.clear();
    this.colliderListenersByKind.clear();
  }

  onEntity(entityId: string, handler: EntityCollisionHandler, kind?: PhysicsCollisionEventKind): () => void {
    if (kind) {
      let byId = this.entityListenersByKind.get(kind);
      if (!byId) {
        byId = new Map();
        this.entityListenersByKind.set(kind, byId);
      }
      let set = byId.get(entityId);
      if (!set) {
        set = new Set();
        byId.set(entityId, set);
      }
      set.add(handler);
      return () => set!.delete(handler);
    }

    let set = this.entityListeners.get(entityId);
    if (!set) {
      set = new Set();
      this.entityListeners.set(entityId, set);
    }
    set.add(handler);
    return () => set!.delete(handler);
  }

  onEntityEnter(entityId: string, handler: EntityCollisionHandler): () => void {
    return this.onEntity(entityId, handler, "enter");
  }
  onEntityStay(entityId: string, handler: EntityCollisionHandler): () => void {
    return this.onEntity(entityId, handler, "stay");
  }
  onEntityExit(entityId: string, handler: EntityCollisionHandler): () => void {
    return this.onEntity(entityId, handler, "exit");
  }

  onCollider(colliderEntityId: string, handler: ColliderCollisionHandler, kind?: PhysicsCollisionEventKind): () => void {
    if (kind) {
      let byId = this.colliderListenersByKind.get(kind);
      if (!byId) {
        byId = new Map();
        this.colliderListenersByKind.set(kind, byId);
      }
      let set = byId.get(colliderEntityId);
      if (!set) {
        set = new Set();
        byId.set(colliderEntityId, set);
      }
      set.add(handler);
      return () => set!.delete(handler);
    }

    let set = this.colliderListeners.get(colliderEntityId);
    if (!set) {
      set = new Set();
      this.colliderListeners.set(colliderEntityId, set);
    }
    set.add(handler);
    return () => set!.delete(handler);
  }

  onColliderEnter(colliderEntityId: string, handler: ColliderCollisionHandler): () => void {
    return this.onCollider(colliderEntityId, handler, "enter");
  }
  onColliderStay(colliderEntityId: string, handler: ColliderCollisionHandler): () => void {
    return this.onCollider(colliderEntityId, handler, "stay");
  }
  onColliderExit(colliderEntityId: string, handler: ColliderCollisionHandler): () => void {
    return this.onCollider(colliderEntityId, handler, "exit");
  }

  private onRawCollision(ev: PhysicsCollisionEvent): void {
    // Entity (body-owner) scope: dispatch to both sides.
    this.emitEntity(ev, ev.a, ev.b, ev.colliderA, ev.colliderB);
    this.emitEntity(ev, ev.b, ev.a, ev.colliderB, ev.colliderA);

    // Collider scope (if provided): dispatch to both colliders.
    if (ev.colliderA) {
      this.emitCollider(ev, ev.colliderA, ev.colliderB, ev.a, ev.b);
    }
    if (ev.colliderB) {
      this.emitCollider(ev, ev.colliderB, ev.colliderA, ev.b, ev.a);
    }
  }

  private emitEntity(raw: PhysicsCollisionEvent, self: string, other: string, selfCollider?: string, otherCollider?: string): void {
    const payload = { kind: raw.kind, self, other, selfCollider, otherCollider, raw };

    const all = this.entityListeners.get(self);
    if (all) {
      for (const l of all) {
        try {
          l(payload);
        } catch {}
      }
    }

    const kindMap = this.entityListenersByKind.get(raw.kind);
    const byKind = kindMap?.get(self);
    if (byKind) {
      for (const l of byKind) {
        try {
          l(payload);
        } catch {}
      }
    }
  }

  private emitCollider(raw: PhysicsCollisionEvent, selfCollider: string, otherCollider: string | undefined, selfBody: string, otherBody: string): void {
    const payload = { kind: raw.kind, self: selfCollider, other: otherCollider, selfBody, otherBody, raw };

    const all = this.colliderListeners.get(selfCollider);
    if (all) {
      for (const l of all) {
        try {
          l(payload);
        } catch {}
      }
    }

    const kindMap = this.colliderListenersByKind.get(raw.kind);
    const byKind = kindMap?.get(selfCollider);
    if (byKind) {
      for (const l of byKind) {
        try {
          l(payload);
        } catch {}
      }
    }
  }
}

export default CollisionEventsHub;
