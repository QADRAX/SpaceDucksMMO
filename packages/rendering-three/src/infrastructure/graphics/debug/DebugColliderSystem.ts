import * as THREE from "three";
import type {
  AnyColliderComponent,
  BoxColliderComponent,
  CapsuleColliderComponent,
  ConeColliderComponent,
  CylinderColliderComponent,
  Entity,
  RigidBodyComponent,
  SphereColliderComponent,
  TerrainColliderComponent,
} from "@duckengine/ecs";
import type { RenderObjectRegistry } from "../sync/RenderObjectRegistry";

/**
 * Manages debug collider helpers for entities.
 *
 * Intent: visualize the *physics* collider shapes (not render meshes).
 * Important: current Rapier integration ignores rotations (and most scales) for colliders,
 * so this debug visualization intentionally matches the same assumptions.
 */
export class DebugColliderSystem {
  private readonly scene: THREE.Scene;
  // registry reserved for future (e.g., colorizing by render object existence)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private readonly registry: RenderObjectRegistry;

  private readonly helpers = new Map<string, THREE.Object3D>();
  private masterEnabled = false;
  /** Set of entity ids that must never show collider debug. */
  private forbidden = new Set<string>();

  constructor(scene: THREE.Scene, registry: RenderObjectRegistry) {
    this.scene = scene;
    this.registry = registry;
  }

  setMasterEnabled(enabled: boolean): void {
    this.masterEnabled = !!enabled;
    for (const [id, h] of this.helpers.entries()) {
      if (this.forbidden.has(id)) {
        try {
          this.scene.remove(h);
        } catch {}
        this.helpers.delete(id);
        continue;
      }
      h.visible = this.masterEnabled;
    }
  }

  addForbiddenEntity(entityId: string): void {
    if (this.forbidden.has(entityId)) return;
    this.forbidden.add(entityId);
    if (this.helpers.has(entityId)) this.removeHelper(entityId);
  }

  removeForbiddenEntity(entityId: string): void {
    if (!this.forbidden.has(entityId)) return;
    this.forbidden.delete(entityId);
  }

  recreateForEntityIfNeeded(entity: Entity): void {
    const exists = this.helpers.has(entity.id);
    if (this.forbidden.has(entity.id)) {
      if (exists) this.removeHelper(entity.id);
      return;
    }

    const wants = entity.isDebugColliderEnabled?.() && this.masterEnabled;
    const hasCollider = !!this.getAnyColliderComponent(entity);

    if (wants && hasCollider) {
      if (!exists) this.ensureHelper(entity);
      else {
        this.refreshColliderGeometry(entity.id, entity);
        this.updateHelperTransform(entity);
      }
    } else {
      if (exists) this.removeHelper(entity.id);
    }
  }

  ensureHelper(entity: Entity): void {
    if (!this.masterEnabled) return;
    if (this.forbidden.has(entity.id)) return;
    if (this.helpers.has(entity.id)) return;

    const group = new THREE.Object3D();
    group.name = `debugCollider:${entity.id}`;
    group.visible = this.masterEnabled;

    const wire = new THREE.Object3D();
    wire.name = "colliderWire";
    group.add(wire);

    // Build geometry once
    this.refreshColliderGeometry(entity.id, entity);

    this.scene.add(group);
    this.helpers.set(entity.id, group);
    this.updateHelperTransform(entity);
  }

  removeHelper(entityId: string): void {
    const h = this.helpers.get(entityId);
    if (!h) return;
    try {
      this.scene.remove(h);
    } catch {}

    h.traverse((o) => {
      // @ts-ignore
      if (o.geometry) {
        try {
          // @ts-ignore
          o.geometry.dispose();
        } catch {}
      }
      // @ts-ignore
      if (o.material) {
        try {
          // @ts-ignore
          o.material.dispose();
        } catch {}
      }
    });

    this.helpers.delete(entityId);
  }

  updateHelperTransform(entity: Entity): void {
    const h = this.helpers.get(entity.id);
    if (!h) return;

    const p = this.computePhysicsColliderWorldPosition(entity);
    h.position.set(p.x, p.y, p.z);

    // Match current Rapier integration: no rotation support yet.
    h.rotation.set(0, 0, 0);
    h.scale.set(1, 1, 1);
  }

  /** Rebuild the collider wire geometry inside the helper. */
  refreshColliderGeometry(entityId: string, entity?: Entity): void {
    const h = this.helpers.get(entityId);
    if (!h) return;

    const wire = h.getObjectByName("colliderWire") as THREE.Object3D | undefined;
    if (!wire) return;

    // remove old
    const toRemove = wire.children.slice();
    for (const c of toRemove) {
      wire.remove(c);
      try {
        // @ts-ignore
        c.geometry?.dispose?.();
      } catch {}
      try {
        // @ts-ignore
        c.material?.dispose?.();
      } catch {}
    }

    const e = entity;
    if (!e) return;

    const geom = this.buildColliderGeometry(e);
    if (!geom) return;

    const wireGeom = new THREE.WireframeGeometry(geom);
    const mat = new THREE.LineBasicMaterial({
      color: 0xff00ff,
      linewidth: 1,
      depthTest: true,
      transparent: true,
      opacity: 0.7,
    });
    const lines = new THREE.LineSegments(wireGeom, mat);
    lines.renderOrder = 998;
    wire.add(lines);
  }

