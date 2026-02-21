// @ts-ignore
import * as THREE from "three/webgpu";
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
import { DEBUG_LAYERS } from "./DebugLayers";
import { deferredDisposeObject } from "./DebugUtils";
import { syncTransformToObject3D } from "../sync/TransformSync";

/**
 * Manages debug collider helpers for entities.
 *
 * Intent: visualize the *physics* collider shapes (not render meshes).
 * Matches ECS transform conventions (YXZ rotation order, world transforms).
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
        } catch { }
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

    // Important: refreshColliderGeometry reads from this.helpers map.
    // Register the helper before refreshing so geometry actually gets built.
    this.helpers.set(entity.id, group);
    this.refreshColliderGeometry(entity.id, entity);

    // Assign all collider debug objects to a dedicated layer so each
    // view/canvas can independently show/hide collider debug.
    try {
      group.traverse((o: THREE.Object3D) => o.layers.set(DEBUG_LAYERS.colliders));
    } catch { }

    this.scene.add(group);
    this.updateHelperTransform(entity);
  }

  removeHelper(entityId: string): void {
    const h = this.helpers.get(entityId);
    if (!h) return;
    try {
      this.scene.remove(h);
    } catch { }

    deferredDisposeObject(h);

    this.helpers.delete(entityId);
  }

  updateHelperTransform(entity: Entity): void {
    const h = this.helpers.get(entity.id);
    if (!h) return;

    // Use common helper to ensure parity with render meshes and other debug systems.
    syncTransformToObject3D(entity, h);
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
      deferredDisposeObject(c);
    }

    const e = entity;
    if (!e) return;

    // Build a clean outline representation.
    // For primitives, prefer analytic circles/edges (looks "perfect" and not faceted).
    // For heightfields, keep a mesh wireframe.
    const objects = this.buildColliderWireObjects(e);
    for (const o of objects) {
      // render on top of meshes
      (o as any).renderOrder = 998;
      wire.add(o);
    }
  }

  // --- Geometry mapping -------------------------------------------------

  private buildColliderWireObjects(entity: Entity): THREE.Object3D[] {
    const col = this.getAnyColliderComponent(entity);
    if (!col) return [];

    switch (col.type) {
      case "sphereCollider":
        return this.buildSphereOutline(col.radius);
      case "boxCollider":
        return this.buildBoxOutline(col.halfExtents.x * 2, col.halfExtents.y * 2, col.halfExtents.z * 2);
      case "cylinderCollider":
        return this.buildCylinderOutline(col.radius, col.halfHeight * 2);
      case "coneCollider":
        return this.buildConeOutline(col.radius, col.halfHeight * 2);
      case "capsuleCollider":
        return this.buildCapsuleOutline(col.radius, col.halfHeight * 2);
      case "terrainCollider": {
        const geom = this.buildHeightfieldGeometry(
          col.heightfield.columns,
          col.heightfield.rows,
          col.heightfield.heights,
          col.heightfield.size.x,
          col.heightfield.size.z
        );
        const wireGeom = new THREE.WireframeGeometry(geom);
        const mat = this.makeLineMaterial();
        return [new THREE.LineSegments(wireGeom, mat)];
      }
      default:
        return [];
    }
  }

  private makeLineMaterial(): THREE.LineBasicMaterial {
    return new THREE.LineBasicMaterial({
      color: 0xff00ff,
      linewidth: 1,
      // Overlay highlight
      depthTest: false,
      depthWrite: false,
      transparent: true,
      opacity: 0.85,
    });
  }

  private makeCircle(radius: number, segments = 96): THREE.Line {
    const pts: THREE.Vector3[] = [];
    const seg = Math.max(12, Math.floor(segments));
    for (let i = 0; i <= seg; i++) { // <= to include the closing point
      const t = (i / seg) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(t) * radius, Math.sin(t) * radius, 0));
    }
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    return new THREE.Line(geom, this.makeLineMaterial());
  }

  private buildSphereOutline(radius: number): THREE.Object3D[] {
    const cXY = this.makeCircle(radius);
    // cXY already in XY plane

    const cXZ = this.makeCircle(radius);
    cXZ.rotation.x = Math.PI / 2;

    const cYZ = this.makeCircle(radius);
    cYZ.rotation.y = Math.PI / 2;

    return [cXY, cXZ, cYZ];
  }

  private buildBoxOutline(width: number, height: number, depth: number): THREE.Object3D[] {
    const geom = new THREE.BoxGeometry(width, height, depth);
    const edges = new THREE.EdgesGeometry(geom);
    const lines = new THREE.LineSegments(edges, this.makeLineMaterial());
    return [lines];
  }

  private buildCylinderOutline(radius: number, height: number): THREE.Object3D[] {
    const hh = height / 2;
    const top = this.makeCircle(radius);
    top.rotation.x = Math.PI / 2;
    top.position.y = hh;

    const bottom = this.makeCircle(radius);
    bottom.rotation.x = Math.PI / 2;
    bottom.position.y = -hh;

    // A few vertical generatrix lines (cardinal directions) for readability
    const pts: THREE.Vector3[] = [];
    const dirs = [
      { x: radius, z: 0 },
      { x: -radius, z: 0 },
      { x: 0, z: radius },
      { x: 0, z: -radius },
    ];
    for (const d of dirs) {
      pts.push(new THREE.Vector3(d.x, -hh, d.z), new THREE.Vector3(d.x, hh, d.z));
    }
    const vGeom = new THREE.BufferGeometry().setFromPoints(pts);
    const vLines = new THREE.LineSegments(vGeom, this.makeLineMaterial());

    return [top, bottom, vLines];
  }

  private buildConeOutline(radius: number, height: number): THREE.Object3D[] {
    const hh = height / 2;
    // Rapier cone is centered at origin: apex at +hh, base at -hh
    const base = this.makeCircle(radius);
    base.rotation.x = Math.PI / 2;
    base.position.y = -hh;

    const apex = new THREE.Vector3(0, hh, 0);
    const seg = 12;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < seg; i++) {
      const t = (i / seg) * Math.PI * 2;
      const x = Math.cos(t) * radius;
      const z = Math.sin(t) * radius;
      pts.push(new THREE.Vector3(x, -hh, z), apex);
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const side = new THREE.LineSegments(g, this.makeLineMaterial());
    return [base, side];
  }

  private buildCapsuleOutline(radius: number, cylinderHeight: number): THREE.Object3D[] {
    // Capsule is a cylinder of height (cylinderHeight) plus hemispheres.
    // Our debug goal: a clean, readable "perfect" outline rather than a faceted mesh.
    const hh = cylinderHeight / 2;

    // End circles (XZ) at cylinder ends
    const topXZ = this.makeCircle(radius);
    topXZ.rotation.x = Math.PI / 2;
    topXZ.position.y = hh;

    const botXZ = this.makeCircle(radius);
    botXZ.rotation.x = Math.PI / 2;
    botXZ.position.y = -hh;

    // Two orthogonal circles at each cap center to suggest hemispheres
    const topXY = this.makeCircle(radius);
    topXY.position.y = hh;
    const topYZ = this.makeCircle(radius);
    topYZ.rotation.y = Math.PI / 2;
    topYZ.position.y = hh;

    const botXY = this.makeCircle(radius);
    botXY.position.y = -hh;
    const botYZ = this.makeCircle(radius);
    botYZ.rotation.y = Math.PI / 2;
    botYZ.position.y = -hh;

    // Cylinder generatrix lines
    const pts: THREE.Vector3[] = [];
    const dirs = [
      { x: radius, z: 0 },
      { x: -radius, z: 0 },
      { x: 0, z: radius },
      { x: 0, z: -radius },
    ];
    for (const d of dirs) {
      pts.push(new THREE.Vector3(d.x, -hh, d.z), new THREE.Vector3(d.x, hh, d.z));
    }
    const vGeom = new THREE.BufferGeometry().setFromPoints(pts);
    const vLines = new THREE.LineSegments(vGeom, this.makeLineMaterial());

    return [topXZ, botXZ, topXY, topYZ, botXY, botYZ, vLines];
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
