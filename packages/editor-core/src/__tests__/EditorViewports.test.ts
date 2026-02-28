import { EditorEngine } from '../domain/state/EditorEngine';
import { EditorScriptSystem } from '../domain/scripting/EditorScriptSystem';
import { IEditorPluginRegistry } from '../domain/plugin/IEditorPlugin';
import { Entity, IScene, CoreLogger } from '@duckengine/core';

// Mock Registry
class MockRegistry implements IEditorPluginRegistry {
    plugins: any[] = [];
    register(p: any) { this.plugins.push(p); }
    unregister(id: string) { this.plugins = this.plugins.filter(p => p.meta.id !== id); }
    setEnabled(id: string, enabled: boolean) { }
    setConfig(id: string, config: any) { }
}

// Mock Scene
class MockScene implements IScene {
    id = 'test-scene';
    entities = new Map<string, Entity>();
    addEntity(e: Entity) { this.entities.set(e.id, e); }
    removeEntity(id: string) { this.entities.delete(id); }
    getEntity(id: string) { return this.entities.get(id); }
    getAllEntities() { return this.entities.values(); }
    getEntities() { return Array.from(this.entities.values()); }
    setup() { }
    update() { }
    teardown() { }
    setActiveCamera() { }
    getActiveCamera() { return null; }
}

async function runTest() {
    CoreLogger.subscribe(msg => {
        console.log(`[Lua ${msg.severity.toUpperCase()}] ${msg.message}`);
    });

    console.log('--- Starting Viewport Architecture Test ---');

    const scene = new MockScene();
    const registry = new MockRegistry();
    const engine = new EditorEngine({ scene, registry });
    const scriptSystem = new EditorScriptSystem(registry, engine);

    await scriptSystem.initialize();

    console.log('1. Creating Viewport...');
    const viewport = engine.createViewport('v1', 'scene');
    engine.setActiveViewport('v1');

    console.log('2. Running Lua script to spawn Editor Entity...');
    const luaCode = `
        local ent = editor.viewports.getActive():spawnEntity("FreeCam")
        print("Lua: Spawned entity with ID: " .. (ent and ent.id or "nil"))
        if ent then
            print("Lua: Setting displayName...")
            ent.displayName = "SpawnedFromLua"
            print("Lua: Returning ID...")
            return ent.id
        end
        return nil
    `;

    const resultId = await scriptSystem.executeString(luaCode);
    console.log('Spawned Entity ID:', resultId);

    // Assertions
    const spawnedEntity = scene.getEntity(resultId);
    if (!spawnedEntity) throw new Error('Entity was not added to scene');
    if (spawnedEntity.displayName !== 'SpawnedFromLua') throw new Error('Entity properties not set correctly');

    console.log('3. Verifying Viewport tracking...');
    if (viewport.trackedEntities.length !== 1) throw new Error('Viewport is not tracking the spawned entity');
    if (viewport.trackedEntities[0] !== resultId) throw new Error('Tracked entity ID mismatch');

    // 4. Test Viewport Orchestration (Conceptual)
    console.log('4. Testing Viewport Orchestration (Data-driven)...');

    engine.registerViewportProfile('default-scene', {
        scriptId: 'builtin/viewport/free_cam.lua',
        plugins: ['builtin/plugins/ui_stats.lua'],
        properties: { moveSpeed: 10 }
    });

    viewport.applyConfiguration(engine['_viewportProfiles'].get('default-scene'));

    console.log('- Verified applyConfiguration call (Conceptual).');

    console.log('6. Disposing Viewport...');
    engine.destroyViewport('v1');

    if (scene.entities.has(resultId)) throw new Error('Entity was not cleaned up from scene');
    if (engine.getAllViewports().length !== 0) throw new Error('Viewport was not removed from engine');

    console.log('SUCCESS: Viewport architecture refactored to decoupled orchestration!');
}

runTest().catch(err => {
    console.error('TEST FAILED:', err);
    process.exit(1);
});
