import { EditorScriptSystem } from '../domain/scripting/EditorScriptSystem';
import { IEditorExtensionRegistry, IEditorExtension, EditorExtensionConfigValue } from '../domain/extension/IEditorExtension';

// Mock registry for test
class MockRegistry implements IEditorExtensionRegistry {
    extensions: IEditorExtension[] = [];
    register(extension: Omit<IEditorExtension, "config">): void {
        this.extensions.push(extension as IEditorExtension);
    }
    unregister(id: string): void { }
    setEnabled(id: string, enabled: boolean): void { }
    setConfig(id: string, key: string, value: EditorExtensionConfigValue): void { }
}

async function run() {
    console.log('Initializing EditorScriptSystem...');
    const registry = new MockRegistry();
    const mockEditorSession: any = {
        scene: {
            getEntities: () => []
        }
    };
    const scriptSystem = new EditorScriptSystem(registry, mockEditorSession);
    await scriptSystem.initialize();

    const luaExtensionCode = `
    return {
        meta = {
            id = "test-extension",
            displayName = "Test Extension",
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

    console.log('Loading extension from source...');
    const extension = scriptSystem.loadExtensionFromSource(luaExtensionCode);

    console.log('Extension loaded:', extension.meta.displayName);
    if (extension.slotFills && extension.slotFills.length > 0) {
        const fill = extension.slotFills[0];
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
