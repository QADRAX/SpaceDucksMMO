import {
    AmbientLightComponent,
    BaseScene,
    BasicMaterialComponent,
    BoxGeometryComponent,
    CameraViewComponent,
    ConeGeometryComponent,
    CustomGeometryComponent,
    CylinderGeometryComponent,
    DirectionalLightComponent,
    Entity,
    LambertMaterialComponent,
    PhongMaterialComponent,
    PlaneGeometryComponent,
    SphereGeometryComponent,
    StandardMaterialComponent,
    TextureTilingComponent,
    TorusGeometryComponent,
    type ISettingsService,
} from '@duckengine/rendering-three';
import type { MaterialResourceKind } from '@/lib/types';
import { clampNumber } from '../utils/previewUtils';

export type GeometryType =
    | 'sphereGeometry'
    | 'boxGeometry'
    | 'planeGeometry'
    | 'cylinderGeometry'
    | 'coneGeometry'
    | 'torusGeometry'
    | 'customMesh';

export type MaterialPreviewSettings = {
    camera: {
        x: number;
        y: number;
        z: number;
    };
    rotation: {
        enabled: boolean;
        speed: number;
        axis: 'x' | 'y' | 'z';
    };
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
    geometry: {
        type: GeometryType;
        customMesh: {
            key: string;
        };
        sphere: { radius: number; widthSegments: number; heightSegments: number };
        box: { width: number; height: number; depth: number };
        plane: { width: number; height: number; widthSegments: number; heightSegments: number };
        cylinder: { radiusTop: number; radiusBottom: number; height: number; radialSegments: number };
        cone: { radius: number; height: number; radialSegments: number };
        torus: { radius: number; tube: number; radialSegments: number; tubularSegments: number };
    };
};

export type MaterialComponentData = Record<string, unknown>;

function createMaterialComponent(kind: MaterialResourceKind, data: MaterialComponentData) {
    switch (kind) {
        case 'basicMaterial': return new BasicMaterialComponent(data as any);
        case 'lambertMaterial': return new LambertMaterialComponent(data as any);
        case 'phongMaterial': return new PhongMaterialComponent(data as any);
        case 'standardMaterial': return new StandardMaterialComponent(data as any);
        default: return new StandardMaterialComponent(data as any);
    }
}

function createGeometryComponent(settings: MaterialPreviewSettings) {
    switch (settings.geometry.type) {
        case 'customMesh': {
            const key = String(settings.geometry.customMesh?.key ?? '').trim();
            if (!key) return new SphereGeometryComponent({ radius: 1 } as any);
            return new CustomGeometryComponent({ key });
        }
        case 'sphereGeometry':
            return new SphereGeometryComponent(settings.geometry.sphere as any);
        case 'boxGeometry':
            return new BoxGeometryComponent(settings.geometry.box as any);
        case 'planeGeometry':
            return new PlaneGeometryComponent(settings.geometry.plane as any);
        case 'cylinderGeometry':
            return new CylinderGeometryComponent(settings.geometry.cylinder as any);
        case 'coneGeometry':
            return new ConeGeometryComponent(settings.geometry.cone as any);
        case 'torusGeometry':
            return new TorusGeometryComponent(settings.geometry.torus as any);
        default:
            return new SphereGeometryComponent({ radius: 1 } as any);
    }
}

export class MaterialPreviewScene extends BaseScene {
    readonly id = 'admin-material-preview';

    private mesh?: Entity;
    private camera?: Entity;
    private ambient?: Entity;
    private dir?: Entity;
    private previewSettings: MaterialPreviewSettings;
    private currentMaterialKind: MaterialResourceKind;
    private currentMaterialData: MaterialComponentData;

    constructor(
        settings: ISettingsService,
        kind: MaterialResourceKind,
        initialComponentData: MaterialComponentData,
        previewSettings: MaterialPreviewSettings
    ) {
        super(settings);
        this.previewSettings = previewSettings;
        this.currentMaterialKind = kind;
        this.currentMaterialData = initialComponentData;
    }

