import { LuaEngine } from 'wasmoon';
import { LuaSandbox } from '@duckengine/core';
import { IEditorExtension, IEditorExtensionRegistry, EditorExtensionContext, UIElementDescriptor } from '../extension/IEditorExtension';
import { EditorSystemScripts } from './generated/EditorScriptAssets';
import { EditorBridgeContext } from './bridge/EditorBridgeContext';
import { registerEditorApiBridge } from './bridge/EditorApiBridge';
import { EditorSession } from '../session/EditorSession';


/**
 * Represents a UI slot fill from an editor extension.
 */
export type EditorSlotFill = {
    slot: string;
    tabLabel?: string;
    priority?: number;
    /** Returns the descriptor rather than React node */
    ui: (ctx: EditorExtensionContext) => UIElementDescriptor | UIElementDescriptor[] | null;
};

/**
 * Internal mapped extension, holds React-agnostic slots.
 */
export type EditorScriptExtension = IEditorExtension & {
    slotFills?: ReadonlyArray<EditorSlotFill>;
};

/**
 * The EditorScriptSystem manages the Lua sandbox and loads extensions from scripts.
 */
export class EditorScriptSystem {
    private sandbox: LuaSandbox;
    private engine: LuaEngine | null = null;
    private loadedExtensions = new Map<string, EditorScriptExtension>();

    constructor(
        private registry: IEditorExtensionRegistry,
        private editorSession: EditorSession
    ) {
        this.sandbox = new LuaSandbox();
    }

    /**
     * Initializes the Lua engine and sets up the JS bridge.
     */
    public async initialize() {
        this.engine = await this.sandbox.createEngine();

        const ctx: EditorBridgeContext = {
            editorSession: this.editorSession
        };

        // Register TypeScript Bridges (sets __jsEditorApi)
        registerEditorApiBridge(this.engine!, ctx);

        // Map core InputBridge (sets 'input' global)
        const { registerInputBridge } = require('@duckengine/core');
        registerInputBridge(this.engine!);

        // Load pre-compiled editor initialization (editor UI helpers, bridges, etc.)
        const editorInit = EditorSystemScripts['editor_init.lua'];
        if (!editorInit) {
            throw new Error("editor_init.lua not found in EditorSystemScripts. Ensure it is pre-compiled.");
        }

        this.engine!.doStringSync(editorInit);
    }

    /**
     * Loads a global extension from a Lua source string.
     */
    public loadExtensionFromSource(source: string): EditorScriptExtension {
        if (!this.engine) throw new Error("EditorScriptSystem not initialized");

        const rawModule = this.engine.doStringSync(source);
        if (typeof rawModule !== 'object' || !rawModule.meta) {
            throw new Error("Extension script must return an EditorExtensionModule table with meta");
        }

        const extensionId = rawModule.meta.id;

        const extension: EditorScriptExtension = {
            meta: {
                id: extensionId,
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
                    ui: (ctx: EditorExtensionContext) => {
                        try {
                            const luaCtx = this.engine!.global.get('__WrapExtensionContext')(ctx);
                            // Call Lua 'ui' function with context
                            return fill.ui(luaCtx);
                        } catch (err) {
                            console.error(`Error generating UI descriptor for slot fill in ${extensionId}`, err);
                            return null;
                        }
                    }
                });
            }
            extension.slotFills = agnosticsFills;
        }

        // Extract lifecycle hooks (keep references to Lua functions)
        const onEnable = rawModule.onEnable;
        if (typeof onEnable === 'function') {
            extension.onEnable = (ctx) => {
                try {
                    const luaCtx = this.engine!.global.get('__WrapExtensionContext')(ctx);
                    const cleanup = onEnable(luaCtx);
                    if (typeof cleanup === 'function') return cleanup;
                } catch (err) {
                    console.error(`Error enabling extension ${extensionId}`, err);
                }
            };
        }

        const onTick = rawModule.onTick;
        if (typeof onTick === 'function') {
            extension.onTick = (dt, ctx) => {
                try {
                    const luaCtx = this.engine!.global.get('__WrapExtensionContext')(ctx);
                    onTick(dt, luaCtx);
                } catch (err) { }
            };
        }

        const onSelChanged = rawModule.onSelectionChanged;
        if (typeof onSelChanged === 'function') {
            extension.onSelectionChanged = (ids, ctx) => {
                try {
                    const luaCtx = this.engine!.global.get('__WrapExtensionContext')(ctx);
                    onSelChanged(ids, luaCtx);
                } catch (e) { }
            };
        }

        const onStateChanged = rawModule.onGameStateChanged;
        if (typeof onStateChanged === 'function') {
            extension.onGameStateChanged = (state, ctx) => {
                try {
                    const luaCtx = this.engine!.global.get('__WrapExtensionContext')(ctx);
                    onStateChanged(state, luaCtx);
                } catch (e) { }
            };
        }

        const onCfgChanged = rawModule.onConfigChanged;
        if (typeof onCfgChanged === 'function') {
            extension.onConfigChanged = (key, val, ctx) => {
                try {
                    const luaCtx = this.engine!.global.get('__WrapExtensionContext')(ctx);
                    onCfgChanged(key, val, luaCtx);
                } catch (e) { }
            };
        }

        this.loadedExtensions.set(extensionId, extension);
        this.registry.register(extension);

        return extension;
    }

    /**
     * Executes a raw Lua string within the sandbox.
     */
    public executeString(source: string): any {
        if (!this.engine) throw new Error("EditorScriptSystem not initialized");
        return this.engine.doStringSync(source);
    }

    /**
     * Destroys the Lua engine.
     */
    public dispose() {
        if (this.engine) {
            this.engine.global.close();
            this.engine = null;
        }
        this.loadedExtensions.clear();
    }
}
