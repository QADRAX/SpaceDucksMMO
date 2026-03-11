import { definePortImplementation, definePortUseCase } from '../../domain/useCases';
import { DiagnosticPortDef } from '../../domain/ports';
import type { DiagnosticPort, DiagnosticLevel } from '../../domain/ports';

/** No internal state; console output is side-effect only. */
type ConsoleDiagnosticState = Record<string, never>;

const consoleLogUseCase = definePortUseCase<ConsoleDiagnosticState, DiagnosticPort, 'log'>({
  name: 'consoleLog',
  execute(_state, [level, message, context]) {
    const prefix = context && Object.keys(context).length > 0
      ? `[${JSON.stringify(context)}] `
      : '';
    const fullMessage = `${prefix}${message}`;

    switch (level as DiagnosticLevel) {
      case 'debug':
        console.debug(fullMessage);
        break;
      case 'info':
        console.info(fullMessage);
        break;
      case 'warn':
        console.warn(fullMessage);
        break;
      case 'error':
        console.error(fullMessage);
        break;
    }
  },
});

/**
 * A strictly-typed PortBinding that forwards diagnostic logs to console.*.
 * Ready to be directly injected into setupEngine `ports.diagnostic`.
 */
export const consoleDiagnosticPort = definePortImplementation<ConsoleDiagnosticState, DiagnosticPort>(DiagnosticPortDef)
  .withState(() => ({} as ConsoleDiagnosticState))
  .withMethod('log', consoleLogUseCase)
  .build();
