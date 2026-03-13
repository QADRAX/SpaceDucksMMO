import { EditorSession, TransformData } from '../../session/EditorSession';
import { EditorExtensionContext } from '../../extension/IEditorExtension';
import { LuaEngine } from 'wasmoon';

/**
 * EditorApiBridge.ts — Maps the TypeScript EditorSession / Viewport API to Lua.
 */
export const createEditorApiBridge = (ctx: { editorSession: EditorSession }) => {
    return {
        // --- Global Session API ---
        gameState: () => ctx.editorSession.gameState,
        selectedEntityId: () => ctx.editorSession.selectedEntityId,
        setSelectedEntity: (id: string | null) => ctx.editorSession.setSelectedEntity(id, ctx as any),

        // --- Entity Queries ---
        getEntity: (id: string) => {
            const e = ctx.editorSession.getEntity(id);
            return e ? { id: e.id } : null;
        },
        findEntityByName: (name: string) => {
            const e = ctx.editorSession.findEntityByName(name);
            return e ? { id: e.id } : null;
        },

        // --- Granular Entity Access ---
        getTransform: (id: string) => ctx.editorSession.getTransform(id),
        setTransform: (id: string, transform: Partial<TransformData>) => ctx.editorSession.setTransform(id, transform),
        getComponentData: (id: string, type: string) => ctx.editorSession.getComponentData(id, type),
        hasComponent: (id: string, type: string) => ctx.editorSession.hasComponent(id, type),
        getEntityProperty: (id: string, key: string) => ctx.editorSession.getEntityProperty(id, key),
        setEntityProperty: (id: string, key: string, value: unknown) => ctx.editorSession.setEntityProperty(id, key, value),

        // --- Entity Operations ---
        createEntity: (parentId?: string) => ctx.editorSession.createEntity(parentId).id,
        deleteEntity: (id: string) => ctx.editorSession.deleteEntity(id),
        duplicateSelectedEntity: () => {
            const e = ctx.editorSession.duplicateSelectedEntity();
            return e ? { id: e.id } : null;
        },
        reparentEntity: (childId: string, parentId: string | null) => ctx.editorSession.reparentEntity(childId, parentId),

        // --- Viewports API ---
        viewports: {
            getActiveId: () => {
                return ctx.editorSession.activeViewport?.id || null;
            },
            get: (id: string) => {
                const vp = ctx.editorSession.getViewport(id);
                if (!vp) return null;
                return { id: vp.id };
            },
            getAll: () => {
                return ctx.editorSession.getAllViewports().map(vp => ({ id: vp.id }));
            },
            spawnEditorEntity: (viewportId: string, baseName: string) => {
                const viewport = ctx.editorSession.getViewport(viewportId);
                if (!viewport) return null;
                const entity = viewport.spawnEditorEntity(baseName);
                return entity.id;
            },
            getViewportProperty: (viewportId: string, key: string) => {
                return ctx.editorSession.getViewportProperty(viewportId, key);
            },
            setViewportProperty: (viewportId: string, key: string, value: unknown) => {
                ctx.editorSession.setViewportProperty(viewportId, key, value);
            },
            setProperty: (viewportId: string, key: string, value: unknown) => {
                const viewport = ctx.editorSession.getViewport(viewportId);
                viewport?.setProperty(key, value);
            },
            registerManagedEntity: (viewportId: string, key: string, entityId: string) => {
                const viewport = ctx.editorSession.getViewport(viewportId);
                viewport?.registerManagedEntity(key, entityId);
            },
            getManagedEntity: (viewportId: string, key: string) => {
                const viewport = ctx.editorSession.getViewport(viewportId);
                return viewport?.getManagedEntity(key) || null;
            }
        }
    };
};

export function registerEditorApiBridge(engine: LuaEngine, ctx: { editorSession: EditorSession }) {
    const editorApi = createEditorApiBridge(ctx);
    // Merge into the global 'editor' table created by editor_init.lua
    engine.global.set('__jsEditorApi', editorApi);
}
