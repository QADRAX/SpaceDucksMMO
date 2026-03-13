import { definePort } from '../../subsystems/definePort';
import type { DiagnosticPort } from './diagnosticPort';

/**
 * Definition for the DiagnosticPort.
 * Allows subsystems to emit logs without coupling to console.
 */
export const DiagnosticPortDef = definePort<DiagnosticPort>('io:diagnostic')
  .addMethod('log')
  .build();
