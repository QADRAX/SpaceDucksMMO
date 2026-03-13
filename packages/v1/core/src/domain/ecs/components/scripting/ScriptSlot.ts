export interface ScriptSlot {
    slotId: string;
    scriptId: string;
    enabled: boolean;
    properties: Record<string, unknown>;
    executionOrder: number;
}

export function createScriptSlot(scriptId: string, properties: Record<string, unknown> = {}, executionOrder: number = 0): ScriptSlot {
    return {
        slotId: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
        scriptId,
        enabled: true,
        properties,
        executionOrder
    };
}
