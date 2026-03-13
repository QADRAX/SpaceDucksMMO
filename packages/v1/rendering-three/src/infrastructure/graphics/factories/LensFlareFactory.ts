import * as THREE from "three";
import type { LensFlareComponent } from "@duckengine/core";

function makeCircleTexture(size = 128, color = "#ffffff") {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  grad.addColorStop(0, color);
  grad.addColorStop(0.6, color);
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

export class LensFlareFactory {
  static build(comp: LensFlareComponent): THREE.Object3D {
    const group = new THREE.Group();
    group.name = `lensflare-${comp.type}`;

    // main glow sprite
    // comp.color is expected to be a CSS hex string '#rrggbb'
    const color = (comp.color as string) || "#ffffff";
    const mainTex = makeCircleTexture(256, color);
    const mainMat = new THREE.SpriteMaterial({
      map: mainTex,
      color: new THREE.Color(color),
      transparent: true,
      opacity: comp.intensity ?? 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });
      const mainSprite = new THREE.Sprite(mainMat);
      // Main sprite scale should be independent of intensity (intensity controls opacity).
      // Use a reasonable default world-space scale; inspector can expose this later.
      mainSprite.scale.set(1.2, 1.2, 1);
    mainSprite.renderOrder = 999;
    group.add(mainSprite);

    // additional elements: one sprite per flare element
    if (Array.isArray(comp.flareElements)) {
      for (let i = 0; i < comp.flareElements.length; i++) {
        const e = comp.flareElements[i];
        const tex = makeCircleTexture(128, color);
        const mat = new THREE.SpriteMaterial({
          map: tex,
          transparent: true,
          // clamp opacity 0..1
          opacity: Math.max(0, Math.min(1, e.opacity ?? 0.5)),
          depthWrite: false,
          depthTest: false,
          blending: THREE.AdditiveBlending,
        });
        const s = new THREE.Sprite(mat);
        const scale = e.size ?? 0.5;
        s.scale.set(scale, scale, 1);
        // DO NOT set screen/world position here. Placement is handled by RenderSyncSystem.
        // Store element parameters on the sprite for the sync system to read.
        (s as any).userData = { distance: e.distance ?? 0, size: e.size ?? scale, opacity: e.opacity ?? 1 };
        s.renderOrder = 999;
        group.add(s);
      }
    }

    // store metadata for easier updates later
    // store reference to component for easy updates
    (group as any).__lensflareMeta = { comp };
    return group;
  }
}

export default LensFlareFactory;
