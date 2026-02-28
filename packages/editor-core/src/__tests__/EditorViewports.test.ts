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

    // 4. Test Viewport Plugins
    console.log('4. Testing Viewport Plugins...');
    const { FreeCamViewportPlugin } = require('../domain/plugin/FreeCamViewportPlugin');
    const camPlugin = new FreeCamViewportPlugin();
    viewport.registerPlugin(camPlugin);

    const ui = viewport.getUIContributions();
    if (ui.length === 0) throw new Error("Viewport plugin should contribute UI");
    console.log(`- UI Contributions count: ${ui.length}`);

    const toolbarBtn = ui.find((c: any) => c.slot === 'toolbar')?.descriptor as any;
    if (toolbarBtn?.props?.text !== 'Reset Cam') throw new Error("Missing 'Reset Cam' button in toolbar");
    console.log('- Verified "Reset Cam" button in toolbar.');

    console.log('4.5 Testing Lua-based Viewport Plugin (Class-based syntax)...');
    const fs = require('fs');
    const path = require('path');
    const luaPluginSource = fs.readFileSync(path.join(__dirname, '../../res/scripts/builtin/lua_free_cam.lua'), 'utf-8');
    const luaSpawnCode = `
        local pluginDef = (function()
            ${luaPluginSource}
        end)()
        editor.viewports.getActive():registerPlugin(pluginDef)
    `;
    await scriptSystem.executeString(luaSpawnCode);

    const fullUI = viewport.getUIContributions();
    console.log(`- Total UI Contributions (TS+Lua): ${fullUI.length}`);
    const luaBtn = fullUI.find((c: any) => c.descriptor?.props?.text === 'Reset Lua Cam');
    if (!luaBtn) throw new Error("Missing 'Reset Lua Cam' button from Lua plugin");
    console.log('- Verified "Reset Lua Cam" button from Lua plugin.');

    console.log('5. Testing Lua Pointer Events...');
    // Simulated event
    const ev = { button: 2 } as any;
    // We can't easily call the private _plugins from outside, but we can trigger it via the viewport's public pointer methods if we have them.
    // For now, let's just inspect the plugin instance's property we set in Lua.
    const vpPlugins = (viewport as any)._plugins;
    const luaPluginInstance = vpPlugins.get('builtin:lua-free-cam').plugin;

    // Trigger onPointerDown directly to see if it works and returns true
    const luaCtx = (viewport as any)._createContext();
    const consumed = luaPluginInstance.onPointerDown(ev, luaCtx);
    if (consumed !== true) throw new Error("Lua plugin should have consumed right-click (button 2)");
    console.log('- Lua plugin correctly consumed pointer down.');

    console.log('6. Disposing Viewport...');
    engine.destroyViewport('v1');

    if (scene.entities.has(resultId)) throw new Error('Entity was not cleaned up from scene');
    if (engine.getAllViewports().length !== 0) throw new Error('Viewport was not removed from engine');

    console.log('SUCCESS: Viewport architecture works end-to-end!');
}

runTest().catch(err => {
    console.error('TEST FAILED:', err);
    process.exit(1);
});
