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
        },
        getEntityProperty: (id: string, key: string) => {
            const ent = ctx.editorEngine.scene.getEntity(id);
            if (!ent) return null;
            if (key === 'displayName') return ent.displayName;
            if (key === 'id') return ent.id;
            return null;
        },
        setEntityProperty: (id: string, key: string, value: any) => {
            const ent = ctx.editorEngine.scene.getEntity(id);
            if (!ent) return;
            if (key === 'displayName') ent.displayName = value;
        },
        // --- Viewports API ---
        viewports: {
            getActiveId: () => {
                return ctx.editorEngine.activeViewport?.id || null;
            },
            spawnEditorEntity: (baseName: string) => {
                const viewport = ctx.editorEngine.activeViewport;
                if (!viewport) return null;
                const entity = viewport.spawnEditorEntity(baseName);
                return entity.id;
            }
        }
    };

    // Merge into the global 'editor' table created by editor_init.lua
    engine.global.set('__jsEditorApi', editorApi);
}
