import type {
  DiagnosticLevel,
  DiagnosticPort,
  SceneState,
  ScriptSchema,
} from '@duckengine/core-v2';
import type { BridgeDeclaration, BridgePorts, BridgeSession } from './types';

/** Session slice used by the Log bridge (avoids importing session types into bridges). */
type SessionWithDiagnostic = {
  readonly diagnostic?: DiagnosticPort;
};

/**
 * Log bridge — scripts write to the engine {@link DiagnosticPort} (same stack as harness `getLogs`).
 * Access via `self.Log.info('…')` / `debug` / `warn` / `error`.
 */
export const logBridge: BridgeDeclaration = {
  name: 'Log',
  perEntity: false,
  factory(
    _scene: SceneState,
    entityId,
    _schema: ScriptSchema | null,
    _ports: BridgePorts,
    session?: BridgeSession,
  ) {
    const diagnostic = (session as SessionWithDiagnostic | undefined)?.diagnostic;

    const write = (level: DiagnosticLevel, message: string): void => {
      diagnostic?.log(level, String(message), {
        entityId,
        source: 'lua',
      });
    };

    return {
      debug(message: string): void {
        write('debug', message);
      },
      info(message: string): void {
        write('info', message);
      },
      warn(message: string): void {
        write('warn', message);
      },
      error(message: string): void {
        write('error', message);
      },
    };
  },
};
