import {
    AmbientLightComponent,
    BaseScene,
    BoxGeometryComponent,
    CameraViewComponent,
    ConeGeometryComponent,
    CustomGeometryComponent,
    CylinderGeometryComponent,
    DirectionalLightComponent,
    Entity,
    PlaneGeometryComponent,
    SphereGeometryComponent,
    TorusGeometryComponent,
    type ISettingsService,
    type ComponentType,
} from '@duckengine/rendering-three';
import { ShaderMaterialComponent } from '@duckengine/ecs';
import type { MaterialPreviewSettings } from './MaterialPreviewScene';

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

export class CustomShaderPreviewScene extends BaseScene {
    readonly id = 'admin-custom-shader-preview';

    private mesh?: Entity;
    private camera?: Entity;
    private ambient?: Entity;
    private dir?: Entity;
    private previewSettings: MaterialPreviewSettings;
    private shaderId: string;
    private initialUniforms?: Record<string, any>;

    constructor(
        settings: ISettingsService,
        shaderId: string,
        previewSettings: MaterialPreviewSettings,
        initialUniforms?: Record<string, any>
    ) {
        super(settings);
        this.previewSettings = previewSettings;
        this.shaderId = shaderId;
        this.initialUniforms = initialUniforms;
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

        // Add shader material component
        this.mesh.addComponent(new ShaderMaterialComponent({
            shaderId: this.shaderId,
            uniforms: this.initialUniforms ?? {}
        } as any));

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

        this.setGeometry(next);
    }

    setShaderId(shaderId: string) {
        if (!this.mesh) return;
        this.shaderId = shaderId;

        if (this.mesh.hasComponent('shaderMaterial')) {
            this.mesh.removeComponent('shaderMaterial');
        }

        this.mesh.addComponent(new ShaderMaterialComponent({
            shaderId: this.shaderId,
            uniforms: this.initialUniforms ?? {}
        } as any));
    }

    setUniforms(uniforms: Record<string, any>) {
        this.initialUniforms = uniforms;
        if (!this.mesh) return;
        const comp = this.mesh.getComponent<ShaderMaterialComponent>('shaderMaterial');
        if (comp) {
            comp.setUniforms(uniforms);
        }
    }

    private setGeometry(next: MaterialPreviewSettings) {
        if (!this.mesh) return;

        const hadMaterial = this.mesh.hasComponent('shaderMaterial');
        if (hadMaterial) {
            this.mesh.removeComponent('shaderMaterial');
        }

        const geometryTypes: ComponentType[] = [
            'sphereGeometry', 'boxGeometry', 'planeGeometry', 'cylinderGeometry',
            'coneGeometry', 'torusGeometry', 'customMesh' as ComponentType,
        ];

        for (const t of geometryTypes) {
            if (this.mesh.hasComponent(t)) this.mesh.removeComponent(t);
        }
        if (this.mesh.hasComponent('customGeometry')) this.mesh.removeComponent('customGeometry');

        this.mesh.addComponent(createGeometryComponent(next));

        if (hadMaterial) {
            this.mesh.addComponent(new ShaderMaterialComponent({
                shaderId: this.shaderId,
                uniforms: this.initialUniforms ?? {}
            } as any));
        }
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
