import { LuaEngine } from 'wasmoon';
import { EditorBridgeContext } from './EditorBridgeContext';

export function registerEditorApiBridge(engine: LuaEngine, ctx: EditorBridgeContext) {
    const editorApi = {
        // --- Scene Queries ---
        findEntityByName: (name: string) => {
            for (const entity of ctx.editorEngine.scene.getEntities?.() || []) {
                if (entity.displayName === name) return entity.id; // Return ID so Lua can wrap it if needed.
            }
            return null;
        },
        getEntity: (id: string) => {
            // Check if it exists
            const entities = ctx.editorEngine.scene.getEntities?.();
            const exists = entities ? entities.some(e => e.id === id) : false;
            return exists ? id : null;
        },
        exists: (id: string) => {
            const entities = ctx.editorEngine.scene.getEntities?.();
            return entities ? entities.some(e => e.id === id) : false;
        }
    };

    // Merge into the global 'editor' table created by editor_init.lua
    engine.global.set('__jsEditorApi', editorApi);

    engine.doStringSync(`
        editor = editor or {}
        -- the JS bridge provides the actual query implementations
        editor.findEntityByName = __jsEditorApi.findEntityByName
        editor.getEntity = __jsEditorApi.getEntity
        editor.exists = __jsEditorApi.exists
    `);
}
