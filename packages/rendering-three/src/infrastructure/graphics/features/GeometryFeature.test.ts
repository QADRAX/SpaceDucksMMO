import * as THREE from 'three';
import { GeometryFeature } from './GeometryFeature';
import { RenderObjectRegistry } from '../sync/RenderObjectRegistry';
import type { RenderContext } from './RenderContext';
import type { Entity } from '@duckengine/ecs';
import * as TransformSync from '../sync/TransformSync';
import { GeometryFactory } from '../factories/GeometryFactory';
import { CustomGeometryLoader } from '../loaders/CustomGeometryLoader';
import * as DebugUtils from '../debug/DebugUtils';

jest.mock('../sync/TransformSync');
jest.mock('../factories/GeometryFactory');
jest.mock('../loaders/CustomGeometryLoader');
jest.mock('../debug/DebugUtils');

describe('GeometryFeature', () => {
    let feature: GeometryFeature;
    let mockContext: RenderContext;
    let mockEntity: jest.Mocked<Entity>;

    beforeEach(() => {
        feature = new GeometryFeature();
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
            id: 'geom-entity',
            getComponent: jest.fn(),
        } as unknown as jest.Mocked<Entity>;

        jest.clearAllMocks();
    });

    it('isEligible returns true for any valid geometry component except fullMesh', () => {
        const testCases = [
            { comp: 'boxGeometry', val: { type: 'box', enabled: true } as any, expected: true },
            { comp: 'sphereGeometry', val: { type: 'sphere', enabled: true } as any, expected: true },
            { comp: 'planeGeometry', val: { type: 'plane', enabled: false } as any, expected: false },
            { comp: 'fullMesh', val: { type: 'fullMesh', enabled: true } as any, expected: false },
        ];

        for (const tc of testCases) {
            mockEntity.getComponent.mockImplementation((name) => name === tc.comp ? tc.val : undefined);
            expect(feature.isEligible(mockEntity)).toBe(tc.expected);
        }
    });

    describe('onAttach', () => {
        it('creates a mesh with factory geometry and adds to scene/registry', () => {
            const mockGeom = new THREE.BoxGeometry();
            (GeometryFactory.build as jest.Mock).mockReturnValue(mockGeom);

            mockEntity.getComponent.mockImplementation((name) => name === 'boxGeometry' ? { type: 'box', castShadow: true, receiveShadow: false } as any : undefined);

            feature.onAttach(mockEntity, mockContext);

            const rc = mockContext.registry.get(mockEntity.id);
            expect(rc).toBeDefined();
            expect(rc?.object3D).toBeInstanceOf(THREE.Mesh);
            expect(rc?.geometry).toBe(mockGeom);
            expect(rc?.material).toBeInstanceOf(THREE.MeshStandardMaterial);

            const mesh = rc?.object3D as THREE.Mesh;
            expect(mesh.castShadow).toBe(true);
            expect(mesh.receiveShadow).toBe(false);
            expect(mesh.userData.entityId).toBe(mockEntity.id);
            expect(mockContext.scene.children).toContain(mesh);
            expect(TransformSync.syncTransformToObject3D).toHaveBeenCalledWith(mockEntity, mesh);
        });

        it('initializes customGeometry as invisible and starts loading', () => {
            (mockContext as any).engineResourceResolver = {} as any;
            (GeometryFactory.build as jest.Mock).mockReturnValue(new THREE.BufferGeometry()); // placeholder
            mockEntity.getComponent.mockImplementation((name) => name === 'customGeometry' ? { type: 'customGeometry', key: 'custom.geo' } as any : undefined);

            (CustomGeometryLoader.prototype.load as jest.Mock).mockResolvedValue(null);

            feature.onAttach(mockEntity, mockContext);

            const rc = mockContext.registry.get(mockEntity.id);
            const mesh = rc?.object3D as THREE.Mesh;

            expect(mesh.visible).toBe(false);
            expect(CustomGeometryLoader.prototype.load).toHaveBeenCalledWith('custom.geo', mockContext.engineResourceResolver);
        });
    });

    describe('onUpdate', () => {
        it('syncs custom geometry when customGeometry component updates', () => {
            // Mock existing mesh
            const mesh = new THREE.Mesh();
            mesh.userData.customGeometryKeyApplied = 'old.geo';
            mockContext.registry.add(mockEntity.id, { entityId: mockEntity.id, object3D: mesh });
            (mockContext as any).engineResourceResolver = {} as any;

            mockEntity.getComponent.mockImplementation((name) => name === 'customGeometry' ? { type: 'customGeometry', key: 'new.geo' } as any : undefined);
            (CustomGeometryLoader.prototype.load as jest.Mock).mockResolvedValue(null);

            feature.onUpdate(mockEntity, 'customGeometry', mockContext);

            expect(CustomGeometryLoader.prototype.load).toHaveBeenCalledWith('new.geo', mockContext.engineResourceResolver);
        });

        it('hides custom geometry mesh if key is missing or component is disabled', () => {
            const mesh = new THREE.Mesh();
            mockContext.registry.add(mockEntity.id, { entityId: mockEntity.id, object3D: mesh });

            mockEntity.getComponent.mockImplementation((name) => name === 'customGeometry' ? { type: 'customGeometry', key: '' } as any : undefined);

            feature.onUpdate(mockEntity, 'customGeometry', mockContext);
            expect(mesh.visible).toBe(false);

            mockEntity.getComponent.mockImplementation((name) => name === 'customGeometry' ? { type: 'customGeometry', key: 'some.geo', enabled: false } as any : undefined);
            feature.onUpdate(mockEntity, 'customGeometry', mockContext);
            expect(mesh.visible).toBe(false);
        });

        it('recreates mesh for standard geometry updates', () => {
            const detachSpy = jest.spyOn(feature, 'onDetach');
            const attachSpy = jest.spyOn(feature, 'onAttach');

            mockEntity.getComponent.mockImplementation((name) => name === 'boxGeometry' ? { type: 'box' } as any : undefined);

            feature.onUpdate(mockEntity, 'boxGeometry', mockContext);

            expect(detachSpy).toHaveBeenCalledWith(mockEntity, mockContext);
            expect(attachSpy).toHaveBeenCalledWith(mockEntity, mockContext);
        });
    });

    describe('onTransformChanged', () => {
        it('syncs transform to object3D if exists and is Mesh', () => {
            const mesh = new THREE.Mesh();
            mockContext.registry.add(mockEntity.id, { entityId: mockEntity.id, object3D: mesh });
            feature.onTransformChanged(mockEntity, mockContext);
            expect(TransformSync.syncTransformToObject3D).toHaveBeenCalledWith(mockEntity, mesh);
        });
    });

    describe('onDetach', () => {
        it('removes from scene, registry and defers disposal', () => {
            const mesh = new THREE.Mesh();
            mockContext.scene.add(mesh);
            mockContext.registry.add(mockEntity.id, { entityId: mockEntity.id, object3D: mesh });

            feature.onDetach(mockEntity, mockContext);

            expect(mockContext.scene.children).not.toContain(mesh);
            expect(DebugUtils.deferredDisposeObject).toHaveBeenCalledWith(mesh);
            expect(mockContext.registry.has(mockEntity.id)).toBe(false);
        });
    });
});
