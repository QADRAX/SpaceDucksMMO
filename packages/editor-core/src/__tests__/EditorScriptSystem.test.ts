import { EditorScriptSystem } from '../domain/scripting/EditorScriptSystem';
import { IEditorPluginRegistry, IEditorPlugin, EditorPluginConfigValue } from '../domain/plugin/IEditorPlugin';

// Mock registry for test
class MockRegistry implements IEditorPluginRegistry {
    plugins: IEditorPlugin[] = [];
    register(plugin: Omit<IEditorPlugin, "config">): void {
        this.plugins.push(plugin as IEditorPlugin);
    }
    unregister(pluginId: string): void { }
    setEnabled(pluginId: string, enabled: boolean): void { }
    setConfig(pluginId: string, key: string, value: EditorPluginConfigValue): void { }
}

async function run() {
    console.log('Initializing EditorScriptSystem...');
    const registry = new MockRegistry();
    const mockEditorEngine: any = {
        scene: {
            getEntities: () => []
        }
    };
    const scriptSystem = new EditorScriptSystem(registry, mockEditorEngine);
    await scriptSystem.initialize();

    const luaPluginCode = `
    return {
        meta = {
            id = "test-plugin",
            displayName = "Test Plugin",
            category = "panels"
        },
        slotFills = {
            {
                slot = "toolbar",
                priority = 10,
                ui = function(ctx)
                    return editor.ui.row({
                        editor.ui.button("TestBtn", { onClick = function() print("clicked") end }),
                        editor.ui.label("Hello Editor-Core")
                    })
                end
            }
        }
    }
    `;

    console.log('Loading plugin from source...');
    const plugin = scriptSystem.loadPluginFromSource(luaPluginCode);

    console.log('Plugin loaded:', plugin.meta.displayName);
    if (plugin.slotFills && plugin.slotFills.length > 0) {
        const fill = plugin.slotFills[0];
        console.log('Testing Slot Fill UI Descriptor Generation for slot:', fill.slot);

        // Mock context
        const ctx: any = { selectedEntityId: null, gameState: 'stopped' };
        const descriptor = fill.ui(ctx);

        console.dir(descriptor, { depth: null });

        if (descriptor && !Array.isArray(descriptor) && descriptor.type === 'row') {
            console.log('SUCCESS: Generated UI descriptor matches expected format!');
        } else {
            console.error('FAILED: Descriptor format incorrect');
            process.exit(1);
        }
    } else {
        console.error('FAILED: No slot fills found');
        process.exit(1);
    }

    scriptSystem.dispose();
}

run().catch(console.error);
