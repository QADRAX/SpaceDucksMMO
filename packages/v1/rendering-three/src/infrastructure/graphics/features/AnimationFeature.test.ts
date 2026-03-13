import * as THREE from 'three';
import { AnimationFeature } from './AnimationFeature';
import { RenderObjectRegistry } from '../sync/RenderObjectRegistry';
import type { RenderContext } from './RenderContext';
import type { Entity } from '@duckengine/core';

describe('AnimationFeature', () => {
    let feature: AnimationFeature;
    let mockContext: RenderContext;
    let mockEntity: jest.Mocked<Entity>;

    beforeEach(() => {
        feature = new AnimationFeature();
        mockContext = {
            scene: new THREE.Scene(),
            registry: new RenderObjectRegistry(),
            textureCache: {} as any,
            entities: new Map(),
            debugFlags: {},
            activeCameraEntityId: null,
            isInitialLoading: false,
        };

        mockEntity = {
            id: 'anim-entity',
            getComponent: jest.fn(),
        } as unknown as jest.Mocked<Entity>;
    });

    it('isEligible returns true if entity has a fullMesh component', () => {
        mockEntity.getComponent.mockReturnValue({} as any);
        expect(feature.isEligible(mockEntity)).toBe(true);

        mockEntity.getComponent.mockReturnValue(undefined);
        expect(feature.isEligible(mockEntity)).toBe(false);
    });

    describe('syncAnimation', () => {
        it('does nothing if no animation configuration is present', () => {
            mockEntity.getComponent.mockReturnValue({} as any); // no animation field
            feature.onAttach(mockEntity, mockContext);
            // Shouldn't crash, no action should be added to registry since we mocked nothing there
        });

        it('does nothing if registry lacks animationMixer', () => {
            mockEntity.getComponent.mockReturnValue({ animation: { clipName: 'walk' } } as any);
            mockContext.registry.add(mockEntity.id, { entityId: mockEntity.id }); // missing mixer
            feature.onAttach(mockEntity, mockContext);
            expect(mockContext.registry.get(mockEntity.id)?.activeAction).toBeUndefined();
        });

        it('plays default animation if clipName is not specified', () => {
            const clip = new THREE.AnimationClip('default', 1, []);
            const mixer = new THREE.AnimationMixer(new THREE.Object3D());
            const clipActionMock = {
                setLoop: jest.fn(),
                isRunning: jest.fn().mockReturnValue(false),
                play: jest.fn(),
            } as unknown as THREE.AnimationAction;

            jest.spyOn(mixer, 'clipAction').mockReturnValue(clipActionMock);

            mockEntity.getComponent.mockReturnValue({ animation: {} } as any); // empty animation config
            mockContext.registry.add(mockEntity.id, {
                entityId: mockEntity.id,
                animationMixer: mixer,
                availableAnimations: [clip],
            });

            feature.onAttach(mockEntity, mockContext);

            expect(mixer.clipAction).toHaveBeenCalledWith(clip);
            expect(clipActionMock.play).toHaveBeenCalled();
            expect(mockContext.registry.get(mockEntity.id)?.activeAction).toBe(clipActionMock);
        });

        it('plays specified animation by clipName', () => {
            const clip1 = new THREE.AnimationClip('idle', 1, []);
            const clip2 = new THREE.AnimationClip('walk', 1, []);
            const mixer = new THREE.AnimationMixer(new THREE.Object3D());
            const clipActionMock = {
                setLoop: jest.fn(),
                isRunning: jest.fn().mockReturnValue(false),
                play: jest.fn(),
            } as unknown as THREE.AnimationAction;

            jest.spyOn(mixer, 'clipAction').mockReturnValue(clipActionMock);

            mockEntity.getComponent.mockReturnValue({ animation: { clipName: 'walk', loop: false } } as any);
            mockContext.registry.add(mockEntity.id, {
                entityId: mockEntity.id,
                animationMixer: mixer,
                availableAnimations: [clip1, clip2],
            });

            feature.onAttach(mockEntity, mockContext);

            // Mock THREE.AnimationClip.findByName behavior
            expect(mixer.clipAction).toHaveBeenCalledWith(clip2);
            expect(clipActionMock.setLoop).toHaveBeenCalledWith(THREE.LoopOnce, Infinity);
            expect(clipActionMock.play).toHaveBeenCalled();
        });

        it('pauses animation if playing is false', () => {
            const clip = new THREE.AnimationClip('idle', 1, []);
            const mixer = new THREE.AnimationMixer(new THREE.Object3D());
            const clipActionMock = {
                setLoop: jest.fn(),
                isRunning: jest.fn().mockReturnValue(false),
                play: jest.fn(),
                paused: false,
            } as unknown as THREE.AnimationAction;

            jest.spyOn(mixer, 'clipAction').mockReturnValue(clipActionMock);

            mockEntity.getComponent.mockReturnValue({ animation: { playing: false } } as any);
            mockContext.registry.add(mockEntity.id, {
                entityId: mockEntity.id,
                animationMixer: mixer,
                availableAnimations: [clip],
            });

            feature.onUpdate(mockEntity, 'fullMesh', mockContext);

            expect(clipActionMock.paused).toBe(true);
            expect(clipActionMock.play).not.toHaveBeenCalled();
        });

        it('updates properties of existing action without resetting if clip matches', () => {
            const clip = new THREE.AnimationClip('idle', 1, []);
            const mixer = new THREE.AnimationMixer(new THREE.Object3D());
            const clipActionMock = {
                getClip: () => clip,
                setLoop: jest.fn(),
                isRunning: jest.fn().mockReturnValue(true),
                play: jest.fn(),
                stop: jest.fn(),
                reset: jest.fn(),
            } as unknown as THREE.AnimationAction;

            mockContext.registry.add(mockEntity.id, {
                entityId: mockEntity.id,
                animationMixer: mixer,
                availableAnimations: [clip],
                activeAction: clipActionMock,
            });

            mockEntity.getComponent.mockReturnValue({ animation: { clipName: 'idle', time: 5 } } as any);

            feature.onUpdate(mockEntity, 'fullMesh', mockContext);

            expect(clipActionMock.stop).not.toHaveBeenCalled();
            expect(clipActionMock.reset).not.toHaveBeenCalled();
            expect(clipActionMock.play).toHaveBeenCalled();
        });
    });

    describe('onFrame', () => {
        it('updates all animation mixers in the registry', () => {
            const mixer1 = new THREE.AnimationMixer(new THREE.Object3D());
            const mixer2 = new THREE.AnimationMixer(new THREE.Object3D());
            jest.spyOn(mixer1, 'update');
            jest.spyOn(mixer2, 'update');

            mockContext.registry.add('ent-1', { entityId: 'ent-1', animationMixer: mixer1 });
            mockContext.registry.add('ent-2', { entityId: 'ent-2', animationMixer: mixer2 });
            mockContext.registry.add('ent-3', { entityId: 'ent-3' }); // no mixer

            feature.onFrame(16, mockContext);

            expect(mixer1.update).toHaveBeenCalledWith(0.016); // 16ms -> 0.016s
            expect(mixer2.update).toHaveBeenCalledWith(0.016);
        });
    });

    describe('onDetach', () => {
        it('stops all actions on the mixer when entity is detached', () => {
            const mixer = new THREE.AnimationMixer(new THREE.Object3D());
            jest.spyOn(mixer, 'stopAllAction');

            const rc = { entityId: mockEntity.id, animationMixer: mixer, activeAction: {} as any };
            mockContext.registry.add(mockEntity.id, rc);

            feature.onDetach(mockEntity, mockContext);

            expect(mixer.stopAllAction).toHaveBeenCalled();
            expect(rc.activeAction).toBeUndefined();
        });
    });
});
