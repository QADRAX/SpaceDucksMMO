import type { LuaFactory, LuaEngine } from 'wasmoon';
import { CoreLogger } from '../logging/CoreLogger';
import { SystemScripts } from './generated/ScriptAssets';
import type { SceneEventBus } from './SceneEventBus';

export type LuaHookFunction = (...args: any[]) => any;

export interface LuaScriptInstance {
    init?: LuaHookFunction;
    onEnable?: LuaHookFunction;
    earlyUpdate?: LuaHookFunction;
    update?: LuaHookFunction;
    lateUpdate?: LuaHookFunction;
    onCollisionEnter?: LuaHookFunction;
    onCollisionExit?: LuaHookFunction;
    onDisable?: LuaHookFunction;
    onDestroy?: LuaHookFunction;
    onDrawGizmos?: LuaHookFunction;
    onPropertyChanged?: (key: string, value: any) => void;
}

export class LuaSandbox {
    private factory: LuaFactory | null = null;

    // Configurable logger system name for the sandbox
    public systemName: string = 'Lua';

    constructor(private eventBus?: SceneEventBus) { }

    public async createEngine(systemOverrides: Record<string, string> = {}): Promise<LuaEngine> {
        if (!this.factory) {
            const { LuaFactory } = await import('wasmoon');
            this.factory = new LuaFactory();
        }
        const engine = await this.factory!.createEngine();

        // engine.global.setMemoryMax(1024 * 1024 * 10); // Requires traceAllocations in factory init, which is broken in types
        engine.global.setTimeout(Date.now() + 1000);

        // Map print to CoreLogger and optionally EventBus
        engine.global.set('print', (...args: any[]) => {
            const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join('\t');
            this.internalLog('info', msg);
        });

        // Setup LogAPI global
        const logApi = {
            info: (system: string, msg: string, data?: any) => this.internalLog('info', msg, system, data),
            warn: (system: string, msg: string, data?: any) => this.internalLog('warn', msg, system, data),
            error: (system: string, msg: string, data?: any) => this.internalLog('error', msg, system, data),
            debug: (system: string, msg: string, data?: any) => this.internalLog('debug', msg, system, data),
        };
        engine.global.set('log', logApi);

        // Load sandbox modules in dependency order (4 files).
        const sandboxModules = [
            'sandbox_security.lua',
            'sandbox_metatables.lua',
            'sandbox_hydration.lua',
            'sandbox_runtime.lua',
        ] as const;

        for (const moduleName of sandboxModules) {
            const source = systemOverrides[moduleName] || SystemScripts[moduleName];
            if (!source) {
                throw new Error(`${moduleName} not found. Ensure it is pre-compiled or provided as override.`);
            }
            engine.doStringSync(source);
        }

        return engine;
    }

    private internalLog(severity: 'info' | 'warn' | 'error' | 'debug', message: string, system?: string, data?: any) {
        const sys = system || this.systemName;

        // 1. CoreLogger (primary sink)
        CoreLogger[severity](sys, message, data);

        // 2. EventBus (for in-game or editor UI subscribers)
        if (this.eventBus) {
            this.eventBus.fire('engine:log', { severity, system: sys, message, data, timestamp: Date.now() });
        }
    }

    public compile(engine: LuaEngine, source: string): LuaScriptInstance {
        engine.global.setTimeout(Date.now() + 1000);
        const result = engine.doStringSync(source);

        if (typeof result !== 'object' || result === null) {
            throw new Error("Lua script must return a table containing lifecycle hooks");
        }

        const instance: LuaScriptInstance & { schema?: any } = {};
        if (result.schema) {
            instance.schema = result.schema;
        }

        const hooks = [

            'init', 'onEnable', 'earlyUpdate', 'update', 'lateUpdate',
            'onCollisionEnter', 'onCollisionExit', 'onDisable', 'onDestroy',
            'onPropertyChanged'
        ] as const;

        for (const hook of hooks) {
            if (typeof result[hook] === 'function') {
                instance[hook] = result[hook];
            }
        }

        return instance;
    }

    public pcall(engine: LuaEngine, hookFn: LuaHookFunction | undefined, ...args: any[]): boolean {
        if (!hookFn) return true;
        engine.global.setTimeout(Date.now() + 100);

        try {
            hookFn(...args);
            return true;
        } catch (err) {
            this.internalLog('error', `Error during hook execution: ${err}`);
            return false;
        }
    }
}

