import { ResourceUploadHandler } from './types';

export class ResourceUploadRegistry {
    private static handlers = new Map<string, ResourceUploadHandler>();
    private static fallbackHandler: ResourceUploadHandler | null = null;

    static register(kind: string | string[], handler: ResourceUploadHandler): void {
        const kinds = Array.isArray(kind) ? kind : [kind];
        for (const k of kinds) {
            this.handlers.set(k, handler);
        }
    }

    static setFallbackHandler(handler: ResourceUploadHandler): void {
        this.fallbackHandler = handler;
    }

    static getHandler(kind: string): ResourceUploadHandler {
        const handler = this.handlers.get(kind);
        if (handler) return handler;
        if (this.fallbackHandler) return this.fallbackHandler;
        throw new Error(`Unsupported resource kind: ${kind} and no fallback handler registered.`);
    }
}