  // --- Geometry mapping -------------------------------------------------

  private buildColliderGeometry(entity: Entity): THREE.BufferGeometry | null {
    const col = this.getAnyColliderComponent(entity);
    if (!col) return null;

    try {
      switch (col.type) {
        case "sphereCollider":
          return new THREE.SphereGeometry(col.radius, 16, 12);
        case "boxCollider":
          return new THREE.BoxGeometry(col.halfExtents.x * 2, col.halfExtents.y * 2, col.halfExtents.z * 2);
        case "capsuleCollider":
          // Three CapsuleGeometry: (radius, length) where length is cylinder length (total height = length + 2*radius)
          return new THREE.CapsuleGeometry(col.radius, col.halfHeight * 2, 6, 12);
        case "cylinderCollider":
          return new THREE.CylinderGeometry(col.radius, col.radius, col.halfHeight * 2, 16);
        case "coneCollider":
          return new THREE.ConeGeometry(col.radius, col.halfHeight * 2, 16);
        case "terrainCollider":
          return this.buildHeightfieldGeometry(col.heightfield.columns, col.heightfield.rows, col.heightfield.heights, col.heightfield.size.x, col.heightfield.size.z);
        default:
          return null;
      }
    } catch {
      return null;
    }
  }

  private buildHeightfieldGeometry(columns: number, rows: number, heights: number[], sizeX: number, sizeZ: number): THREE.BufferGeometry {
    const cols = Math.max(2, Math.floor(columns));
    const rws = Math.max(2, Math.floor(rows));

    const expected = cols * rws;
    const h = heights.length === expected ? heights : new Array(expected).fill(0);

    const positions = new Float32Array(expected * 3);

    // Centered at origin (matches TerrainColliderComponent doc).
    for (let r = 0; r < rws; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const x = ((c / (cols - 1)) - 0.5) * sizeX;
        const z = ((r / (rws - 1)) - 0.5) * sizeZ;
        const y = Number(h[i] ?? 0);
        positions[i * 3 + 0] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
      }
    }

    const indices: number[] = [];
    for (let r = 0; r < rws - 1; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const i0 = r * cols + c;
        const i1 = r * cols + (c + 1);
        const i2 = (r + 1) * cols + c;
        const i3 = (r + 1) * cols + (c + 1);
        // two triangles
        indices.push(i0, i2, i1);
        indices.push(i1, i2, i3);
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }

  // --- Physics-position matching (mirrors RapierPhysicsSystem limitations) ---

  private computePhysicsColliderWorldPosition(entity: Entity): { x: number; y: number; z: number } {
    // If collider belongs to a rigidbody ancestor, Rapier currently computes offset
    // as a sum of local positions (ignoring rotation). Match that.
    const owner = this.findNearestRigidBodyOwner(entity);
    if (!owner) {
      const wp = entity.transform.worldPosition;
      return { x: wp.x, y: wp.y, z: wp.z };
    }

    const root = owner.transform.worldPosition;
    const offset = this.sumLocalPositionUpTo(entity, owner);
    return { x: root.x + offset.x, y: root.y + offset.y, z: root.z + offset.z };
  }

  private findNearestRigidBodyOwner(entity: Entity): Entity | null {
    let cur: Entity | undefined = entity;
    while (cur) {
      if (cur.getComponent<RigidBodyComponent>("rigidBody")) return cur;
      cur = cur.parent;
    }
    return null;
  }

  private sumLocalPositionUpTo(child: Entity, root: Entity): { x: number; y: number; z: number } {
    if (child.id === root.id) return { x: 0, y: 0, z: 0 };

    let cur: Entity | undefined = child;
    const pos = { x: 0, y: 0, z: 0 };
    while (cur && cur.id !== root.id) {
      const lp = cur.transform.localPosition;
      pos.x += lp.x;
      pos.y += lp.y;
      pos.z += lp.z;
      cur = cur.parent;
    }
    return pos;
  }

  private getAnyColliderComponent(entity: Entity): AnyColliderComponent | undefined {
    return (
      entity.getComponent<SphereColliderComponent>("sphereCollider") ||
      entity.getComponent<BoxColliderComponent>("boxCollider") ||
      entity.getComponent<CapsuleColliderComponent>("capsuleCollider") ||
      entity.getComponent<CylinderColliderComponent>("cylinderCollider") ||
      entity.getComponent<ConeColliderComponent>("coneCollider") ||
      entity.getComponent<TerrainColliderComponent>("terrainCollider")
    );
  }
}

export default DebugColliderSystem;
