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
            if (key === 'position') {
                ent.transform.setPosition(value[0], value[1], value[2]);
            }
            if (key === 'rotation') {
                ent.transform.setRotation(value[0], value[1], value[2]);
            }
        },
        callEntityMethod: (id: string, method: string, args: any[]) => {
            const ent = ctx.editorEngine.scene.getEntity(id);
            if (!ent) return;
            if (method === 'lookAt') {
                ent.transform.lookAt({ x: args[0], y: args[1], z: args[2] });
            }
            if (method === 'addComponent') {
                const type = args[0];
                const params = args[1];
                try {
                    // Use core factory to create components (handles both C++-like and Script components)
                    const component = ctx.editorEngine.componentFactory.create(type, params);
                    ent.addComponent(component);
                } catch (err) {
                    console.error(`Error adding component ${type} to entity ${id}:`, err);
                }
            }
        },
        getSelectedEntityId: () => {
            return ctx.editorEngine.selectedEntityId;
        },
        getGameState: () => {
            return ctx.editorEngine.gameState;
        },
        // --- Viewports API ---
        viewports: {
            getActiveId: () => {
                return ctx.editorEngine.activeViewport?.id || null;
            },
            get: (id: string) => {
                const vp = ctx.editorEngine.getViewport(id);
                if (!vp) return null;
                return { id: vp.id, type: vp.type };
            },
            getAll: () => {
                return ctx.editorEngine.getAllViewports().map(vp => ({ id: vp.id, type: vp.type }));
            },
            spawnEditorEntity: (viewportId: string, baseName: string) => {
                const viewport = ctx.editorEngine.getViewport(viewportId);
                if (!viewport) return null;
                const entity = viewport.spawnEditorEntity(baseName);
                return entity.id;
            },
            setScript: (viewportId: string, schema: any) => {
                const viewport = ctx.editorEngine.getViewport(viewportId);
                if (!viewport) return;

                viewport.setScript({
                    onEnable: (vctx) => {
                        const invoke = engine.global.get('__InvokeViewportScript');
                        if (typeof invoke === 'function') invoke(viewportId, 'onEnable', vctx);
                    },
                    onTick: (dt, vctx) => {
                        const invoke = engine.global.get('__InvokeViewportScript');
                        if (typeof invoke === 'function') invoke(viewportId, 'update', vctx, dt);
                    },
                    onDestroy: (vctx) => {
                        const invoke = engine.global.get('__InvokeViewportScript');
                        if (typeof invoke === 'function') invoke(viewportId, 'onDestroy', vctx);
                    },
                    onPropertyChanged: (props, prevProps, vctx) => {
                        const invoke = engine.global.get('__InvokeViewportScript');
                        if (typeof invoke === 'function') invoke(viewportId, 'onPropertyChanged', vctx, props, prevProps);
                    }
                });
            },
            registerPlugin: (viewportId: string, pluginId: string, schema: any) => {
                const viewport = ctx.editorEngine.getViewport(viewportId);
                if (!viewport) return;

                viewport.registerPlugin({
                    id: pluginId,
                    onEnable: (vctx) => {
                        const invoke = engine.global.get('__InvokeViewportPlugin');
                        return typeof invoke === 'function' ? invoke(viewportId, pluginId, 'onEnable', vctx) : null;
                    },
                    onTick: (dt, vctx) => {
                        const invoke = engine.global.get('__InvokeViewportPlugin');
                        if (typeof invoke === 'function') invoke(viewportId, pluginId, 'update', vctx, dt);
                    },
                    getUI: (vctx) => {
                        const invoke = engine.global.get('__InvokeViewportPlugin');
                        return typeof invoke === 'function' ? invoke(viewportId, pluginId, 'getUI', vctx) : null;
                    },
                    onPointerDown: (ev, vctx) => {
                        const invoke = engine.global.get('__InvokeViewportPlugin');
                        return typeof invoke === 'function' ? invoke(viewportId, pluginId, 'onPointerDown', vctx, ev) : null;
                    },
                    onPointerMove: (ev, vctx) => {
                        const invoke = engine.global.get('__InvokeViewportPlugin');
                        if (typeof invoke === 'function') invoke(viewportId, pluginId, 'onPointerMove', vctx, ev);
                    },
                    onPointerUp: (ev, vctx) => {
                        const invoke = engine.global.get('__InvokeViewportPlugin');
                        if (typeof invoke === 'function') invoke(viewportId, pluginId, 'onPointerUp', vctx, ev);
                    },
                    onPropertyChanged: (props, prevProps, vctx) => {
                        const invoke = engine.global.get('__InvokeViewportPlugin');
                        if (typeof invoke === 'function') invoke(viewportId, pluginId, 'onPropertyChanged', vctx, props, prevProps);
                    }
                });
            },
            setConfig: (viewportId: string, pluginId: string, key: string, value: any) => {
                ctx.editorEngine.setConfig(pluginId, key, value);
            },
            setProperty: (viewportId: string, key: string, value: any) => {
                const viewport = ctx.editorEngine.getViewport(viewportId);
                viewport?.setProperty(key, value);
            },
            registerManagedEntity: (viewportId: string, key: string, entityId: string) => {
                const viewport = ctx.editorEngine.getViewport(viewportId);
                viewport?.registerManagedEntity(key, entityId);
            },
            getManagedEntity: (viewportId: string, key: string) => {
                const viewport = ctx.editorEngine.getViewport(viewportId);
                return viewport?.getManagedEntity(key) || null;
            }
        }
    };

    // Merge into the global 'editor' table created by editor_init.lua
    engine.global.set('__jsEditorApi', editorApi);
}
