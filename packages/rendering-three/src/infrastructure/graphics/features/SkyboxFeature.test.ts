import * as THREE from 'three';
import { SkyboxFeature } from './SkyboxFeature';
import type { RenderContext } from './RenderContext';
import type { Entity, SkyboxComponent } from '@duckengine/ecs';
import { deferredDispose } from '../debug/DebugUtils';

jest.mock('../debug/DebugUtils');

describe('SkyboxFeature', () => {
    let feature: SkyboxFeature;
    let mockContext: RenderContext;
    let mockResolver: any;

    beforeEach(() => {
        feature = new SkyboxFeature();
        mockResolver = { resolve: jest.fn() };
        mockContext = {
            scene: new THREE.Scene(),
            registry: {} as any, // Not heavily used here outside standard feature stuff
            textureCache: {} as any,
            entities: new Map(),
            debugFlags: {},
            engineResourceResolver: mockResolver,
            isInitialLoading: false,
        } as unknown as RenderContext;

        jest.clearAllMocks();
    });

    const createMockEntity = (id: string, skyboxComp?: any): Entity => {
        return {
            id,
            getComponent: jest.fn().mockImplementation((name) => name === 'skybox' ? skyboxComp : undefined)
        } as unknown as Entity;
    };

    it('isEligible returns true if entity has skybox component', () => {
        const ent = createMockEntity('1', { key: 'sky' });
        expect(feature.isEligible(ent)).toBe(true);

        const ent2 = createMockEntity('2', undefined);
        expect(feature.isEligible(ent2)).toBe(false);
    });

    describe('syncSkybox', () => {
        it('clears skybox if no desired key is found', () => {
            const ent1 = createMockEntity('1', { enabled: false, key: 'sk1' });
            mockContext.entities.set('1', ent1);

            const tex = new THREE.Texture();
            mockContext.scene.background = tex;
            (feature as any).currentSkyboxResourceKey = 'old';
            (feature as any).currentSkyboxTexture = tex;

            feature.onAttach(ent1, mockContext); // triggers syncSkybox

            expect(mockContext.scene.background).toBeNull();
            expect(deferredDispose).toHaveBeenCalledWith(tex);
            expect((feature as any).currentSkyboxResourceKey).toBeNull();
        });

        it('does nothing if desired key is already active', () => {
            const ent1 = createMockEntity('1', { enabled: true, key: 'sk1' });
            mockContext.entities.set('1', ent1);

            const tex = new THREE.Texture();
            mockContext.scene.background = tex;
            (feature as any).currentSkyboxResourceKey = 'sk1';
            (feature as any).currentSkyboxTexture = tex;

            const resolveSpy = jest.spyOn(mockResolver, 'resolve');

            feature.onUpdate(ent1, 'skybox', mockContext); // triggers syncSkybox

            expect(resolveSpy).not.toHaveBeenCalled();
            expect(mockContext.scene.background).toBe(tex);
        });

        it('loads equirectangular skybox successfully', async () => {
            const ent1 = createMockEntity('1', { enabled: true, key: 'new-sky' });
            mockContext.entities.set('1', ent1);

            mockResolver.resolve.mockResolvedValue({
                files: { equirect: { url: 'fake.jpg' } }
            });

            const loadSpy = jest.spyOn(THREE.TextureLoader.prototype, 'load').mockImplementation(function (this: any, url: any, onLoad: any) {
                setTimeout(() => onLoad!(new THREE.Texture()), 0);
                return this;
            });

            feature.onAttach(ent1, mockContext);

            // Wait for promises
            await new Promise(r => setTimeout(r, 100));

            expect(loadSpy).toHaveBeenCalled();

            const tex = mockContext.scene.background;
            expect(tex).toBeInstanceOf(THREE.Texture);
            expect((tex as THREE.Texture).mapping).toBe(THREE.EquirectangularReflectionMapping);
            expect((feature as any).currentSkyboxResourceKey).toBe('new-sky');
            loadSpy.mockRestore();
        });

        it('loads cube skybox successfully', async () => {
            const ent1 = createMockEntity('1', { enabled: true, key: 'cube-sky' });
            mockContext.entities.set('1', ent1);

            mockResolver.resolve.mockResolvedValue({
                files: {
                    px: { url: '1' }, nx: { url: '1' },
                    py: { url: '1' }, ny: { url: '1' },
                    pz: { url: '1' }, nz: { url: '1' },
                }
            });

            const loadSpy = jest.spyOn(THREE.CubeTextureLoader.prototype, 'load').mockImplementation(function (this: any, urls: any, onLoad: any) {
                setTimeout(() => onLoad!(new THREE.CubeTexture()), 0);
                return this;
            });

            feature.onUpdate(ent1, 'skybox', mockContext);

            // Wait for JSDOM image loading
            await new Promise(r => setTimeout(r, 100));

            expect(loadSpy).toHaveBeenCalled();
            const tex = mockContext.scene.background;
            expect(tex).toBeInstanceOf(THREE.CubeTexture);
            expect((feature as any).currentSkyboxResourceKey).toBe('cube-sky');
            loadSpy.mockRestore();
        });

        it('aborts load if key changes during load', async () => {
            const ent1 = createMockEntity('1', { enabled: true, key: 'sky1' });
            mockContext.entities.set('1', ent1);

            let resolveFirst: any;
            const firstPromise = new Promise(r => resolveFirst = r);
            mockResolver.resolve.mockReturnValueOnce(firstPromise);

            // Start first load
            feature.onAttach(ent1, mockContext);

            // Change key and trigger second load
            const ent2 = createMockEntity('1', { enabled: true, key: 'sky2' });
            mockContext.entities.set('1', ent2);

            mockResolver.resolve.mockResolvedValueOnce({ files: { equirect: { url: 'fake2.jpg' } } });

            const loadSpy = jest.spyOn(THREE.TextureLoader.prototype, 'load').mockImplementation(function (this: any, url: any, onLoad: any) {
                setTimeout(() => onLoad!(new THREE.Texture()), 0);
                return this;
            });

            feature.onUpdate(ent2, 'skybox', mockContext);

            // Now resolve first resource
            resolveFirst({ files: { equirect: { url: 'fake1.jpg' } } });

            // Wait for both to finish
            await new Promise(r => setTimeout(r, 100));

            expect((feature as any).currentSkyboxResourceKey).toBe('sky2');
            expect(mockContext.scene.background).toBeInstanceOf(THREE.Texture);
            loadSpy.mockRestore();
        });
    });
});
