import * as THREE from 'three';
import { LightFeature } from './LightFeature';
import { RenderObjectRegistry } from '../sync/RenderObjectRegistry';
import type { RenderContext } from './RenderContext';
import type { Entity } from '@duckengine/ecs';
import * as TransformSync from '../sync/TransformSync';
import { LightFactory } from '../factories/LightFactory';

jest.mock('../sync/TransformSync');
jest.mock('../factories/LightFactory');

describe('LightFeature', () => {
    let feature: LightFeature;
    let mockContext: RenderContext;
    let mockEntity: jest.Mocked<Entity>;

    beforeEach(() => {
        feature = new LightFeature();
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
            id: 'light-entity',
            getComponent: jest.fn(),
        } as unknown as jest.Mocked<Entity>;

        jest.clearAllMocks();
    });

    it('isEligible returns true if entity has any light component', () => {
        const testCases = [
            { comp: 'ambientLight', val: { enabled: true } as any, expected: true },
            { comp: 'directionalLight', val: { enabled: true } as any, expected: true },
            { comp: 'pointLight', val: { enabled: true } as any, expected: true },
            { comp: 'spotLight', val: { enabled: true } as any, expected: true },
            { comp: 'unrelated', val: { enabled: true } as any, expected: false },
        ];

        for (const tc of testCases) {
            mockEntity.getComponent.mockImplementation((name) => name === tc.comp ? tc.val : undefined);
            expect(feature.isEligible(mockEntity)).toBe(tc.expected);
        }
    });

    describe('onAttach', () => {
        it('creates light via factory and adds to scene/registry', () => {
            const mockComp = { enabled: true, color: 0xffffff } as any;
            mockEntity.getComponent.mockImplementation((name) => name === 'pointLight' ? mockComp : undefined);

            const light = new THREE.PointLight();
            (LightFactory.build as jest.Mock).mockReturnValue(light);

            feature.onAttach(mockEntity, mockContext);

            expect(LightFactory.build).toHaveBeenCalledWith(mockEntity, mockComp, mockContext.scene);
            expect(light.userData.entityId).toBe(mockEntity.id);
            expect(mockContext.scene.children).toContain(light);

            const rc = mockContext.registry.get(mockEntity.id);
            expect(rc?.object3D).toBe(light);
        });

        it('does not attach if light component is explicitly disabled', () => {
            mockEntity.getComponent.mockImplementation((name) => name === 'pointLight' ? { enabled: false } as any : undefined);
            feature.onAttach(mockEntity, mockContext);

            expect(LightFactory.build).not.toHaveBeenCalled();
            expect(mockContext.registry.has(mockEntity.id)).toBe(false);
        });
    });

    describe('onUpdate', () => {
        it('re-attaches light if light component is updated', () => {
            const detachSpy = jest.spyOn(feature, 'onDetach');
            const attachSpy = jest.spyOn(feature, 'onAttach');

            feature.onUpdate(mockEntity, 'directionalLight', mockContext);

            expect(detachSpy).toHaveBeenCalledWith(mockEntity, mockContext);
            expect(attachSpy).toHaveBeenCalledWith(mockEntity, mockContext);
        });

        it('ignores irrelevant component updates', () => {
            const detachSpy = jest.spyOn(feature, 'onDetach');
            const attachSpy = jest.spyOn(feature, 'onAttach');

            feature.onUpdate(mockEntity, 'transform' as any, mockContext);

            expect(detachSpy).not.toHaveBeenCalled();
            expect(attachSpy).not.toHaveBeenCalled();
        });
    });

    describe('onTransformChanged', () => {
        it('syncs transform to object3D', () => {
            const light = new THREE.AmbientLight();
            mockContext.registry.add(mockEntity.id, { entityId: mockEntity.id, object3D: light });

            feature.onTransformChanged(mockEntity, mockContext);

            expect(TransformSync.syncTransformToObject3D).toHaveBeenCalledWith(mockEntity, light);
        });

        it('updates directional target for DirectionalLight', () => {
            const light = new THREE.DirectionalLight();
            mockContext.registry.add(mockEntity.id, { entityId: mockEntity.id, object3D: light });

            feature.onTransformChanged(mockEntity, mockContext);

            expect(LightFactory.updateDirectionalTarget).toHaveBeenCalledWith(light, mockEntity);
        });

        it('updates directional target for SpotLight', () => {
            const light = new THREE.SpotLight();
            mockContext.registry.add(mockEntity.id, { entityId: mockEntity.id, object3D: light });

            feature.onTransformChanged(mockEntity, mockContext);

            expect(LightFactory.updateDirectionalTarget).toHaveBeenCalledWith(light, mockEntity);
        });
    });

    describe('onDetach', () => {
        it('removes light from registry', () => {
            // Note: LightFeature relies on RenderObjectRegistry cleanup logic elsewhere to remove from scene or does not explicitly scene.remove. 
            // Wait, does it remove from scene? 
            // In LightFeature.ts: context.registry.remove(entity.id, context.scene) 
            // which handles scene.remove internally!
            mockContext.registry.remove = jest.fn();

            feature.onDetach(mockEntity, mockContext);

            expect(mockContext.registry.remove).toHaveBeenCalledWith(mockEntity.id, mockContext.scene);
        });
    });
});