    setup(engine: any, renderScene: any): void {
        super.setup(engine, renderScene);

        // Camera
        this.camera = new Entity('camera', [0, 0, 3.25]);
        this.camera.addComponent(new CameraViewComponent({ fov: 55, near: 0.1, far: 1000, aspect: 1 }));
        this.addEntity(this.camera);
        this.setActiveCamera(this.camera.id);

        // Lights
        this.ambient = new Entity('ambient');
        this.ambient.addComponent(new AmbientLightComponent({ intensity: 0.9 } as any));
        this.addEntity(this.ambient);

        this.dir = new Entity('dirLight', [2.5, 2.5, 2.5]);
        this.dir.addComponent(new DirectionalLightComponent({ intensity: 1.25 } as any));
        this.addEntity(this.dir);

        // Mesh
        this.mesh = new Entity('mesh');
        this.mesh.addComponent(createGeometryComponent(this.previewSettings));
        this.mesh.addComponent(createMaterialComponent(this.currentMaterialKind, this.currentMaterialData));
        this.mesh.addComponent(
            new TextureTilingComponent(this.previewSettings.tiling as any)
        );
        this.addEntity(this.mesh);

        this.applyPreviewSettings(this.previewSettings);
    }

    applyPreviewSettings(next: MaterialPreviewSettings) {
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

        if (this.mesh) {
            let tiling = this.mesh.getComponent<any>('textureTiling');
            if (!tiling) {
                this.mesh.addComponent(new TextureTilingComponent() as any);
                tiling = this.mesh.getComponent<any>('textureTiling');
            }
            if (tiling) {
                Object.assign(tiling, next.tiling);
            }
        }

        this.setGeometry(next);
    }

    setMaterial(kind: MaterialResourceKind, componentData: MaterialComponentData) {
        if (!this.mesh) return;
        this.currentMaterialKind = kind;
        this.currentMaterialData = componentData;
        this.removeMaterialComponents();
        this.mesh.addComponent(createMaterialComponent(kind, componentData));
    }

    private removeMaterialComponents() {
        if (!this.mesh) return;
        const materialTypes = ['basicMaterial', 'lambertMaterial', 'phongMaterial', 'standardMaterial'];
        for (const t of materialTypes) {
            if (this.mesh.hasComponent(t)) this.mesh.removeComponent(t);
        }
    }

    private setGeometry(next: MaterialPreviewSettings) {
        if (!this.mesh) return;
        const materialKind = this.currentMaterialKind;
        const materialData = this.currentMaterialData;
        this.removeMaterialComponents();

        const geometryTypes: GeometryType[] = [
            'sphereGeometry', 'boxGeometry', 'planeGeometry', 'cylinderGeometry',
            'coneGeometry', 'torusGeometry', 'customMesh',
        ];
        for (const t of geometryTypes) {
            if (this.mesh.hasComponent(t)) this.mesh.removeComponent(t);
        }
        if (this.mesh.hasComponent('customGeometry')) this.mesh.removeComponent('customGeometry');

        this.mesh.addComponent(createGeometryComponent(next));
        this.mesh.addComponent(createMaterialComponent(materialKind, materialData));
    }

    update(dt: number): void {
        super.update(dt);
        if (!this.mesh) return;
        if (!this.previewSettings.rotation.enabled) return;

        const secs = dt / 1000;
        const speed = this.previewSettings.rotation.speed;
        const r = this.mesh.transform.localRotation;
        const delta = secs * speed;

        switch (this.previewSettings.rotation.axis) {
            case 'x': this.mesh.transform.setRotation(r.x + delta, r.y, r.z); break;
            case 'z': this.mesh.transform.setRotation(r.x, r.y, r.z + delta); break;
            case 'y':
            default: this.mesh.transform.setRotation(r.x, r.y + delta, r.z); break;
        }
    }
}
