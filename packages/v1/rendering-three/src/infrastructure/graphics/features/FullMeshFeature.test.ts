import * as THREE from 'three';
import { FullMeshFeature } from './FullMeshFeature';
import { RenderObjectRegistry } from '../sync/RenderObjectRegistry';
import type { RenderContext } from './RenderContext';
import type { Entity, FullMeshComponent } from '@duckengine/core';
import * as TransformSync from '../sync/TransformSync';
import * as DebugUtils from '../debug/DebugUtils';

// Mock dependencies
jest.mock('../sync/TransformSync');
jest.mock('../debug/DebugUtils');

const mockLoad = jest.fn();
jest.mock('../loaders/FullGltfLoader', () => {
    return {
        FullGltfLoader: jest.fn().mockImplementation(() => {
            return { load: mockLoad };
        })
    };
});

// Need to import after the mock definition for clarity in some jest configs, but standard requires it top
import { FullGltfLoader } from '../loaders/FullGltfLoader';

describe('FullMeshFeature', () => {
    let feature: FullMeshFeature;
    let mockContext: RenderContext;
    let mockEntity: jest.Mocked<Entity>;

    beforeEach(() => {
        feature = new FullMeshFeature();
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
            id: 'fullmesh-entity',
            getComponent: jest.fn(),
        } as unknown as jest.Mocked<Entity>;

        jest.clearAllMocks();
    });

    it('isEligible returns true if entity has enabled fullMesh component', () => {
        mockEntity.getComponent.mockReturnValue({ enabled: true } as FullMeshComponent);
        expect(feature.isEligible(mockEntity)).toBe(true);

        mockEntity.getComponent.mockReturnValue({ enabled: false } as FullMeshComponent);
        expect(feature.isEligible(mockEntity)).toBe(false);

        mockEntity.getComponent.mockReturnValue(undefined);
        expect(feature.isEligible(mockEntity)).toBe(false);
    });

    describe('onAttach', () => {
        it('creates a placeholder group and adds it to scene/registry', () => {
            mockEntity.getComponent.mockReturnValue({ castShadow: true, receiveShadow: false } as FullMeshComponent);
            feature.onAttach(mockEntity, mockContext);

            const rc = mockContext.registry.get(mockEntity.id);
            expect(rc).toBeDefined();
            expect(rc?.object3D).toBeInstanceOf(THREE.Group);

            const group = rc?.object3D as THREE.Group;
            expect(group.visible).toBe(false);
            expect(group.userData.fullMeshCastShadow).toBe(true);
            expect(group.userData.fullMeshReceiveShadow).toBe(false);

            expect(mockContext.scene.children).toContain(group);
            expect(TransformSync.syncTransformToObject3D).toHaveBeenCalledWith(mockEntity, group);
        });

        it('triggers loadAndApplyFullGlb if engineResourceResolver is present and key is provided', () => {
            const resolver = {} as any;
            (mockContext as any).engineResourceResolver = resolver;
            mockEntity.getComponent.mockReturnValue({ key: 'model.glb' } as FullMeshComponent);

            mockLoad.mockResolvedValue(null);

            feature.onAttach(mockEntity, mockContext);

            expect(mockLoad).toHaveBeenCalledWith('model.glb', resolver);
        });
    });

    describe('onUpdate', () => {
        it('calls onAttach if object3D does not exist in registry', () => {
            const attachSpy = jest.spyOn(feature, 'onAttach');
            mockEntity.getComponent.mockReturnValue({ key: 'model.glb' } as FullMeshComponent);

            feature.onUpdate(mockEntity, 'fullMesh', mockContext);

            expect(attachSpy).toHaveBeenCalledWith(mockEntity, mockContext);
        });

        it('syncs shadows and triggers reload when key changes', () => {
            (mockContext as any).engineResourceResolver = {} as any;
            const group = new THREE.Group();
            group.userData.fullMeshKeyApplied = 'old.glb';
            mockContext.registry.add(mockEntity.id, { entityId: mockEntity.id, object3D: group });
            mockEntity.getComponent.mockReturnValue({ key: 'new.glb', castShadow: true } as FullMeshComponent);

            mockLoad.mockResolvedValue(null);

            feature.onUpdate(mockEntity, 'fullMesh', mockContext);

            expect(group.userData.fullMeshCastShadow).toBe(true);
            expect(group.visible).toBe(false);
            expect(mockLoad).toHaveBeenCalledWith('new.glb', mockContext.engineResourceResolver);
        });

        it('clears placeholder when key is removed', () => {
            const group = new THREE.Group();
            const childNode = new THREE.Object3D();
            group.add(childNode);
            group.userData.fullMeshKeyApplied = 'old.glb';
            group.visible = true;
            mockContext.registry.add(mockEntity.id, { entityId: mockEntity.id, object3D: group });
            mockEntity.getComponent.mockReturnValue({ key: '' } as FullMeshComponent);

            feature.onUpdate(mockEntity, 'fullMesh', mockContext);

            expect(group.children.length).toBe(0);
            expect(DebugUtils.deferredDisposeObject).toHaveBeenCalledWith(childNode);
            expect(group.userData.fullMeshKeyApplied).toBe('');
            expect(group.visible).toBe(false);
        });
    });

    describe('onTransformChanged', () => {
        it('syncs transform to object3D if exists', () => {
            const group = new THREE.Group();
            mockContext.registry.add(mockEntity.id, { entityId: mockEntity.id, object3D: group });
            feature.onTransformChanged(mockEntity, mockContext);
            expect(TransformSync.syncTransformToObject3D).toHaveBeenCalledWith(mockEntity, group);
        });
    });

    describe('onDetach', () => {
        it('removes from scene, registry and defers disposal', () => {
            const group = new THREE.Group();
            mockContext.scene.add(group);
            mockContext.registry.add(mockEntity.id, { entityId: mockEntity.id, object3D: group });

            feature.onDetach(mockEntity, mockContext);

            expect(mockContext.scene.children).not.toContain(group);
            expect(DebugUtils.deferredDisposeObject).toHaveBeenCalledWith(group);
            expect(mockContext.registry.has(mockEntity.id)).toBe(false);
        });
    });

    describe('GLB Loading Resolution', () => {
        it('applies loaded root to placeholder and configures animations', async () => {
            (mockContext as any).engineResourceResolver = {} as any;
            const group = new THREE.Group();
            mockContext.registry.add(mockEntity.id, { entityId: mockEntity.id, object3D: group });
            mockEntity.getComponent.mockReturnValue({ key: 'model.glb' } as FullMeshComponent);

            const resultNode = new THREE.Mesh();
            const clip = new THREE.AnimationClip('anim', 1, []);

            let resolveLoad: any;
            const loadPromise = new Promise((r) => { resolveLoad = r; });
            mockLoad.mockReturnValue(loadPromise);

            feature.onAttach(mockEntity, mockContext);

            // Resolve the returned promise
            resolveLoad({ root: resultNode, animations: [clip] });

            // Await the promise to clear microtasks
            await loadPromise;
            // Ensure macrotask queue runs
            await new Promise(r => setTimeout(r, 0));

            const rc = mockContext.registry.get(mockEntity.id);
            const activeGroup = rc?.object3D as THREE.Group;

            expect(activeGroup.children.length).toBe(1);
            expect(activeGroup.visible).toBe(true);
            expect(activeGroup.userData.fullMeshKeyApplied).toBe('model.glb');

            expect(rc?.animationMixer).toBeDefined();
            expect(rc?.availableAnimations).toEqual([clip]);
        });

        it('ignores outdated load results if key changed during load', async () => {
            (mockContext as any).engineResourceResolver = {} as any;
            mockEntity.getComponent.mockReturnValue({ key: 'model1.glb' } as FullMeshComponent);

            let resolveLoad1: any;
            const loadPromise1 = new Promise((r) => { resolveLoad1 = r; });
            mockLoad.mockReturnValueOnce(loadPromise1);

            feature.onAttach(mockEntity, mockContext);

            let resolveLoad2: any;
            const loadPromise2 = new Promise((r) => { resolveLoad2 = r; });
            mockLoad.mockReturnValueOnce(loadPromise2);

            mockEntity.getComponent.mockReturnValue({ key: 'model2.glb' } as FullMeshComponent);
            feature.onUpdate(mockEntity, 'fullMesh', mockContext);

            resolveLoad1({ root: new THREE.Mesh(), animations: [] });
            await loadPromise1;
            await new Promise(r => setTimeout(r, 0));

            const rc1 = mockContext.registry.get(mockEntity.id);
            const activeGroup1 = rc1?.object3D as THREE.Group;
            expect(activeGroup1.children.length).toBe(0);

            resolveLoad2({ root: new THREE.Mesh(), animations: [] });
            await loadPromise2;
            await new Promise(r => setTimeout(r, 0));

            const rc2 = mockContext.registry.get(mockEntity.id);
            const activeGroup2 = rc2?.object3D as THREE.Group;
            expect(activeGroup2.children.length).toBe(1);
        });
    });
});
