import { defineEngineUseCase } from '../../domain/useCases';
import { guardEngineSetupComplete } from '../../domain/engine/engineGuards';
import { FRAME_PHASES, type FramePhase, type SceneSubsystem, type EngineSubsystem } from '../../domain/subsystems';
import { PerformanceProfilingPortDef } from '../../domain/ports';
import type { SceneState } from '../../domain/scene';
import type { EngineState } from '../../domain/engine';

/** Parameters for the updateEngine use case. */
export interface UpdateEngineParams {
  readonly dt: number;
}

type ScenePhase = Exclude<FramePhase, 'render'>;

function getScenePhaseFn(subsystem: SceneSubsystem, phase: ScenePhase): ((scene: SceneState, dt: number) => void) | undefined {
  const fn = subsystem[phase];
  return typeof fn === 'function' ? fn : undefined;
}

function getEnginePhaseFn(subsystem: EngineSubsystem, phase: FramePhase): ((engine: EngineState, dt: number) => void) | undefined {
  const fn = subsystem[phase];
  return typeof fn === 'function' ? fn : undefined;
}

function now(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

/**
 * Advances the entire engine by one frame.
 *
 * Iterates frame phases in fixed order: earlyUpdate, physics, update,
 * lateUpdate, preRender, render, postRender. For each phase:
 * 1. Calls scene subsystems (all phases except render).
 * 2. Calls engine subsystems (all phases including render).
 *
 * Respects engine-level and scene-level pause flags.
 *
 * When PerformanceProfilingPort is registered, records phase timings
 * and frame totals via the port.
 */
export const updateEngine = defineEngineUseCase<UpdateEngineParams, void>({
  name: 'updateEngine',
  guards: [guardEngineSetupComplete],
  execute(engine, { dt }) {
    const enginePaused = engine.paused;
    const perfPort = engine.subsystemRuntime.ports.get(PerformanceProfilingPortDef.id) as
      | { recordPhase: (p: FramePhase, ms: number) => void; recordFrameEnd: (ms: number) => void }
      | undefined;

    const frameStart = perfPort ? now() : 0;

    for (const phase of FRAME_PHASES) {
      const phaseStart = perfPort ? now() : 0;

      // preRender: run engine subsystems first so rendering sync creates per-scene state
      // before scene subsystems (e.g. scripting onDrawGizmos) need it.
      const engineFirst = phase === 'preRender';

      if (engineFirst) {
        for (const subsystem of engine.engineSubsystems) {
          if (enginePaused && !subsystem.updateWhenPaused) continue;
          const fn = getEnginePhaseFn(subsystem, phase);
          if (fn) fn(engine, dt);
        }
      }

      // Scene subsystems (no render phase)
      if (phase !== 'render') {
        for (const scene of engine.scenes.values()) {
          const scenePaused = enginePaused || scene.paused;
          for (const subsystem of scene.subsystems) {
            if (scenePaused && !subsystem.updateWhenPaused) continue;
            const fn = getScenePhaseFn(subsystem, phase as ScenePhase);
            if (fn) fn(scene, dt);
          }
        }
      }

      if (!engineFirst) {
        // Engine subsystems (or render phase only)
        for (const subsystem of engine.engineSubsystems) {
          if (enginePaused && !subsystem.updateWhenPaused) continue;
          const fn = getEnginePhaseFn(subsystem, phase);
          if (fn) fn(engine, dt);
        }
      }

      if (perfPort) {
        perfPort.recordPhase(phase, now() - phaseStart);
      }
    }

    if (perfPort) {
      perfPort.recordFrameEnd(now() - frameStart);
    }
  },
});
