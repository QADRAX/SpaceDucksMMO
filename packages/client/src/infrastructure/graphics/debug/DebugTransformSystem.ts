import * as THREE from "three";
import type { Entity } from "@client/domain/ecs/core/Entity";
import type { RenderObjectRegistry } from "../sync/RenderObjectRegistry";

/**
 * Manages debug transform helpers for entities.
 *
 * Design: helpers are visual-only and do not affect rendering of real objects.
 * Each helper is a grouped Object3D containing an AxesHelper and an ArrowHelper
 * indicating the local forward (Z+) direction.
 */
export class DebugTransformSystem {
  private readonly scene: THREE.Scene;
  private readonly registry: RenderObjectRegistry;
  private readonly helpers = new Map<string, THREE.Object3D>();
  private masterEnabled = false;
  /** Set of entity ids that must never show a helper (e.g., active camera) */
  private forbidden = new Set<string>();

  constructor(scene: THREE.Scene, registry: RenderObjectRegistry) {
    this.scene = scene;
    this.registry = registry;
  }

  setMasterEnabled(enabled: boolean): void {
    this.masterEnabled = !!enabled;
    for (const [id, h] of this.helpers.entries()) {
      // If entity is forbidden, ensure helper is removed/hidden
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

  ensureHelper(entity: Entity): void {
    if (!this.masterEnabled) return;
    if (this.forbidden.has(entity.id)) return;
    if (this.helpers.has(entity.id)) return;
    const group = new THREE.Object3D();
    group.name = `debug:${entity.id}`;

    // We keep two sub-groups so we can have fixed-size visuals and
    // optionally a wireframe that mirrors the real mesh size.
    const visuals = new THREE.Object3D();
    visuals.name = "visuals";
    // Axes helper (local axes) - will be scaled to fixed world size via visuals
    const axes = new THREE.AxesHelper(1);
    axes.renderOrder = 1000;
    visuals.add(axes);

    // Arrow helper pointing forward (Z+ in our convention: forward is -Z in engine; show world forward)
    const dir = new THREE.Vector3(0, 0, -1);
    const origin = new THREE.Vector3(0, 0, 0);
    const arrow = new THREE.ArrowHelper(dir, origin, 1, 0xffff00);
    arrow.renderOrder = 1000;
    visuals.add(arrow);

    // Label sprite
    const label = this.createLabelForEntity(entity);
    label.name = "labelSprite";
    // position label slightly above origin
    label.position.set(0, 1.2, 0);
    visuals.add(label);

    // Wireframe group: stays at identity scale so it follows actual mesh size
    const wireframeGroup = new THREE.Object3D();
    wireframeGroup.name = "wireframeGroup";

    // Keep visibility in sync with master flag
    group.visible = this.masterEnabled;

    // Attach groups
    group.add(visuals);
    group.add(wireframeGroup);

    // If there's a render component with geometry, add wireframe
    try {
      const rc = this.registry.get(entity.id);
      const geometry = rc?.geometry ?? (rc?.object3D && (rc.object3D as any).geometry);
      if (geometry && geometry instanceof THREE.BufferGeometry) {
        const wf = this.createWireframeFromGeometry(geometry);
        wireframeGroup.add(wf);
      }
    } catch {}

    this.scene.add(group);
    this.helpers.set(entity.id, group);
    // immediately sync transform
    this.updateHelperTransform(entity);
  }

  removeHelper(entityId: string): void {
    const h = this.helpers.get(entityId);
    if (!h) return;
    try {
      this.scene.remove(h);
    } catch {}
    // dispose children geometries/materials if any
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

  /** Mark an entity id as forbidden (never show helper). */
  addForbiddenEntity(entityId: string): void {
    if (this.forbidden.has(entityId)) return;
    this.forbidden.add(entityId);
    // remove existing helper if any
    if (this.helpers.has(entityId)) this.removeHelper(entityId);
  }

  /** Remove an entity id from the forbidden list. */
  removeForbiddenEntity(entityId: string): void {
    if (!this.forbidden.has(entityId)) return;
    this.forbidden.delete(entityId);
  }

  updateHelperTransform(entity: Entity): void {
    const h = this.helpers.get(entity.id);
    if (!h) return;
    const wp = entity.transform.worldPosition;
    const wr = entity.transform.worldRotation;
    const baseSize = 1; // fixed world-space size for visuals
    h.position.set(wp.x, wp.y, wp.z);
    h.rotation.set(wr.x, wr.y, wr.z);
    // visuals sub-group gets scaled to fixed world-space size
    const visuals = h.getObjectByName("visuals") as THREE.Object3D | undefined;
    if (visuals) {
      // @ts-ignore setScalar exists on Vector3
      visuals.scale.setScalar(baseSize);
    }
    // wireframeGroup should keep identity scale so wireframe matches actual mesh size
    const wireframeGroup = h.getObjectByName("wireframeGroup") as THREE.Object3D | undefined;
    if (wireframeGroup) {
      wireframeGroup.scale.set(1, 1, 1);
    }
  }

  /** Update label sprites so they face the provided camera (billboard). */
  updateLabels(camera: THREE.Camera): void {
    if (!camera) return;
    for (const [id, group] of this.helpers.entries()) {
      // ensure forbidden entities don't have helpers, but double-check
      if (this.forbidden.has(id)) continue;
      const label = group.getObjectByName("labelSprite") as THREE.Sprite | undefined;
      if (!label) continue;
      // billboard: copy camera quaternion
      label.quaternion.copy(camera.quaternion);
    }
  }

  private createLabelForEntity(entity: Entity): THREE.Sprite {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    // background transparent
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw icon on left
    const iconSize = 40;
    const pad = 8;
    // heuristic for icon type
    let icon = "?";
    try {
      if (entity.getComponent("cameraView")) icon = "📷";
      else if (entity.getComponent("ambientLight") || entity.getComponent("directionalLight") || entity.getComponent("pointLight") || entity.getComponent("spotLight")) icon = "💡";
      else if (entity.getComponent("boxGeometry") || entity.getComponent("sphereGeometry") || entity.getComponent("planeGeometry") || entity.getComponent("customGeometry")) icon = "▦";
      else icon = "•";
    } catch {
      icon = "•";
    }

    ctx.font = "32px sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.fillText(icon, pad, canvas.height / 2);

    // draw id text truncated if too long
    let idText = entity.id;
    if (idText.length > 16) idText = idText.slice(0, 12) + "…";
    ctx.font = "18px sans-serif";
    ctx.fillStyle = "white";
    ctx.fillText(idText, pad + iconSize, canvas.height / 2);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;

    const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true });
    const sprite = new THREE.Sprite(mat);
    // fixed visual size in world units
    const worldSize = 0.8;
    sprite.scale.set(worldSize * 2, worldSize * 0.5, 1);
    return sprite;
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
    return lines;
  }

  /** Refresh (rebuild/remove) the wireframe child for a given entity id. */
  refreshWireframeForEntity(entityId: string): void {
    const h = this.helpers.get(entityId);
    if (!h) return;
    const wireframeGroup = h.getObjectByName("wireframeGroup") as THREE.Object3D | undefined;
    if (!wireframeGroup) return;
    // Remove existing children and dispose their geometries/materials
    const toRemove = wireframeGroup.children.slice();
    for (const c of toRemove) {
      wireframeGroup.remove(c);
      c.traverse((o) => {
        const geom = (o as any).geometry as THREE.BufferGeometry | undefined;
        if (geom) {
          try {
            geom.dispose();
          } catch {}
        }
        const mat = (o as any).material as THREE.Material | THREE.Material[] | undefined;
        if (mat) {
          try {
            if (Array.isArray(mat)) (mat as THREE.Material[]).forEach((m) => m.dispose());
            else (mat as THREE.Material).dispose();
          } catch {}
        }
      });
    }

    // Try to find geometry from registry
    try {
      const rc = this.registry.get(entityId);
      const geometry = rc?.geometry ?? (rc?.object3D && (rc.object3D as any).geometry);
      if (geometry && geometry instanceof THREE.BufferGeometry) {
        const wf = this.createWireframeFromGeometry(geometry);
        wireframeGroup.add(wf);
      }
    } catch {}
  }

  recreateForEntityIfNeeded(entity: Entity): void {
    const exists = this.helpers.has(entity.id);
    if (this.forbidden.has(entity.id)) {
      if (exists) this.removeHelper(entity.id);
      return;
    }
    if (entity.isDebugTransformEnabled() && this.masterEnabled) {
      if (!exists) this.ensureHelper(entity);
      else this.updateHelperTransform(entity);
    } else {
      if (exists) this.removeHelper(entity.id);
    }
  }

  clear(): void {
    for (const id of Array.from(this.helpers.keys())) this.removeHelper(id);
  }
}

export default DebugTransformSystem;
