import * as THREE from 'three';
import { RenderSyncSystem } from './RenderSyncSystem';
import { FeatureRouter } from '../features/FeatureRouter';
import { DebugFeature } from '../features/DebugFeature';
import { ShaderUniformUpdater } from './ShaderUniformUpdater';
import type { Entity, ComponentType } from '@duckengine/core';

jest.mock('../features/FeatureRouter');
jest.mock('../features/DebugFeature');
jest.mock('./ShaderUniformUpdater');
jest.mock('../factories/TextureCache');

describe('RenderSyncSystem', () => {
    let system: RenderSyncSystem;
    let scene: THREE.Scene;

    beforeEach(() => {
        scene = new THREE.Scene();
        jest.clearAllMocks();
        system = new RenderSyncSystem(scene);
    });

    const createMockEntity = (id: string): any => {
        const components: any[] = [];
        return {
            id,
            getAllComponents: jest.fn().mockReturnValue(components),
            addComponentListener: jest.fn(),
            removeComponentListener: jest.fn(),
            getChildren: jest.fn().mockReturnValue([]),
            transform: { onChange: jest.fn() },
            __components: components, // Helper for tests
        };
    };

    describe('Initialization', () => {
        it('initializes context, router, and default features', () => {
            expect(FeatureRouter).toHaveBeenCalledTimes(1);
            expect(DebugFeature).toHaveBeenCalledTimes(1);
            const routerInstance = (FeatureRouter as jest.Mock).mock.instances[0];

            expect(routerInstance.addFeature).toHaveBeenCalledTimes(10); // Cam, Light, Geo, Full, Mat, Shader, Anim, Sky, Debug, LensFlare
        });
    });

    describe('Entity Lifecycle', () => {
        it('addEntity registers entity, hooks listeners, and forwards to router', () => {
            const entity = createMockEntity('ent1');
            const routerInstance = (FeatureRouter as jest.Mock).mock.instances[0];

            system.addEntity(entity);

            expect(system.getEntities().has('ent1')).toBe(true);
            expect(routerInstance.onEntityAdded).toHaveBeenCalledWith(entity);
            expect(entity.addComponentListener).toHaveBeenCalled();
            expect(entity.transform.onChange).toHaveBeenCalled();
        });

        it('addEntity recursively registers children', () => {
            const child = createMockEntity('child1');
            const parent = createMockEntity('parent1');
            parent.getChildren.mockReturnValue([child]);

            system.addEntity(parent);

            expect(system.getEntities().has('child1')).toBe(true);
            expect(system.getEntities().has('parent1')).toBe(true);
        });

        it('removeEntity unregisters entity, cleans router/registry, and removes listeners', () => {
            const entity = createMockEntity('ent1');
            const routerInstance = (FeatureRouter as jest.Mock).mock.instances[0];

            system.addEntity(entity);
            expect(system.getEntities().has('ent1')).toBe(true);

            system.removeEntity('ent1');

            expect(system.getEntities().has('ent1')).toBe(false);
            expect(entity.removeComponentListener).toHaveBeenCalled();
            expect(routerInstance.onEntityRemoved).toHaveBeenCalledWith(entity);
        });
    });

    describe('Component Event Handling', () => {
        it('onComponentChanged forwards directly to router if entity exists', () => {
            const entity = createMockEntity('ent1');
            const routerInstance = (FeatureRouter as jest.Mock).mock.instances[0];

            system.addEntity(entity);
            system.onComponentChanged('ent1', 'transform' as any);

            expect(routerInstance.onComponentChanged).toHaveBeenCalledWith(entity, 'transform');
        });

        it('onComponentRemoved defers feature router update to next microtask', async () => {
            const entity = createMockEntity('ent1');
            const routerInstance = (FeatureRouter as jest.Mock).mock.instances[0];

            system.addEntity(entity);
            system.onComponentRemoved('ent1', 'transform' as any);

            // Synchronously, it shouldn't be called yet due to Promise defer
            expect(routerInstance.onComponentRemoved).not.toHaveBeenCalled();

            // Wait 1 microtask
            await new Promise(r => setTimeout(r, 0));

            expect(routerInstance.onComponentRemoved).toHaveBeenCalledWith(entity, 'transform');
        });

        it('onComponentRemoved does not forward if entity is destroyed before microtask', async () => {
            const entity = createMockEntity('ent1');
            const routerInstance = (FeatureRouter as jest.Mock).mock.instances[0];

            system.addEntity(entity);
            system.onComponentRemoved('ent1', 'transform' as any);
            system.removeEntity('ent1'); // remove before microtask fires

            await new Promise(r => setTimeout(r, 0));

            expect(routerInstance.onComponentRemoved).not.toHaveBeenCalled();
        });
    });

    describe('Update loop', () => {
        it('update updates shader uniforms and features', () => {
            const routerInstance = (FeatureRouter as jest.Mock).mock.instances[0];
            const uniformUpdaterInst = (ShaderUniformUpdater as jest.Mock).mock.instances[0];

            const rcMock = { object3D: new THREE.Mesh() };
            (system as any).registry.add('ent1', rcMock);
            system.addEntity(createMockEntity('ent1'));

            system.update(0.016);

            expect(uniformUpdaterInst.update).toHaveBeenCalledWith(0.016, expect.any(Object), rcMock);
            expect(routerInstance.onFrame).toHaveBeenCalledWith(0.016);
        });
    });

    describe('Misc flags and accessors', () => {
        it('getCamera returns three camera if found in registry', () => {
            const cam = new THREE.PerspectiveCamera();
            (system as any).registry.add('ent1', { object3D: cam });
            expect(system.getCamera('ent1')).toBe(cam);
        });

        it('getCamera returns undefined if not found or not a camera', () => {
            const mesh = new THREE.Mesh();
            (system as any).registry.add('ent1', { object3D: mesh });
            expect(system.getCamera('ent1')).toBeUndefined();
            expect(system.getCamera('non-existent')).toBeUndefined();
        });

        it('setSceneDebugEnabled updates flags and propagates to DebugFeature', () => {
            const debugFeatureInst = (DebugFeature as jest.Mock).mock.instances[0];
            system.setSceneDebugEnabled('mesh', true);

            expect((system as any).debugFlags.mesh).toBe(true);
            expect(debugFeatureInst.setSceneDebugEnabled).toHaveBeenCalledWith('mesh', true, expect.any(Object));
        });

        it('setActiveCameraEntityId propagates to DebugFeature and context', () => {
            const debugFeatureInst = (DebugFeature as jest.Mock).mock.instances[0];
            system.setActiveCameraEntityId('cam-ent');

            expect((system as any).context.activeCameraEntityId).toBe('cam-ent');
            expect(debugFeatureInst.setActiveCameraEntityId).toHaveBeenCalledWith('cam-ent', null, expect.any(Object));
        });

        it('setIsInitialLoading updates context and propagates to textureCache', () => {
            const spy = jest.spyOn((system as any).textureCache, 'setIsInitialLoading').mockImplementation(() => { });
            system.setIsInitialLoading(true);
            expect((system as any).context.isInitialLoading).toBe(true);
            expect(spy).toHaveBeenCalledWith(true);
        });
    });
});
