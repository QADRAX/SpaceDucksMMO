// @ts-ignore
import * as THREE from "three/webgpu";
import type { IGizmoDrawer } from "../IGizmoDrawer";

export class LabelGizmoDrawer implements IGizmoDrawer {
    private readonly group: THREE.Object3D;
    private readonly layer: number;

    private sprites: THREE.Sprite[] = [];
    private index = 0;

    // Cache to avoid recreating identical text textures
    private textureCache = new Map<string, THREE.CanvasTexture>();

    constructor(group: THREE.Object3D, layer: number) {
        this.group = group;
        this.layer = layer;
    }

    private getTextTexture(text: string, colorHex: string): THREE.CanvasTexture {
        const key = `${text}-${colorHex}`;
        let tex = this.textureCache.get(key);
        if (tex) return tex;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;

        ctx.font = "bold 48px sans-serif";
        const textMetrics = ctx.measureText(text);

        // Add padding
        canvas.width = Math.ceil(textMetrics.width) + 20;
        canvas.height = 60; // Fixed somewhat large height

        // Re-set font after resize
        ctx.font = "bold 48px sans-serif";
        ctx.fillStyle = colorHex;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Draw text and a subtle drop shadow for readability
        ctx.shadowColor = "black";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        tex.colorSpace = THREE.SRGBColorSpace;

        this.textureCache.set(key, tex);
        return tex;
    }

    public draw(text: string, x: number, y: number, z: number, colorHex: string): void {
        let sprite: THREE.Sprite;
        const tex = this.getTextTexture(text, colorHex);

        if (this.index < this.sprites.length) {
            sprite = this.sprites[this.index];
            sprite.material.map = tex;
        } else {
            const mat = new THREE.SpriteMaterial({
                map: tex,
                depthTest: false,
                depthWrite: false,
                transparent: true
            });
            sprite = new THREE.Sprite(mat);
            sprite.renderOrder = 999;
            sprite.layers.set(this.layer);
            this.sprites.push(sprite);
            this.group.add(sprite);
        }

        // Scale the sprite based on the canvas aspect ratio so it doesn't look stretched
        const aspect = tex.image.width / tex.image.height;
        // Base scale: 1 unit high, aspect units wide. Tweak as needed.
        sprite.scale.set(aspect * 0.5, 0.5, 1);
        sprite.position.set(x, y, z);

        sprite.visible = true;
        this.index++;
    }

    public clear(): void {
        for (let i = 0; i < this.index; i++) {
            this.sprites[i].visible = false;
        }
        this.index = 0;
    }

    public dispose(): void {
        for (const tex of this.textureCache.values()) {
            tex.dispose();
        }
        this.textureCache.clear();

        for (const sprite of this.sprites) {
            sprite.material.dispose();
            this.group.remove(sprite);
        }
        this.sprites = [];
        this.index = 0;
    }
}
