import {
    BaseScene,
    CameraViewComponent,
    type GameSettings,
    type ISettingsService,
} from '@duckengine/rendering-three';

import {
    Entity,
    FirstPersonMoveComponent,
    MouseLookComponent,
} from '@duckengine/ecs';

const defaultSettings: GameSettings = {
    graphics: {
        qualityPreset: 'high',
        antialias: true,
        shadows: true,
        fullscreen: false,
        textureQuality: 'high',
    },
    gameplay: {
        invertMouseY: false,
        mouseSensitivity: 1,
    },
    audio: {
        masterVolume: 0,
        musicVolume: 0,
        sfxVolume: 0,
        muteAll: true,
    },
};

class InlineSettingsService implements ISettingsService {
    private settings: GameSettings = defaultSettings;
    private listeners = new Set<(s: GameSettings) => void>();

    getSettings(): GameSettings {
        return this.settings;
    }

    subscribe(listener: (settings: GameSettings) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
}

export type EditorSceneInit = {
    id: string;
    entitiesById: Map<string, Entity>;
    debugTransformsEnabled: boolean;
    activeCameraEntityId?: string | null;
    cameraPose?: {
        position?: [number, number, number];
        rotation?: [number, number, number];
    };
};

export class EcsEditorScene extends BaseScene {
    readonly id: string;

    private readonly entitiesById: Map<string, Entity>;
    private readonly desiredActiveCameraEntityId: string | null;

    private editorCamera?: Entity;

    constructor(init: EditorSceneInit) {
        super(new InlineSettingsService());
        this.id = init.id;
        this.entitiesById = init.entitiesById;
        this.desiredActiveCameraEntityId = init.activeCameraEntityId ?? null;

        try {
            // Scene-level debug master switches are always enabled in the editor.
            // Per-entity flags determine what actually renders.
            this.setDebugTransformsEnabled(true);
            this.setDebugMeshesEnabled(true);
            this.setDebugCollidersEnabled(true);
        } catch {
            // ignore
        }

        if (init.cameraPose?.position || init.cameraPose?.rotation) {
            // applied during setup
            (this as any)._initialCameraPose = init.cameraPose;
        }
    }

    getUserRoots(): Entity[] {
        const roots: Entity[] = [];
        for (const ent of this.entitiesById.values()) {
            if (!ent.parent) roots.push(ent);
        }
        return roots;
    }

    getEntitiesById(): Map<string, Entity> {
        return this.entitiesById;
    }

    getEditorCamera(): Entity | undefined {
        return this.editorCamera;
    }

    setup(engine: any, renderScene: any): void {
        super.setup(engine, renderScene);

        // Editor camera (not persisted)
        this.editorCamera = new Entity('editorCamera', [0, 1.5, 4]);
        this.editorCamera.addComponent(
            new CameraViewComponent({
                fov: 65,
                near: 0.1,
                far: 5000,
                aspect: 1,
            })
        );

        const mouseLook = new MouseLookComponent({
            sensitivityX: 0.002,
            sensitivityY: 0.002,
            invertY: false,
        } as any);

        const move = new FirstPersonMoveComponent({
            moveSpeed: 6,
            sprintMultiplier: 2.5,
            flyMode: true,

        } as any);

        this.editorCamera.addComponent(mouseLook);
        this.editorCamera.addComponent(move);

        // apply initial pose (if any)
        try {
            const pose = (this as any)._initialCameraPose as
                | { position?: [number, number, number]; rotation?: [number, number, number] }
                | undefined;
            if (pose?.position) {
                this.editorCamera.transform.setPosition(pose.position[0], pose.position[1], pose.position[2]);
            }
            if (pose?.rotation) {
                this.editorCamera.transform.setRotation(pose.rotation[0], pose.rotation[1], pose.rotation[2]);
            }
        } catch {
            // ignore
        }

        this.addEntity(this.editorCamera);
        this.setActiveCamera(this.editorCamera.id);

        // User entities
        for (const ent of this.entitiesById.values()) {
            this.addEntity(ent);
        }

        // Apply persisted active camera (must be a user entity with CameraViewComponent).
        if (this.desiredActiveCameraEntityId && this.entitiesById.has(this.desiredActiveCameraEntityId)) {
            try {
                this.setActiveCamera(this.desiredActiveCameraEntityId);
            } catch {
                // ignore
            }
        }
    }

    update(dt: number, opts?: { paused?: boolean }): void {
        // Keep camera responsive even when paused.
        try {
            this.editorCamera?.update(dt);
        } catch {
            // ignore
        }

        const paused = !!opts?.paused;
        if (!paused) {
            for (const r of this.getUserRoots()) {
                try {
                    r.update(dt);
                } catch {
                    // ignore
                }
            }
        }

        // systems (render sync, physics) still need to tick
        try {
            (this as any).physicsSystem?.update?.(dt);
        } catch {
            // ignore
        }
        try {
            (this as any).renderSyncSystem?.update?.(dt);
        } catch {
            // ignore
        }
    }
}
