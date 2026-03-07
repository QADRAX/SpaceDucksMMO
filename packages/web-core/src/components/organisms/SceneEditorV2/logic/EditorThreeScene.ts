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
    type IRenderingEngine,
} from '@duckengine/core';
import type { EcsLiveScene } from './EcsLiveScene';

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

/**
 * The Three.js rendering wrapper for the editor.
 * 
 * V2 Architecture:
 * - EcsLiveScene holds the pure ECS state (single source of truth for the game).
 * - EditorThreeScene is the engine binding. It extends BaseScene (which has the Three.js
 *   renderSyncSystem, physics system, and script system).
 * - We populate EditorThreeScene with the entities from EcsLiveScene.
 */
export class EditorThreeScene extends BaseScene {
    readonly id: string;
    private liveScene: EcsLiveScene;

    // The camera used to look around the editor when not locked to a game camera
    private editorCamera?: Entity;

    constructor(liveScene: EcsLiveScene) {
        super(new InlineSettingsService());
        this.id = liveScene.id;
        this.liveScene = liveScene;

        // Force enable all debug rendering at the scene level.
        // The built-in plugins (Phase 6) will toggle per-entity rendering flags.
        try {
            this.setDebugEnabled?.('transform', true);
            this.setDebugEnabled?.('mesh', true);
            this.setDebugEnabled?.('collider', true);
            this.setDebugEnabled?.('camera', true);
        } catch {
            // ignore if not supported by engine
        }
    }

    getEditorCamera(): Entity | undefined {
        return this.editorCamera;
    }

    setup(engine: IRenderingEngine): void {
        // Prepare the internal editor camera before calling super.setup
        // so it gets added to the render sync system immediately.
        this.editorCamera = new Entity('editorCamera', [0, 1.5, 4]);
        this.editorCamera.addComponent(
            new CameraViewComponent({
                fov: 65,
                near: 0.1,
                far: 5000,
                aspect: 1,
            })
        );
        this.editorCamera.addComponent(
            new MouseLookComponent({
                sensitivityX: 0.002,
                sensitivityY: 0.002,
                invertY: false,
            } as any)
        );
        this.editorCamera.addComponent(
            new FirstPersonMoveComponent({
                moveSpeed: 6,
                sprintMultiplier: 2.5,
                flyMode: true,
            } as any)
        );

        // Add the editor camera to our local entity map BEFORE super.setup
        this.entities.set(this.editorCamera.id, this.editorCamera);

        // Add all entities from the live scene FIRST
        for (const ent of this.liveScene.getEntitiesById().values()) {
            this.entities.set(ent.id, ent);
        }

        super.setup(engine);

        // Set the active camera
        if (this.liveScene.activeCameraEntityId) {
            this.setActiveCamera(this.liveScene.activeCameraEntityId);
        } else {
            this.setActiveCamera(this.editorCamera.id);
        }
    }

    /**
     * Called by the store when an entity is added to the live scene.
     */
    syncEntityAdded(entity: Entity): void {
        this.addEntity(entity);
    }

    /**
     * Called by the store when an entity is removed from the live scene.
     */
    syncEntityRemoved(id: string): void {
        this.removeEntity(id);
    }
}
