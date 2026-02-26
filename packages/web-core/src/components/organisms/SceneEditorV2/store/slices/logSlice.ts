import type { StateCreator } from 'zustand';
import { CoreLogger, type LogMessage } from '@duckengine/core';
import type { EditorLogSlice, SceneEditorState, EditorLogEntry } from '../types';

export const createLogSlice: StateCreator<
    SceneEditorState,
    [],
    [],
    EditorLogSlice
> = (set, get) => {

    const addLog = (severity: 'info' | 'warn' | 'error', system: string, message: string, data?: any) => {
        set((state) => {
            const entry: EditorLogEntry = {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                severity,
                system,
                message,
                data
            };
            const nextLogs = [...state.logs, entry];
            if (nextLogs.length > state.maxLogs) {
                nextLogs.shift();
            }
            return { logs: nextLogs };
        });
    };

    // Auto-subscribe to CoreLogger to catch engine & lua logs
    CoreLogger.subscribe((msg: LogMessage) => {
        // We map 'debug' to 'info' as our slice only expects info/warn/error
        const severity = msg.severity === 'debug' ? 'info' : msg.severity;
        addLog(severity, msg.system, msg.message, msg.data);
    });

    return {
        logs: [],
        maxLogs: 1000,

        logInfo: (system, message, data) => addLog('info', system, message, data),
        logWarn: (system, message, data) => addLog('warn', system, message, data),
        logError: (system, message, data) => addLog('error', system, message, data),

        clearLogs: () => set({ logs: [] }),
    };
};
