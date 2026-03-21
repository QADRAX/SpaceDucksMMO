import type { EngineState } from '../engine';
import type { SubsystemUseCase } from '../useCases';
import type {
  EngineSubsystem,
  EngineSubsystemConfig,
  EngineSubsystemUpdateParams,
  SubsystemEngineEventParams,
  EngineSubsystemSceneEventParams,
  EngineSubsystemSceneAddedParams,
} from './types';
import type { EngineChangeEvent } from '../engine/engineEvents';
import type { SceneChangeEventWithError, SceneState } from '../scene';
import { createSubsystemPortRegistry } from './runtime';

type PhaseUseCase = SubsystemUseCase<unknown, EngineSubsystemUpdateParams, void>;

function makeEnginePhaseCallback<TState>(
  useCase: PhaseUseCase | undefined,
  stateRef: { current: TState | undefined },
  stateFactory: (ctx: { engine: EngineState }) => TState,
): ((engine: EngineState, dt: number) => void) | undefined {
  if (!useCase) return undefined;
  return (engine: EngineState, dt: number) => {
    if (!stateRef.current) stateRef.current = stateFactory({ engine });
    const ports = createSubsystemPortRegistry(
      engine.subsystemRuntime.ports,
      engine.subsystemRuntime.portDefinitions,
    );
    (useCase as PhaseUseCase).execute(stateRef.current, { engine, dt, ports });
  };
}

/**
 * Creates an EngineSubsystem from a flat config.
 *
 * Composes state and typed use cases without fluent builder nesting.
 * Use this instead of defineEngineSubsystem for simpler, declarative definition.
 */
export function createEngineSubsystem<TState>(
  config: EngineSubsystemConfig<TState>,
): EngineSubsystem {
  const {
    createState,
    engineEvents = {},
    sceneEvents = {},
    phases = {},
    portProviders = [],
    onSceneAdded: userOnSceneAdded,
    dispose,
    updateWhenPaused = false,
  } = config;

  const stateRef: { current: TState | undefined } = { current: undefined };
  const stateFactory = createState;

  const engineEventHandlers: EngineSubsystem['engineEventHandlers'] =
    Object.keys(engineEvents).length > 0
      ? (Object.fromEntries(
          Object.entries(engineEvents)
            .filter(([, useCase]) => useCase)
            .map(([kind, useCase]) => [
              kind,
              (engine: EngineState, event: EngineChangeEvent) => {
                if (!stateRef.current) stateRef.current = stateFactory({ engine });
                (useCase as SubsystemUseCase<TState, SubsystemEngineEventParams, void>).execute(
                  stateRef.current,
                  { engine, event },
                );
              },
            ]),
        ) as EngineSubsystem['engineEventHandlers'])
      : undefined;

  const sceneEventHandlers: EngineSubsystem['sceneEventHandlers'] =
    Object.keys(sceneEvents).length > 0
      ? (Object.fromEntries(
          Object.entries(sceneEvents)
            .filter(([, useCase]) => useCase)
            .map(([kind, useCase]) => [
              kind,
              (engine: EngineState, scene: SceneState, event: SceneChangeEventWithError) => {
                if (!stateRef.current) stateRef.current = stateFactory({ engine });
                (useCase as SubsystemUseCase<TState, EngineSubsystemSceneEventParams, void>).execute(
                  stateRef.current,
                  { engine, scene, event },
                );
              },
            ]),
        ) as EngineSubsystem['sceneEventHandlers'])
      : undefined;

  const onSceneAdded =
    userOnSceneAdded &&
    ((engine: EngineState, scene: SceneState) => {
      if (!stateRef.current) stateRef.current = stateFactory({ engine });
      (userOnSceneAdded as SubsystemUseCase<TState, EngineSubsystemSceneAddedParams, void>).execute(
        stateRef.current,
        { engine, scene },
      );
    });

  return {
    subsystemId: config.id,
    portProviders: portProviders.length > 0 ? [...portProviders] : undefined,
    onSceneAdded,
    engineEventHandlers,
    sceneEventHandlers,
    earlyUpdate: makeEnginePhaseCallback(phases.earlyUpdate, stateRef, stateFactory),
    physics: makeEnginePhaseCallback(phases.physics, stateRef, stateFactory),
    update: makeEnginePhaseCallback(phases.update, stateRef, stateFactory),
    lateUpdate: makeEnginePhaseCallback(phases.lateUpdate, stateRef, stateFactory),
    preRender: makeEnginePhaseCallback(phases.preRender, stateRef, stateFactory),
    render: makeEnginePhaseCallback(phases.render, stateRef, stateFactory),
    postRender: makeEnginePhaseCallback(phases.postRender, stateRef, stateFactory),
    updateWhenPaused,
    dispose: dispose
      ? () => {
          if (stateRef.current) {
            dispose.execute(stateRef.current, undefined as void);
          }
        }
      : undefined,
  };
}
