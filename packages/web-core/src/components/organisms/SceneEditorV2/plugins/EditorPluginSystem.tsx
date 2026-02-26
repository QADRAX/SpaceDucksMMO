import * as React from 'react';
import { LuaEngine } from 'wasmoon';
import { LuaSandbox } from '@duckengine/core';
import type { EditorPluginContext, IEditorPluginRegistry } from '@duckengine/core';
import type { EditorPlugin, EditorSlotFill } from './pluginTypes';

// ─── React to Lua Bridge ───────────────────────────────────────────────────

export type UIElementDescriptor = {
    type: 'button' | 'toggle' | 'label' | 'row' | 'column';
    props?: Record<string, any>;
    children?: UIElementDescriptor[];
};

export function LuaUIElement({ desc }: { desc: UIElementDescriptor }) {
    if (!desc) return null;

    const props = desc.props || {};

    if (desc.type === 'button') {
        const title = props.title;
        const text = props.text;
        return (
            <button
                type="button"
                title={title}
                onClick={() => props.onClick && props.onClick()}
                className="w-8 h-8 flex items-center justify-center bg-black/5 hover:bg-black/10 transition-colors border-2 border-transparent hover:border-black/20 focus:outline-none"
            >
                {text || 'btn'}
            </button>
        );
    }

    if (desc.type === 'toggle') {
        return (
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                <input
                    type="checkbox"
                    checked={!!props.checked}
                    onChange={(e) => props.onChange && props.onChange(e.target.checked)}
                    className="w-4 h-4 rounded-none border-2 border-black accent-main"
                />
                {props.label}
            </label>
        );
    }

    if (desc.type === 'label') {
        return <span className="text-xs font-medium text-black/80">{props.text}</span>;
    }

    if (desc.type === 'row') {
        return (
            <div className="flex items-center gap-2">
                {desc.children?.map((child, i) => (
                    <LuaUIElement key={i} desc={child} />
                ))}
            </div>
        );
    }

    if (desc.type === 'column') {
        return (
            <div className="flex flex-col gap-2">
                {desc.children?.map((child, i) => (
                    <LuaUIElement key={i} desc={child} />
                ))}
            </div>
        );
    }

    return null;
}

// ─── Editor Plugin System ──────────────────────────────────────────────────

export class EditorPluginSystem {
    private sandbox: LuaSandbox;
    private engine: LuaEngine | null = null;
    private loadedPlugins = new Map<string, EditorPlugin>();

    constructor(private registry: IEditorPluginRegistry) {
        this.sandbox = new LuaSandbox();
    }

    public async initialize() {
        this.engine = await this.sandbox.createEngine();

        // Add global helper functions for editor plugins
        this.engine!.doStringSync(`
            editor = {}
            editor.ui = {
                button = function(text, props)
                    local p = props or {}
                    p.text = text
                    return { type = "button", props = p }
                end,
                toggle = function(label, props)
                    local p = props or {}
                    p.label = label
                    return { type = "toggle", props = p }
                end,
                label = function(text)
                    return { type = "label", props = { text = text } }
                end,
                row = function(children)
                    return { type = "row", children = children }
                end,
                column = function(children)
                    return { type = "column", children = children }
                end
            }
        `);
    }

    public loadPluginFromSource(source: string): EditorPlugin {
        if (!this.engine) throw new Error("EditorPluginSystem not initialized");

        const rawModule = this.engine.doStringSync(source);
        if (typeof rawModule !== 'object' || !rawModule.meta) {
            throw new Error("Plugin script must return an EditorPluginModule table with meta");
        }

        const pluginId = rawModule.meta.id;

        const plugin: EditorPlugin = {
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

        // Extract slot fills
        if (rawModule.slotFills && Array.isArray(rawModule.slotFills)) {
            const reactSlotFills: EditorSlotFill[] = [];

            for (const fill of rawModule.slotFills) {
                if (!fill.slot || typeof fill.ui !== 'function') continue;

                reactSlotFills.push({
                    slot: fill.slot,
                    priority: fill.priority,
                    tabLabel: fill.tabLabel,
                    render: (ctx: EditorPluginContext) => {
                        try {
                            // Call Lua 'ui' function with context
                            const desc = fill.ui(ctx);
                            if (!desc) return null;

                            // If it's an array of descriptors, wrap in row
                            if (Array.isArray(desc)) {
                                return <LuaUIElement desc={{ type: 'row', children: desc }} />;
                            }
                            return <LuaUIElement desc={desc} />;
                        } catch (err) {
                            console.error(`Error rendering slot fill for ${pluginId}`, err);
                            return <span className="text-red-500 text-xs">Error</span>;
                        }
                    }
                });
            }
            plugin.slotFills = reactSlotFills;
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
                } catch (err) {
                    // avoid spamming tick errors
                }
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

    public tick(dt: number, ctx: EditorPluginContext) {
        for (const plugin of this.registry.plugins) {
            if (plugin.enabled && plugin.onTick) {
                plugin.onTick(dt, ctx);
            }
        }
    }

    public notifySelectionChanged(ids: string[], ctx: EditorPluginContext) {
        for (const plugin of this.registry.plugins) {
            if (plugin.enabled && plugin.onSelectionChanged) {
                plugin.onSelectionChanged(ids, ctx);
            }
        }
    }

    public notifyGameStateChanged(state: 'stopped' | 'playing' | 'paused', ctx: EditorPluginContext) {
        for (const plugin of this.registry.plugins) {
            if (plugin.enabled && plugin.onGameStateChanged) {
                plugin.onGameStateChanged(state, ctx);
            }
        }
    }

    public dispose() {
        if (this.engine) {
            this.engine.global.close();
            this.engine = null;
        }
        this.loadedPlugins.clear();
    }
}
