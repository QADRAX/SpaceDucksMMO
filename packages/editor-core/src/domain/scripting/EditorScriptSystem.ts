import { LuaEngine } from 'wasmoon';
import { LuaSandbox } from '@duckengine/core';
import { IEditorPlugin, IEditorPluginRegistry, EditorPluginContext } from '../plugin/IEditorPlugin';
import { EditorSystemScripts } from './generated/EditorScriptAssets';
import { EditorBridgeContext } from './bridge/EditorBridgeContext';
import { registerEditorApiBridge } from './bridge/EditorApiBridge';
import { EditorEngine } from '../state/EditorEngine';

// ─── UI Element Descriptor ─────────────────────────────────────────────────
export type UIElementDescriptor = {
    type: 'button' | 'toggle' | 'label' | 'row' | 'column';
    props?: Record<string, any>;
    children?: UIElementDescriptor[];
};

export type EditorSlotFill = {
    slot: string;
    tabLabel?: string;
    priority?: number;
    // Returns the descriptor rather than React node
    ui: (ctx: EditorPluginContext) => UIElementDescriptor | UIElementDescriptor[] | null;
};

// Internal mapped plugin, holds React-agnostic slots
export type EditorScriptPlugin = IEditorPlugin & {
    slotFills?: ReadonlyArray<EditorSlotFill>;
};

// ─── Editor Script System ──────────────────────────────────────────────────
export class EditorScriptSystem {
    private sandbox: LuaSandbox;
    private engine: LuaEngine | null = null;
    private loadedPlugins = new Map<string, EditorScriptPlugin>();

    constructor(
        private registry: IEditorPluginRegistry,
        private editorEngine: EditorEngine
    ) {
        this.sandbox = new LuaSandbox();
    }

    public async initialize() {
        this.engine = await this.sandbox.createEngine();

        const ctx: EditorBridgeContext = {
            editorEngine: this.editorEngine
        };

        // Load pre-compiled editor initialization (editor UI helpers, bridges, etc.)
        const editorInit = EditorSystemScripts['editor_init.lua'];
        if (!editorInit) {
            throw new Error("editor_init.lua not found in EditorSystemScripts. Ensure it is pre-compiled.");
        }

        this.engine!.doStringSync(editorInit);

        // Register TypeScript Bridges
        registerEditorApiBridge(this.engine!, ctx);
    }

    public loadPluginFromSource(source: string): EditorScriptPlugin {
        if (!this.engine) throw new Error("EditorScriptSystem not initialized");

        const rawModule = this.engine.doStringSync(source);
        if (typeof rawModule !== 'object' || !rawModule.meta) {
            throw new Error("Plugin script must return an EditorPluginModule table with meta");
        }

        const pluginId = rawModule.meta.id;

        const plugin: EditorScriptPlugin = {
            meta: {
                id: pluginId,
                displayName: rawModule.meta.displayName,
                description: rawModule.meta.description,
                icon: rawModule.meta.icon,
                category: rawModule.meta.category,
                source: rawModule.meta.source || { kind: 'builtin' },
                configFields: rawModule.meta.configFields || []
            },
            enabled: false,
            config: {},
        };

        // Extract slot fills into agnostic descriptors
        if (rawModule.slotFills && Array.isArray(rawModule.slotFills)) {
            const agnosticsFills: EditorSlotFill[] = [];

            for (const fill of rawModule.slotFills) {
                if (!fill.slot || typeof fill.ui !== 'function') continue;

                agnosticsFills.push({
                    slot: fill.slot,
                    priority: fill.priority,
                    tabLabel: fill.tabLabel,
                    ui: (ctx: EditorPluginContext) => {
                        try {
                            // Call Lua 'ui' function with context
                            return fill.ui(ctx);
                        } catch (err) {
                            console.error(`Error generating UI descriptor for slot fill in ${pluginId}`, err);
                            return null;
                        }
                    }
                });
            }
            plugin.slotFills = agnosticsFills;
        }

        // Extract lifecycle hooks (keep references to Lua functions)
        const onEnable = rawModule.onEnable;
        if (typeof onEnable === 'function') {
            plugin.onEnable = (ctx) => {
                try {
                    const cleanup = onEnable(ctx);
                    if (typeof cleanup === 'function') return cleanup;
                } catch (err) {
                    console.error(`Error enabling plugin ${pluginId}`, err);
                }
            };
        }

        const onTick = rawModule.onTick;
        if (typeof onTick === 'function') {
            plugin.onTick = (dt, ctx) => {
                try {
                    onTick(dt, ctx);
                } catch (err) { }
            };
        }

        const onSelChanged = rawModule.onSelectionChanged;
        if (typeof onSelChanged === 'function') {
            plugin.onSelectionChanged = (ids, ctx) => {
                try { onSelChanged(ids, ctx); } catch (e) { }
            };
        }

        const onStateChanged = rawModule.onGameStateChanged;
        if (typeof onStateChanged === 'function') {
            plugin.onGameStateChanged = (state, ctx) => {
                try { onStateChanged(state, ctx); } catch (e) { }
            };
        }

        const onCfgChanged = rawModule.onConfigChanged;
        if (typeof onCfgChanged === 'function') {
            plugin.onConfigChanged = (key, val, ctx) => {
                try { onCfgChanged(key, val, ctx); } catch (e) { }
            };
        }

        this.loadedPlugins.set(pluginId, plugin);
        this.registry.register(plugin);

        return plugin;
    }

    public dispose() {
        if (this.engine) {
            this.engine.global.close();
            this.engine = null;
        }
        this.loadedPlugins.clear();
    }
}
