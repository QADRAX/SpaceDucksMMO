import * as THREE from 'three';
import { MaterialFeature } from './MaterialFeature';
import { RenderObjectRegistry } from '../sync/RenderObjectRegistry';
import type { RenderContext } from './RenderContext';
import type { Entity } from '@duckengine/core';
import { MaterialFactory } from '../factories/MaterialFactory';
import { ShaderMaterialFactory } from '../factories/ShaderMaterialFactory';
import * as DebugUtils from '../debug/DebugUtils';

jest.mock('../factories/MaterialFactory');
jest.mock('../factories/ShaderMaterialFactory');
jest.mock('../debug/DebugUtils');

describe('MaterialFeature', () => {
    let feature: MaterialFeature;
    let mockContext: RenderContext;
    let mockEntity: jest.Mocked<Entity>;

    beforeEach(() => {
        feature = new MaterialFeature();
        mockContext = {
            scene: new THREE.Scene(),
            registry: new RenderObjectRegistry(),
            textureCache: { load: jest.fn() } as any,
            textureCatalog: { getVariantsById: jest.fn() } as any,
            entities: new Map(),
            debugFlags: {},
            activeCameraEntityId: null,
            isInitialLoading: false,
        };

        mockEntity = {
            id: 'mat-entity',
            getComponent: jest.fn(),
        } as unknown as jest.Mocked<Entity>;

        jest.clearAllMocks();
    });

    it('isEligible returns true if entity has enabled material component', () => {
        const testCases = [
            { comps: { standardMaterial: { enabled: true } }, expected: true },
            { comps: { basicMaterial: { enabled: true } }, expected: true },
            { comps: { standardMaterial: { enabled: false } }, expected: false },
            { comps: { unrelated: { enabled: true } }, expected: false },
        ];

        for (const tc of testCases) {
            mockEntity.getComponent.mockImplementation((name) => tc.comps[name as keyof typeof tc.comps] as any);
            expect(feature.isEligible(mockEntity)).toBe(tc.expected);
        }
    });

    describe('onAttach / syncMaterial', () => {
        it('applies default material if no valid material component is found but object3D exists', () => {
            const mesh = new THREE.Mesh();
            mesh.material = new THREE.MeshBasicMaterial();
            mockContext.registry.add(mockEntity.id, { entityId: mockEntity.id, object3D: mesh });

            mockEntity.getComponent.mockReturnValue(undefined);

            feature.onAttach(mockEntity, mockContext);

            expect(DebugUtils.deferredDispose).toHaveBeenCalled(); // Original material disposed
            expect(mesh.material).toBeInstanceOf(THREE.MeshStandardMaterial);
            expect((mesh.material as THREE.MeshStandardMaterial).color.getHex()).toBe(0xcccccc);
        });

        it('creates and applies StandardMaterial using factory', () => {
            const mesh = new THREE.Mesh();
            mockContext.registry.add(mockEntity.id, { entityId: mockEntity.id, object3D: mesh });

            const stdComp = { enabled: true } as any;
            mockEntity.getComponent.mockImplementation((name) => name === 'standardMaterial' ? stdComp : undefined);

            const mockMat = new THREE.MeshStandardMaterial();
            (MaterialFactory.build as jest.Mock).mockReturnValue(mockMat);

            feature.onAttach(mockEntity, mockContext);

            expect(MaterialFactory.build).toHaveBeenCalledWith(stdComp, mockContext.textureCache, expect.any(Function));
            expect(mesh.material).toBe(mockMat);
        });
    });

    describe('onUpdate', () => {
        it('syncs material if material component updates', () => {
            const mesh = new THREE.Mesh();
            mockContext.registry.add(mockEntity.id, { entityId: mockEntity.id, object3D: mesh });

            const stdComp = { enabled: true } as any;
            mockEntity.getComponent.mockImplementation((name) => name === 'standardMaterial' ? stdComp : undefined);
            const mockMat = new THREE.MeshStandardMaterial();
            (MaterialFactory.build as jest.Mock).mockReturnValue(mockMat);

            feature.onUpdate(mockEntity, 'standardMaterial', mockContext);

            expect(MaterialFactory.build).toHaveBeenCalled();
            expect(mesh.material).toBe(mockMat);
        });

        it('syncs texture tiling on textureTiling update', () => {
            const mesh = new THREE.Mesh();
            const tex = new THREE.Texture();
            const mat = new THREE.MeshStandardMaterial({ map: tex });
            mesh.material = mat;
            mockContext.registry.add(mockEntity.id, { entityId: mockEntity.id, object3D: mesh });

            mockEntity.getComponent.mockImplementation((name) => name === 'textureTiling' ? { repeatU: 2, repeatV: 3, offsetU: 0.5, offsetV: 0.2 } as any : undefined);

            feature.onUpdate(mockEntity, 'textureTiling', mockContext);

            expect(tex.repeat.x).toBe(2);
            expect(tex.repeat.y).toBe(3);
            expect(tex.offset.x).toBe(0.5);
            expect(tex.offset.y).toBe(0.2);
            expect(tex.wrapS).toBe(THREE.RepeatWrapping);
            expect(tex.wrapT).toBe(THREE.RepeatWrapping);
        });
    });

    describe('onComponentRemoved', () => {
        it('applies default material if material component removed', () => {
            const mesh = new THREE.Mesh();
            mockContext.registry.add(mockEntity.id, { entityId: mockEntity.id, object3D: mesh });

            mockEntity.getComponent.mockReturnValue(undefined); // No materials left
            feature.onComponentRemoved(mockEntity, 'standardMaterial', mockContext);

            expect(mesh.material).toBeInstanceOf(THREE.MeshStandardMaterial);
            expect((mesh.material as THREE.MeshStandardMaterial).color.getHex()).toBe(0xcccccc);
        });

        it('resets texture tiling if textureTiling component removed', () => {
            const mesh = new THREE.Mesh();
            const tex = new THREE.Texture();
            tex.repeat.set(2, 2);
            tex.offset.set(0.5, 0.5);
            const mat = new THREE.MeshStandardMaterial({ map: tex });
            mesh.material = mat;
            mockContext.registry.add(mockEntity.id, { entityId: mockEntity.id, object3D: mesh });

            feature.onComponentRemoved(mockEntity, 'textureTiling', mockContext);

            expect(tex.repeat.x).toBe(1);
            expect(tex.repeat.y).toBe(1);
            expect(tex.offset.x).toBe(0);
            expect(tex.offset.y).toBe(0);
        });
    });

    describe('onDetach', () => {
        it('applies default material to mesh', () => {
            const mesh = new THREE.Mesh();
            mockContext.registry.add(mockEntity.id, { entityId: mockEntity.id, object3D: mesh });

            feature.onDetach(mockEntity, mockContext);

            expect(mesh.material).toBeInstanceOf(THREE.MeshStandardMaterial);
            expect((mesh.material as THREE.MeshStandardMaterial).color.getHex()).toBe(0xcccccc);
        });
    });

    describe('Texture Resolving', () => {
        it('resolves textures from catalog and cache asynchronously', async () => {
            const mesh = new THREE.Mesh();
            mockContext.registry.add(mockEntity.id, { entityId: mockEntity.id, object3D: mesh });

            const stdComp = { enabled: true, texture: 'catalog-tex' } as any;
            mockEntity.getComponent.mockImplementation((name) => name === 'standardMaterial' ? stdComp : undefined);

            const mockMat = new THREE.MeshStandardMaterial();
            (MaterialFactory.build as jest.Mock).mockReturnValue(mockMat);

            const texLoaded = new THREE.Texture();
            (mockContext.textureCatalog!.getVariantsById as jest.Mock).mockResolvedValue([{ path: 'path/to/tex.png' }]);
            (mockContext.textureCache.load as jest.Mock).mockResolvedValue(texLoaded);

            // Execute sync
            feature.onAttach(mockEntity, mockContext);

            // Wait for internal async resolution
            await new Promise(r => setTimeout(r, 100));

            expect(mockContext.textureCatalog!.getVariantsById).toHaveBeenCalledWith('catalog-tex');
            expect(mockContext.textureCache.load).toHaveBeenCalledWith('path/to/tex.png');
            expect(mockMat.map).toBeInstanceOf(THREE.Texture);
        });
    });
});
