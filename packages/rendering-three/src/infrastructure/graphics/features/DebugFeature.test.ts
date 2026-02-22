import * as THREE from 'three';
import { DebugFeature } from './DebugFeature';
import { RenderObjectRegistry } from '../sync/RenderObjectRegistry';
import DebugTransformSystem from '../debug/DebugTransformSystem';
import DebugMeshSystem from '../debug/DebugMeshSystem';
import DebugColliderSystem from '../debug/DebugColliderSystem';
import DebugCameraSystem from '../debug/DebugCameraSystem';
import type { RenderContext } from './RenderContext';
import type { Entity } from '@duckengine/ecs';

// Mock all internal debug systems
jest.mock('../debug/DebugTransformSystem');
jest.mock('../debug/DebugMeshSystem');
jest.mock('../debug/DebugColliderSystem');
jest.mock('../debug/DebugCameraSystem');

describe('DebugFeature', () => {
    let feature: DebugFeature;
    let mockContext: RenderContext;
    let mockEntity: jest.Mocked<Entity>;

    beforeEach(() => {
        const scene = new THREE.Scene();
        const registry = new RenderObjectRegistry();

        mockContext = {
            scene,
            registry,
            entities: new Map(),
            debugFlags: { transform: false, mesh: false, collider: false, camera: false },
        } as unknown as RenderContext;

        mockEntity = {
            id: 'debug-entity',
            isDebugEnabled: jest.fn().mockReturnValue(false),
            addDebugListener: jest.fn(),
            removeDebugListener: jest.fn(),
        } as unknown as jest.Mocked<Entity>;

        jest.clearAllMocks();

        feature = new DebugFeature(scene, registry);
    });

    it('isEligible is always true', () => {
        expect(feature.isEligible(mockEntity)).toBe(true);
    });

    describe('onAttach', () => {
        it('registers a debug listener and updates initial helpers', () => {
            feature.onAttach(mockEntity, mockContext);

            expect(mockEntity.addDebugListener).toHaveBeenCalled();
            // It uses the initial context debug flags (all false here), so recreate shouldn't be called
            const meshSysMock = (DebugMeshSystem as unknown as jest.Mock).mock.instances[0] as jest.Mocked<DebugMeshSystem>;
            expect(meshSysMock.recreateForEntityIfNeeded).not.toHaveBeenCalled();
        });

        it('recreates helpers if context and entity flags are both true', () => {
            mockContext.debugFlags.transform = true;
            mockEntity.isDebugEnabled.mockImplementation(kind => kind === 'transform');

            feature.onAttach(mockEntity, mockContext);

            const transformSysMock = (DebugTransformSystem as unknown as jest.Mock).mock.instances[0] as jest.Mocked<DebugTransformSystem>;
            expect(transformSysMock.recreateForEntityIfNeeded).toHaveBeenCalledWith(mockEntity);
        });
    });

    describe('onUpdate', () => {
        it('routes geometry/mesh updates to mesh debug system', () => {
            feature.onUpdate(mockEntity, 'boxGeometry', mockContext);
            const meshSysMock = (DebugMeshSystem as unknown as jest.Mock).mock.instances[0] as jest.Mocked<DebugMeshSystem>;
            expect(meshSysMock.refreshWireframeForEntity).toHaveBeenCalledWith(mockEntity.id);
        });

        it('routes collider updates to collider debug system', () => {
            feature.onUpdate(mockEntity, 'boxCollider', mockContext);
            const colSysMock = (DebugColliderSystem as unknown as jest.Mock).mock.instances[0] as jest.Mocked<DebugColliderSystem>;
            expect(colSysMock.recreateForEntityIfNeeded).toHaveBeenCalledWith(mockEntity);
        });

        it('routes camera updates to camera debug system', () => {
            feature.onUpdate(mockEntity, 'cameraView', mockContext);
            const camSysMock = (DebugCameraSystem as unknown as jest.Mock).mock.instances[0] as jest.Mocked<DebugCameraSystem>;
            expect(camSysMock.updateHelper).toHaveBeenCalledWith(mockEntity);
        });
    });

    describe('onTransformChanged', () => {
        it('routes transform changes to all debug systems', () => {
            feature.onTransformChanged(mockEntity, mockContext);

            const req = (systemType: any) => (systemType as unknown as jest.Mock).mock.instances[0];

            expect(req(DebugTransformSystem).updateHelperTransform).toHaveBeenCalledWith(mockEntity);
            expect(req(DebugMeshSystem).updateHelperTransform).toHaveBeenCalledWith(mockEntity);
            expect(req(DebugColliderSystem).updateHelperTransform).toHaveBeenCalledWith(mockEntity);
        });
    });

    describe('onDetach', () => {
        it('removes helpers and unregisters debug listener', () => {
            feature.onAttach(mockEntity, mockContext); // Attach first to set listener
            feature.onDetach(mockEntity, mockContext);

            const req = (systemType: any) => (systemType as unknown as jest.Mock).mock.instances[0];

            expect(req(DebugTransformSystem).removeHelper).toHaveBeenCalledWith(mockEntity.id);
            expect(mockEntity.removeDebugListener).toHaveBeenCalled();
        });
    });

    describe('setSceneDebugEnabled', () => {
        it('sets master enabled for transform and recreates for all entities', () => {
            mockContext.entities.set(mockEntity.id, mockEntity);
            feature.setSceneDebugEnabled('transform', true, mockContext);

            const transformSysMock = (DebugTransformSystem as unknown as jest.Mock).mock.instances[0] as jest.Mocked<DebugTransformSystem>;
            expect(transformSysMock.setMasterEnabled).toHaveBeenCalledWith(true);
            expect(transformSysMock.recreateForEntityIfNeeded).toHaveBeenCalledWith(mockEntity);
        });
    });
});
