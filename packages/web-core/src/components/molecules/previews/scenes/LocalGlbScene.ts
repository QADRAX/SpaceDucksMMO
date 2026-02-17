import * as THREE from 'three';
import {
    BaseScene,
    CameraViewComponent,
    Entity,
    type ISettingsService,
    AmbientLightComponent,
    DirectionalLightComponent,
} from '@duckengine/rendering-three';
import type { BasePreviewSettings } from '../utils/previewUtils';

export type LocalGlbPreviewSettings = BasePreviewSettings & {
    camera: { x: number; y: number; z: number };
    lights: {
        ambientIntensity: number;
        directionalIntensity: number;
        directionalX: number;
        directionalY: number;
        directionalZ: number;
    };
};

type LoadState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'loaded' }
    | { status: 'error'; message: string };

async function getGltfLoader() {
    const mod = await import('three/addons/loaders/GLTFLoader.js');
    return new mod.GLTFLoader();
}

function disposeObject3D(obj: THREE.Object3D) {
    obj.traverse((child) => {
        const anyChild = child as any;
        if (anyChild.geometry) try { anyChild.geometry.dispose?.(); } catch { }
        if (anyChild.material) {
            const mats = Array.isArray(anyChild.material) ? anyChild.material : [anyChild.material];
            for (const m of mats) try { m.dispose?.(); } catch { }
        }
    });
}

function computeRadius(obj: THREE.Object3D): { center: THREE.Vector3; radius: number } {
    const box = new THREE.Box3().setFromObject(obj);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const size = new THREE.Vector3();
    box.getSize(size);
    const radius = Math.max(size.x, size.y, size.z) * 0.5;
    return { center, radius: Number.isFinite(radius) && radius > 0 ? radius : 1 };
}

export class LocalGlbScene extends BaseScene {
    readonly id = 'local-glb-preview';

    public root: THREE.Group | null = null;
    public mixer: THREE.AnimationMixer | null = null;
    public actions: Map<string, THREE.AnimationAction> = new Map();
    public loadState: LoadState = { status: 'idle' };

    private camera?: Entity;
    private ambient?: Entity;
    private dir?: Entity;
    private objectUrl: string | null = null;
    private previewSettings: LocalGlbPreviewSettings;

    constructor(settings: ISettingsService, previewSettings: LocalGlbPreviewSettings) {
        super(settings);
        this.previewSettings = previewSettings;
    }

    private threeScene: THREE.Scene | null = null;

    setup(engine: any, renderScene: any): void {
        super.setup(engine, renderScene);
        this.threeScene = renderScene;

        const camera = new Entity('camera', [0, 0, 3.25]);
        camera.addComponent(new CameraViewComponent({ fov: 55, near: 0.1, far: 5000, aspect: 1 }));
        this.addEntity(camera);
        this.setActiveCamera(camera.id);
        this.camera = camera;

        this.ambient = new Entity('ambient');
        this.ambient.addComponent(new AmbientLightComponent({ intensity: 0.9 } as any));
        this.addEntity(this.ambient);

        this.dir = new Entity('dirLight', [2.5, 2.5, 2.5]);
        this.dir.addComponent(new DirectionalLightComponent({ intensity: 1.25 } as any));
        this.addEntity(this.dir);

        this.applyPreviewSettings(this.previewSettings);
    }

    applyPreviewSettings(next: LocalGlbPreviewSettings) {
        this.previewSettings = next;
        if (this.camera) {
            this.camera.transform.setPosition(next.camera.x ?? 0, next.camera.y ?? 0, next.camera.z ?? 3.25);
            this.camera.transform.lookAt({ x: 0, y: 0, z: 0 });
        }
        if (this.ambient) {
            const c = this.ambient.getComponent<any>('ambientLight');
            if (c) c.intensity = next.lights.ambientIntensity;
        }
        if (this.dir) {
            this.dir.transform.setPosition(next.lights.directionalX, next.lights.directionalY, next.lights.directionalZ);
            const c = this.dir.getComponent<any>('directionalLight');
            if (c) c.intensity = next.lights.directionalIntensity;
        }
    }

    async loadFile(file: File, showAnimations: boolean): Promise<{ name: string; duration: number }[]> {
        this.cleanup();
        this.loadState = { status: 'loading' };

        try {
            this.objectUrl = URL.createObjectURL(file);
            const loader = await getGltfLoader();
            const gltf = await loader.loadAsync(this.objectUrl);

            const root = gltf.scene || new THREE.Group();
            this.root = root;

            root.traverse((obj) => {
                const mesh = obj as THREE.Mesh;
                if (!mesh.isMesh) return;
                if (!mesh.material) {
                    mesh.material = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.6, metalness: 0.1 });
                }
                mesh.castShadow = false;
                mesh.receiveShadow = false;
            });

            const { center, radius } = computeRadius(root);
            root.position.sub(center);
            if (this.threeScene) this.threeScene.add(root);

            if (showAnimations && Array.isArray(gltf.animations) && gltf.animations.length > 0) {
                this.mixer = new THREE.AnimationMixer(root);
                for (const clip of gltf.animations) {
                    const name = String(clip.name || '');
                    this.actions.set(name || `clip_${this.actions.size}`, this.mixer.clipAction(clip));
                }
                const animList = gltf.animations.map(c => ({
                    name: String(c.name || ''),
                    duration: Number(c.duration || 0)
                }));
                this.loadState = { status: 'loaded' };
                return animList;
            }

            this.loadState = { status: 'loaded' };
            return [];
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Failed to load GLB';
            console.error('[LocalGlbScene] load failed', e);
            this.loadState = { status: 'error', message: msg };
            return [];
        }
    }

    playAction(name: string, loop: boolean) {
        const action = this.actions.get(name);
        if (!action) return;
        action.paused = false;
        action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
        action.play();
    }

    stopAction(name: string) {
        const action = this.actions.get(name);
        if (!action) return;
        action.stop();
        action.reset();
    }

    pauseAction(name: string) {
        const action = this.actions.get(name);
        if (action) action.paused = true;
    }

    seekAction(name: string, time: number) {
        const action = this.actions.get(name);
        if (action) action.time = time;
    }

    cleanup() {
        if (this.root) {
            if (this.threeScene) this.threeScene.remove(this.root);
            disposeObject3D(this.root);
            this.root = null;
        }
        if (this.objectUrl) {
            URL.revokeObjectURL(this.objectUrl);
            this.objectUrl = null;
        }
        this.mixer = null;
        this.actions.clear();
    }

    update(dt: number) {
        super.update(dt);
        if (this.root && this.previewSettings.rotation.enabled) {
            const secs = dt / 1000;
            const speed = this.previewSettings.rotation.speed;
            const delta = secs * speed;
            switch (this.previewSettings.rotation.axis) {
                case 'x': this.root.rotation.x += delta; break;
                case 'z': this.root.rotation.z += delta; break;
                case 'y': default: this.root.rotation.y += delta; break;
            }
        }
        if (this.mixer) {
            this.mixer.update(dt / 1000);
        }
    }

    dispose() {
        this.cleanup();
        // @ts-ignore
        if (super.dispose) super.dispose();
    }
}
