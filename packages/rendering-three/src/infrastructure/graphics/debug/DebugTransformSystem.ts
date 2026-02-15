import * as THREE from "three";
import type { Entity } from "@duckengine/ecs";
import { DEBUG_LAYERS } from "./DebugLayers";

/**
 * Manages debug transform helpers for entities.
 *
 * Design: helpers are visual-only and do not affect rendering of real objects.
 * Each helper is a grouped Object3D containing an AxesHelper and an ArrowHelper
 * indicating the local forward (Z+) direction.
 */
export class DebugTransformSystem {
  private readonly scene: THREE.Scene;
  private readonly helpers = new Map<string, THREE.Object3D>();
  private readonly presentationUnsubById = new Map<string, () => void>();
  private masterEnabled = false;
  /** Set of entity ids that must never show a helper (e.g., active camera) */
  private forbidden = new Set<string>();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
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

  ensureHelper(entity: Entity): void {
    if (!this.masterEnabled) return;
    if (this.forbidden.has(entity.id)) return;
    if (this.helpers.has(entity.id)) return;
    const group = new THREE.Object3D();
    group.name = `debug:${entity.id}`;

    // We keep a sub-group so we can keep fixed-size visuals.
    const visuals = new THREE.Object3D();
    visuals.name = "visuals";
    this.ensureVisualsForEntity(entity, visuals);

    group.visible = this.masterEnabled;
    visuals.visible = this.masterEnabled;

    group.add(visuals);

    // Assign all transform debug objects to a dedicated layer so renderers/views can
    // independently include/exclude transform gizmos.
    try {
      visuals.traverse((o) => o.layers.set(DEBUG_LAYERS.transforms));
    } catch {}

    this.scene.add(group);
    this.helpers.set(entity.id, group);

    // Keep label in sync with editor-facing properties (displayName/gizmoIcon).
    try {
      const listener = () => this.refreshLabel(entity);
      entity.addPresentationListener(listener);
      this.presentationUnsubById.set(entity.id, () => {
        try {
          entity.removePresentationListener(listener);
        } catch {}
      });
    } catch {}

    // immediately sync transform
    this.updateHelperTransform(entity);
  }

  private ensureVisualsForEntity(entity: Entity, visuals: THREE.Object3D): void {
    if (visuals.children.length) return;

    const axes = new THREE.AxesHelper(1);
    axes.renderOrder = 1000;
    axes.layers.set(DEBUG_LAYERS.transforms);
    // Always visible (overlay) like collider debug lines
    try {
      const m = (axes.material as unknown as THREE.LineBasicMaterial);
      m.depthTest = false;
      m.depthWrite = false;
      m.transparent = true;
      m.opacity = 1;
    } catch {}
    visuals.add(axes);

    const dir = new THREE.Vector3(0, 0, -1);
    const origin = new THREE.Vector3(0, 0, 0);
    const arrow = new THREE.ArrowHelper(dir, origin, 1, 0xffff00);
    arrow.renderOrder = 1000;
    arrow.layers.set(DEBUG_LAYERS.transforms);
    // Always visible (overlay)
    try {
      arrow.traverse((o) => {
        const mat = (o as any).material as THREE.Material | THREE.Material[] | undefined;
        if (!mat) return;
        const apply = (m: THREE.Material) => {
          (m as any).depthTest = false;
          (m as any).depthWrite = false;
          (m as any).transparent = true;
          if (typeof (m as any).opacity === 'number') (m as any).opacity = 1;
        };
        if (Array.isArray(mat)) mat.forEach(apply);
        else apply(mat);
      });
    } catch {}
    visuals.add(arrow);

    const label = this.createLabelForEntity(entity);
    label.name = 'labelSprite';
    label.position.set(0, 1.2, 0);
    label.layers.set(DEBUG_LAYERS.transforms);
    visuals.add(label);
  }

  private clearAndDisposeGroupChildren(group: THREE.Object3D): void {
    const toRemove = group.children.slice();
    for (const c of toRemove) {
      group.remove(c);
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
            if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
            else mat.dispose();
          } catch {}
        }
        const map = (o as any).map as THREE.Texture | undefined;
        if (map) {
          try {
            map.dispose();
          } catch {}
        }
      });
    }
  }

  removeHelper(entityId: string): void {
    const h = this.helpers.get(entityId);
    if (!h) return;

    try {
      this.presentationUnsubById.get(entityId)?.();
    } catch {}
    this.presentationUnsubById.delete(entityId);

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

  private refreshLabel(entity: Entity): void {
    const h = this.helpers.get(entity.id);
    if (!h) return;
    const visuals = h.getObjectByName("visuals") as THREE.Object3D | undefined;
    if (!visuals) return;

    const existing = visuals.getObjectByName('labelSprite');
    if (existing) {
      visuals.remove(existing);
      existing.traverse((o) => {
        const mat = (o as any).material as THREE.Material | THREE.Material[] | undefined;
        if (mat) {
          try {
            if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
            else mat.dispose();
          } catch {}
        }
        const map = (o as any).map as THREE.Texture | undefined;
        if (map) {
          try {
            map.dispose();
          } catch {}
        }
      });
    }

    const label = this.createLabelForEntity(entity);
    label.name = 'labelSprite';
    label.position.set(0, 1.2, 0);
    label.layers.set(DEBUG_LAYERS.transforms);
    visuals.add(label);
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
      const forced = entity.gizmoIcon;
      if (typeof forced === 'string' && forced.trim()) icon = forced.trim();
      else
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
    const dn = entity.displayName;
    let idText = (typeof dn === 'string' && dn.trim()) ? dn.trim() : entity.id;
    if (idText.length > 20) idText = idText.slice(0, 17) + "…";
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

  recreateForEntityIfNeeded(entity: Entity): void {
    const exists = this.helpers.has(entity.id);
    if (this.forbidden.has(entity.id)) {
      if (exists) this.removeHelper(entity.id);
      return;
    }
    const wants = this.masterEnabled && entity.isDebugTransformEnabled();

    if (wants) {
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
