import { definePort } from '../../subsystems/definePort';
import type { PerformanceProfilingPort } from './performanceProfilingPort';

/**
 * Definition for the PerformanceProfilingPort.
 * Optional; when registered, updateEngine records phase timings per frame.
 */
export const PerformanceProfilingPortDef = definePort<PerformanceProfilingPort>('io:performanceProfiling')
  .addMethod('recordPhase')
  .addMethod('recordFrameEnd')
  .build();
