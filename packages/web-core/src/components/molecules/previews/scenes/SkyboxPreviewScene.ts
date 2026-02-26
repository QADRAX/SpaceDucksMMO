import {
    BaseScene,
    CameraViewComponent,
    Entity,
    type ISettingsService,
} from '@duckengine/rendering-three';
import { SkyboxComponent } from '@duckengine/core';
import type { BasePreviewSettings } from '../utils/previewUtils';

export type SkyboxPreviewSettings = BasePreviewSettings & {
    camera: {
        radius: number;
        height: number;
        fov: number;
    };
    rotation: {
        enabled: boolean;
        speed: number;
    };
};

export class SkyboxPreviewScene extends BaseScene {
    readonly id = 'admin-skybox-preview';

    private camera?: Entity;
    private skybox?: Entity;
    private previewSettings: SkyboxPreviewSettings;
    private currentKey: string;
    private angle = 0;

    constructor(
        settings: ISettingsService,
        initialKey: string,
        previewSettings: SkyboxPreviewSettings
    ) {
        super(settings);
        this.currentKey = initialKey;
        this.previewSettings = previewSettings;
    }

    setup(engine: any, renderScene: any): void {
        super.setup(engine, renderScene);

        this.camera = new Entity('camera', [0, 0, 1]);
        this.camera.addComponent(
            new CameraViewComponent({
                fov: this.previewSettings.camera.fov ?? 70,
                near: 0.1,
                far: 2000,
                aspect: 1,
            })
        );
        this.addEntity(this.camera);
        this.setActiveCamera(this.camera.id);

        this.skybox = new Entity('skybox');
        this.skybox.addComponent(new SkyboxComponent({ key: this.currentKey } as any));
        this.addEntity(this.skybox);

        this.applyPreviewSettings(this.previewSettings);
    }

    setKey(next: string) {
        this.currentKey = next;
        if (!this.skybox) return;
        try {
            const c = this.skybox.getComponent<any>('skybox');
            if (c) {
                (c as any).key = next;
                if (typeof (c as any).notifyChanged === 'function') (c as any).notifyChanged();
            }
        } catch {
            // ignore
        }
    }

    applyPreviewSettings(next: SkyboxPreviewSettings) {
        this.previewSettings = next;

        if (this.camera) {
            try {
                const view = this.camera.getComponent<any>('cameraView');
                if (view) (view as any).fov = next.camera.fov ?? 70;
            } catch {
                // ignore
            }
            this.update(0);
        }
    }

    update(dt: number): void {
        super.update(dt);
        if (!this.camera) return;

        const secs = dt / 1000;
        if (this.previewSettings.rotation.enabled && secs > 0) {
            this.angle += this.previewSettings.rotation.speed * secs;
        }

        const r = this.previewSettings.camera.radius ?? 1;
        const x = Math.cos(this.angle) * r;
        const z = Math.sin(this.angle) * r;
        const y = this.previewSettings.camera.height ?? 0;

        this.camera.transform.setPosition(x, y, z);
        this.camera.transform.lookAt({ x: 0, y: 0, z: 0 });
    }
}
