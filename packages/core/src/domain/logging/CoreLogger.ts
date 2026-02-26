export type LogSeverity = 'info' | 'warn' | 'error' | 'debug';

export interface LogMessage {
    severity: LogSeverity;
    system: string;
    message: string;
    data?: any;
    timestamp: number;
}

export type LogListener = (msg: LogMessage) => void;

class CoreLoggerService {
    private listeners = new Set<LogListener>();

    public subscribe(listener: LogListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private emit(severity: LogSeverity, system: string, message: string, data?: any) {
        // We still output to console by default for non-editor contexts
        // but subscribers can disable it or we can add a config flag.
        // For now, always output so headless tests show them, just format nicely.

        switch (severity) {
            case 'info': console.log(`[${system}] ${message}`, data ? data : ''); break;
            case 'warn': console.warn(`[${system}] ${message}`, data ? data : ''); break;
            case 'error': console.error(`[${system}] ${message}`, data ? data : ''); break;
            case 'debug': console.debug(`[${system}] ${message}`, data ? data : ''); break;
        }

        const msg: LogMessage = { severity, system, message, data, timestamp: Date.now() };
        this.listeners.forEach((l) => l(msg));
    }

    public info(system: string, message: string, data?: any) {
        this.emit('info', system, message, data);
    }

    public warn(system: string, message: string, data?: any) {
        this.emit('warn', system, message, data);
    }

    public error(system: string, message: string, data?: any) {
        this.emit('error', system, message, data);
    }

    public debug(system: string, message: string, data?: any) {
        this.emit('debug', system, message, data);
    }
}

export const CoreLogger = new CoreLoggerService();
