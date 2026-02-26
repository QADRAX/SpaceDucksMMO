// @ts-ignore
import * as THREE from "three/webgpu";
import type { Entity } from "@duckengine/core";
import type { RenderObjectRegistry } from "../sync/RenderObjectRegistry";
import { DEBUG_LAYERS } from "./DebugLayers";
import { deferredDisposeObject } from "./DebugUtils";

/**
 * Manages debug mesh helpers (wireframes) for entities.
 *
 * Intent: visualize the *render mesh* geometry as a wireframe overlay.
 * This is intentionally separate from transform gizmos so it can be toggled
 * independently at scene/view/entity level.
 */
export class DebugMeshSystem {
  private readonly scene: THREE.Scene;
  private readonly registry: RenderObjectRegistry;

  private readonly helpers = new Map<string, THREE.Object3D>();
  private masterEnabled = false;
  /** Set of entity ids that must never show mesh debug (e.g., active camera). */
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
      if (this.masterEnabled) {
        try {
          this.refreshWireframeForEntity(id);
        } catch { }
      }
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

    const wants =
      this.masterEnabled &&
      (typeof (entity as any).isDebugMeshEnabled === "function" ? !!(entity as any).isDebugMeshEnabled() : false);

    if (wants) {
      if (!exists) this.ensureHelper(entity);
      else {
        this.refreshWireframeForEntity(entity.id);
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
    group.name = `debugMesh:${entity.id}`;
    group.visible = this.masterEnabled;

    const wire = new THREE.Object3D();
    wire.name = "wire";
    group.add(wire);

    // Important: refreshWireframeForEntity reads from this.helpers map.
    this.helpers.set(entity.id, group);
    this.refreshWireframeForEntity(entity.id);

    // Assign all mesh debug objects to a dedicated layer so each
    // view/canvas can independently show/hide mesh debug.
    try {
      group.traverse((o: THREE.Object3D) => o.layers.set(DEBUG_LAYERS.mesh));
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

    const wp = entity.transform.worldPosition;
    const wr = entity.transform.worldRotation;

    h.position.set(wp.x, wp.y, wp.z);
    h.rotation.order = "YXZ";
    h.rotation.set(wr.x, wr.y, wr.z);

    // Apply world scale so wireframe matches the visual mesh.
    const ws = entity.transform.worldScale;
    h.scale.set(ws.x, ws.y, ws.z);
  }

  private createWireframeFromGeometry(geom: THREE.BufferGeometry): THREE.LineSegments {
    const wireGeom = new THREE.WireframeGeometry(geom);
    const mat = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      linewidth: 1,
      depthTest: true,
      transparent: true,
      opacity: 0.6,
    });
    const lines = new THREE.LineSegments(wireGeom, mat);
    lines.renderOrder = 999;
    lines.layers.set(DEBUG_LAYERS.mesh);
    return lines;
  }

  /** Refresh (rebuild/remove) the wireframe child for a given entity id. */
  refreshWireframeForEntity(entityId: string): void {
    if (!this.masterEnabled) return;
    const h = this.helpers.get(entityId);
    if (!h) return;
    const wire = h.getObjectByName("wire") as THREE.Object3D | undefined;
    if (!wire) return;

    // remove old
    const toRemove = wire.children.slice();
    for (const c of toRemove) {
      wire.remove(c);
      deferredDisposeObject(c);
    }

    // Try to find geometry from registry
    try {
      const rc = this.registry.get(entityId);
      const geometry = rc?.geometry ?? (rc?.object3D && (rc.object3D as any).geometry);
      if (geometry && geometry instanceof THREE.BufferGeometry) {
        wire.add(this.createWireframeFromGeometry(geometry));
        return;
      }

      // Fallback for complex render objects (e.g., fullMesh uses a Group placeholder):
      // traverse child meshes and add a wireframe for each geometry.
      const root = rc?.object3D as THREE.Object3D | undefined;
      if (!root) return;

      try {
        root.updateMatrixWorld(true);
      } catch { }

      let rootInv: THREE.Matrix4 | null = null;
      try {
        rootInv = new THREE.Matrix4().copy(root.matrixWorld).invert();
      } catch {
        rootInv = null;
      }

      const relPos = new THREE.Vector3();
      const relQuat = new THREE.Quaternion();
      const relScale = new THREE.Vector3();
      const relMat = new THREE.Matrix4();

      root.traverse((n: any) => {
        try {
          if (!n || !n.isMesh) return;
          const geom = n.geometry as THREE.BufferGeometry | undefined;
          if (!(geom instanceof THREE.BufferGeometry)) return;

          const lines = this.createWireframeFromGeometry(geom);

          // Position the wireframe to match this mesh relative to the entity root.
          if (rootInv) {
            try {
              n.updateMatrixWorld(true);
              relMat.multiplyMatrices(rootInv as THREE.Matrix4, n.matrixWorld);
              relMat.decompose(relPos, relQuat, relScale);
              lines.position.copy(relPos);
              lines.quaternion.copy(relQuat);
              lines.scale.copy(relScale);
            } catch { }
          } else {
            // Best-effort: at least apply local transform.
            try {
              lines.position.copy(n.position);
              lines.quaternion.copy(n.quaternion);
              lines.scale.copy(n.scale);
            } catch { }
          }

          wire.add(lines);
        } catch { }
      });
    } catch { }
  }

  clear(): void {
    for (const id of Array.from(this.helpers.keys())) this.removeHelper(id);
  }
}

export default DebugMeshSystem;
