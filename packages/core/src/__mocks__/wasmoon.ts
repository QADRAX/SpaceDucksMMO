export class LuaFactory {
    async createEngine() {
        return {
            global: {
                setMemoryMax: jest.fn(),
                setTimeout: jest.fn(),
                address: 12345,
                set: jest.fn(),
                get: jest.fn().mockReturnValue(undefined),
            },
            doStringSync: jest.fn().mockImplementation((source: string) => {
                // If it's the sandbox initialization string, return nothing
                if (source.includes("os = nil")) {
                    return undefined;
                }

                // Otherwise it's the script compilation, return mock hooks
                return {
                    init: jest.fn(),
                    onEnable: jest.fn(),
                    update: jest.fn(),
                    lateUpdate: jest.fn(),
                    earlyUpdate: jest.fn(),
                    onCollisionEnter: jest.fn(),
                    onCollisionExit: jest.fn(),
                    onDisable: jest.fn(),
                    onDestroy: jest.fn(),
                };
            })
        };
    }
}

export type LuaEngine = any;
