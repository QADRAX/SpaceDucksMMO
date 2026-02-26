import {
    AmbientLightComponent,
    BaseScene,
    BasicMaterialComponent,
    CameraViewComponent,
    DirectionalLightComponent,
    Entity,
    LambertMaterialComponent,
    PhongMaterialComponent,
    StandardMaterialComponent,
    type ISettingsService,
} from '@duckengine/rendering-three';
import { CustomGeometryComponent, FullMeshComponent, TextureTilingComponent } from '@duckengine/core';
import type { BasePreviewSettings } from '../utils/previewUtils';
import type { MaterialResourceKind } from '@/lib/types';

export type CustomMeshPreviewSettings = BasePreviewSettings & {
    tiling: {
        repeatU: number;
        repeatV: number;
        offsetU: number;
        offsetV: number;
    };
    lights: {
        ambientIntensity: number;
        directionalIntensity: number;
        directionalX: number;
        directionalY: number;
        directionalZ: number;
    };
    material: {
        source: 'inline' | 'system';
        systemKey: string;
    };
};

function createMaterialComponent(kind: MaterialResourceKind, data: Record<string, unknown>) {
    switch (kind) {
        case 'basicMaterial':
            return new BasicMaterialComponent(data as any);
        case 'lambertMaterial':
            return new LambertMaterialComponent(data as any);
        case 'phongMaterial':
            return new PhongMaterialComponent(data as any);
        case 'standardMaterial':
        default:
            return new StandardMaterialComponent(data as any);
    }
}

export class CustomMeshPreviewScene extends BaseScene {
    readonly id: string;

    private mesh?: Entity;
    private camera?: Entity;
    private ambient?: Entity;
    private dir?: Entity;

    private rotationEnabled = true;
    private rotationSpeed = 0.35; // rad/sec

    private readonly disableMaterialOverrides: boolean;
    private resourceKey: string;

    constructor(settings: ISettingsService, resourceKey: string, disableMaterialOverrides = false) {
        super(settings);
        this.resourceKey = resourceKey;
        this.disableMaterialOverrides = !!disableMaterialOverrides;
        this.id = this.disableMaterialOverrides ? 'admin-fullmesh-preview' : 'admin-custom-mesh-preview';
    }

    setup(engine: any, renderScene: any): void {
        super.setup(engine, renderScene);

        this.camera = new Entity('camera', [0, 0, 3.25]);
        this.camera.addComponent(new CameraViewComponent({ fov: 55, near: 0.1, far: 2000, aspect: 1 }));
        this.addEntity(this.camera);
        this.setActiveCamera(this.camera.id);
        this.camera.transform.lookAt({ x: 0, y: 0, z: 0 });

        this.ambient = new Entity('ambient');
        this.ambient.addComponent(new AmbientLightComponent({ intensity: 0.9 } as any));
        this.addEntity(this.ambient);

        this.dir = new Entity('dirLight', [2.5, 2.5, 2.5]);
        this.dir.addComponent(new DirectionalLightComponent({ intensity: 1.25 } as any));
        this.addEntity(this.dir);

        // Mesh entity setup
        this.mesh = new Entity('mesh');
        if (this.disableMaterialOverrides) {
            this.mesh.addComponent(new FullMeshComponent({ key: this.resourceKey }));
        } else {
            this.mesh.addComponent(new CustomGeometryComponent({ key: this.resourceKey }));
            this.mesh.addComponent(this.createInlineMaterial());
            this.mesh.addComponent(new TextureTilingComponent() as any);
        }
        this.addEntity(this.mesh);
    }

    private createInlineMaterial() {
        return new StandardMaterialComponent({
            color: '#d1d5db',
            roughness: 0.6,
            metalness: 0.1,
        } as any);
    }

    applyPreviewSettings(next: CustomMeshPreviewSettings) {
        if (this.camera) {
            this.camera.transform.setPosition(next.camera.x ?? 0, next.camera.y ?? 0, next.camera.z ?? 3.25);
            this.camera.transform.lookAt({ x: 0, y: 0, z: 0 });
        }

        if (this.ambient) {
            try {
                const a = this.ambient.getComponent<AmbientLightComponent>('ambientLight');
                (a as any).intensity = next.lights.ambientIntensity;
            } catch {
                // ignore
            }
        }

        if (this.dir) {
            this.dir.transform.setPosition(next.lights.directionalX, next.lights.directionalY, next.lights.directionalZ);
            try {
                const d = this.dir.getComponent<DirectionalLightComponent>('directionalLight');
                (d as any).intensity = next.lights.directionalIntensity;
            } catch {
                // ignore
            }
        }

        this.rotationEnabled = next.rotation.enabled;
        this.rotationSpeed = next.rotation.speed;

        if (this.mesh && !this.disableMaterialOverrides) {
            let tiling = this.mesh.getComponent<any>('textureTiling');
            if (!tiling) {
                this.mesh.addComponent(new TextureTilingComponent() as any);
                tiling = this.mesh.getComponent<any>('textureTiling');
            }
            if (tiling) {
                tiling.repeatU = next.tiling.repeatU;
                tiling.repeatV = next.tiling.repeatV;
                tiling.offsetU = next.tiling.offsetU;
                tiling.offsetV = next.tiling.offsetV;
            }
        }
    }

    setInlineMaterial() {
        if (!this.mesh || this.disableMaterialOverrides) return;
        this.removeMaterialComponents();
        this.mesh.addComponent(this.createInlineMaterial());
    }

    setMaterialFromResource(kind: MaterialResourceKind, componentData: Record<string, unknown>) {
        if (!this.mesh || this.disableMaterialOverrides) return;
        this.removeMaterialComponents();
        this.mesh.addComponent(createMaterialComponent(kind, componentData));
    }

    private removeMaterialComponents() {
        if (!this.mesh) return;
        const types: MaterialResourceKind[] = ['basicMaterial', 'lambertMaterial', 'phongMaterial', 'standardMaterial'];
        for (const t of types) {
            if (this.mesh.hasComponent(t)) this.mesh.removeComponent(t);
        }
    }

    setResourceKey(next: string) {
        this.resourceKey = next;
        if (!this.mesh) return;

        const existingCustom = this.mesh.getComponent<CustomGeometryComponent>('customGeometry');
        const existingFull = this.mesh.getComponent<FullMeshComponent>('fullMesh');

        if (this.disableMaterialOverrides) {
            if (existingFull && existingFull.key === next) return;
        } else {
            if (existingCustom && existingCustom.key === next) return;
        }

        try {
            if (this.mesh.hasComponent('customGeometry')) this.mesh.removeComponent('customGeometry');
        } catch { }
        try {
            if (this.mesh.hasComponent('fullMesh')) this.mesh.removeComponent('fullMesh');
        } catch { }

        if (this.disableMaterialOverrides) {
            this.mesh.addComponent(new FullMeshComponent({ key: next }));
        } else {
            this.mesh.addComponent(new CustomGeometryComponent({ key: next }));
        }
    }

    update(dt: number): void {
        super.update(dt);
        if (!this.mesh) return;
        if (!this.rotationEnabled) return;
        const secs = dt / 1000;
        const r = this.mesh.transform.localRotation;
        this.mesh.transform.setRotation(r.x, r.y + secs * this.rotationSpeed, r.z);
    }
}
