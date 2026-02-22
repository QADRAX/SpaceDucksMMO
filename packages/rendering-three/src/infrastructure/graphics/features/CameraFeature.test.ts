import * as THREE from 'three';
import { CameraFeature } from './CameraFeature';
import { RenderObjectRegistry } from '../sync/RenderObjectRegistry';
import type { RenderContext } from './RenderContext';
import type { Entity, CameraViewComponent } from '@duckengine/ecs';
import { CameraFactory } from '../factories/CameraFactory';
import * as TransformSync from '../sync/TransformSync';

// Mock dependencies
jest.mock('../factories/CameraFactory');
jest.mock('../sync/TransformSync', () => ({
    syncTransformToObject3D: jest.fn()
}));

describe('CameraFeature', () => {
    let feature: CameraFeature;
    let mockContext: RenderContext;
    let mockEntity: jest.Mocked<Entity>;

    beforeEach(() => {
        feature = new CameraFeature();
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
            id: 'cam-entity',
            getComponent: jest.fn(),
        } as unknown as jest.Mocked<Entity>;

        jest.clearAllMocks();
    });

    it('isEligible returns true if entity has an enabled cameraView component', () => {
        // Active camera
        mockEntity.getComponent.mockReturnValue({ enabled: true } as unknown as CameraViewComponent);
        expect(feature.isEligible(mockEntity)).toBe(true);

        // Implied active camera
        mockEntity.getComponent.mockReturnValue({} as unknown as CameraViewComponent);
        expect(feature.isEligible(mockEntity)).toBe(true);

        // Disabled camera
        mockEntity.getComponent.mockReturnValue({ enabled: false } as unknown as CameraViewComponent);
        expect(feature.isEligible(mockEntity)).toBe(false);

        // No camera
        mockEntity.getComponent.mockReturnValue(undefined);
        expect(feature.isEligible(mockEntity)).toBe(false);
    });

    describe('onAttach', () => {
        it('creates a camera from factory, adds to scene and registry', () => {
            const mockCamera = new THREE.PerspectiveCamera();
            (CameraFactory.build as jest.Mock).mockReturnValue(mockCamera);

            const camConfig = { type: 'perspective', fov: 75 } as unknown as CameraViewComponent;
            mockEntity.getComponent.mockReturnValue(camConfig);

            feature.onAttach(mockEntity, mockContext);

            expect(CameraFactory.build).toHaveBeenCalledWith(camConfig);
            expect(TransformSync.syncTransformToObject3D).toHaveBeenCalledWith(mockEntity, mockCamera);
            expect(mockContext.scene.children).toContain(mockCamera);

            const rc = mockContext.registry.get(mockEntity.id);
            expect(rc).toBeDefined();
            expect(rc?.object3D).toBe(mockCamera);
            expect(mockCamera.userData.entityId).toBe(mockEntity.id);
        });

        it('does nothing if cameraView component is unexpectedly missing', () => {
            mockEntity.getComponent.mockReturnValue(undefined);
            feature.onAttach(mockEntity, mockContext);
            expect(CameraFactory.build).not.toHaveBeenCalled();
            expect(mockContext.registry.has(mockEntity.id)).toBe(false);
        });
    });

    describe('onUpdate', () => {
        it('updates projection matrix when cameraView component changes', () => {
            const mockCamera = new THREE.PerspectiveCamera();
            mockCamera.updateProjectionMatrix = jest.fn();

            mockContext.registry.add(mockEntity.id, {
                entityId: mockEntity.id,
                object3D: mockCamera
            });

            mockEntity.getComponent.mockReturnValue({
                type: 'perspective',
                fov: 90,
                aspect: 2,
                near: 0.5,
                far: 2000
            } as unknown as CameraViewComponent);

            feature.onUpdate(mockEntity, 'cameraView', mockContext);

            expect(mockCamera.fov).toBe(90);
            expect(mockCamera.aspect).toBe(2);
            expect(mockCamera.near).toBe(0.5);
            expect(mockCamera.far).toBe(2000);
            expect(mockCamera.updateProjectionMatrix).toHaveBeenCalled();
        });

        it('ignores components that are not cameraView', () => {
            const mockCamera = new THREE.PerspectiveCamera();
            mockCamera.updateProjectionMatrix = jest.fn();
            mockContext.registry.add(mockEntity.id, { entityId: mockEntity.id, object3D: mockCamera });

            feature.onUpdate(mockEntity, 'transform' as any, mockContext);
            expect(mockCamera.updateProjectionMatrix).not.toHaveBeenCalled();
        });
    });

    describe('onTransformChanged', () => {
        it('syncs transform to object3D', () => {
            const mockCamera = new THREE.PerspectiveCamera();
            mockContext.registry.add(mockEntity.id, { entityId: mockEntity.id, object3D: mockCamera });

            feature.onTransformChanged(mockEntity, mockContext);
            expect(TransformSync.syncTransformToObject3D).toHaveBeenCalledWith(mockEntity, mockCamera);
        });
    });

    describe('onDetach', () => {
        it('removes the entity from registry and scene', () => {
            const mockCamera = new THREE.PerspectiveCamera();
            mockContext.scene.add(mockCamera);
            mockContext.registry.add(mockEntity.id, { entityId: mockEntity.id, object3D: mockCamera });

            feature.onDetach(mockEntity, mockContext);

            expect(mockContext.registry.has(mockEntity.id)).toBe(false);
            expect(mockContext.scene.children).not.toContain(mockCamera);
        });
    });
});
