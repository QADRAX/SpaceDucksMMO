import { LuaFactory, type LuaEngine } from 'wasmoon';
import { CoreLogger } from '../logging/CoreLogger';
import { SystemScripts } from './generated/ScriptAssets';
import type { SceneEventBus } from './SceneEventBus';

export type LuaHookFunction = (...args: any[]) => any;

/**
 * Manages a single Lua Engine instance and its global environment.
 * Handles bridge registration and safe hook execution.
 */
export class ScriptRuntime {
    private factory: LuaFactory | null = null;
    private engine: LuaEngine | null = null;

    constructor(
        private eventBus?: SceneEventBus,
        private systemName: string = 'Lua'
    ) { }

    public get lua(): LuaEngine {
        if (!this.engine) throw new Error("ScriptRuntime not initialized. Call setup() first.");
        return this.engine;
    }

    /**
     * Initializes the Lua environment and loads system scripts.
     */
    public async setup(systemOverrides: Record<string, string> = {}): Promise<void> {
        if (!this.factory) {
            const { LuaFactory } = await import('wasmoon');
            this.factory = new LuaFactory();
        }

        this.engine = await this.factory.createEngine();

        // Security & Constraints
        this.engine.global.setTimeout(Date.now() + 1000);

        // Core Globals
        this.engine.global.set('print', (...args: any[]) => {
            const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join('\t');
            this.log('info', msg);
        });

        const logApi = {
            info: (sys: string, msg: string, data?: any) => this.log('info', msg, sys, data),
            warn: (sys: string, msg: string, data?: any) => this.log('warn', msg, sys, data),
            error: (sys: string, msg: string, data?: any) => this.log('error', msg, sys, data),
            debug: (sys: string, msg: string, data?: any) => this.log('debug', msg, sys, data),
        };
        this.engine.global.set('log', logApi);

        // Load sandbox modules in dependency order (4 files, loaded sequentially).
        // Each module defines globals that subsequent modules depend on.
        //   1. sandbox_security  — clears dangerous globals, defines Script constants
        //   2. sandbox_metatables — all proxy metatables (__EntityMT, __SelfMT, etc.)
        //   3. sandbox_hydration  — __WrapValue, __WrapSelf (property hydration)
        //   4. sandbox_runtime    — __Contexts, __SlotHooks, __CallHook, etc.
        const sandboxModules = [
            'sandbox_security.lua',
            'sandbox_metatables.lua',
            'sandbox_hydration.lua',
            'sandbox_runtime.lua',
        ] as const;

        for (const moduleName of sandboxModules) {
            const source = systemOverrides[moduleName] || SystemScripts[moduleName];
            if (!source) {
                throw new Error(`${moduleName} not found in SystemScripts.`);
            }
            this.engine.doStringSync(source);
        }
    }

    /**
     * Safely executes a Lua function with pcall and standardized logging.
     */
    public execute(fn: LuaHookFunction | undefined, ...args: any[]): boolean {
        if (!fn || !this.engine) return true;

        // Safety timeout for the execution slice
        this.engine.global.setTimeout(Date.now() + 200);

        try {
            fn(...args);
            return true;
        } catch (err) {
            this.log('error', `Execution error: ${err}`);
            return false;
        }
    }

    /**
     * Executes a named hook for a slot via __CallHook (Lua-side).
     * Contexts and hooks are kept entirely in Lua to preserve metatables
     * that wasmoon destroys when serialising Lua tables to JS.
     */
    public callHook(slotId: string, hookName: string, ...args: any[]): boolean {
        if (!this.engine) return true;
        this.engine.global.setTimeout(Date.now() + 200);
        try {
            const callHookFn = (this.engine.global as any).get("__CallHook");
            if (!callHookFn) return true;
            callHookFn(slotId, hookName, ...args);
            return true;
        } catch (err) {
            this.log('error', `Execution error: ${err}`);
            return false;
        }
    }

    /**
     * Registers a bridge API into the global environment.
     */
    public registerBridge(name: string, api: Record<string, any>): void {
        if (!this.engine) return;
        this.engine.global.set(name, api);
        CoreLogger.debug("ScriptRuntime", `Bridge Registered: ${name}`);
    }

    private log(severity: 'info' | 'warn' | 'error' | 'debug', message: string, system?: string, data?: any) {
        const sys = system || this.systemName;
        CoreLogger[severity](sys, message, data);
        if (this.eventBus) {
            this.eventBus.fire('engine:log', { severity, system: sys, message, data, timestamp: Date.now() });
        }
    }

    public teardown() {
        // Wasmoon engines don't have an explicit close/dispose in the current version's types
        // but it's good practice to clear the reference.
        this.engine = null;
    }
}
