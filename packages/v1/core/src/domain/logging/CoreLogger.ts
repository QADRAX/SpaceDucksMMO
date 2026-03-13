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
        // Output to console is now strictly forbidden in core.
        // Subscribers (like the Web Core Editor UI) are responsible for showing these logs.

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
