import type { SceneSubsystem, SceneSubsystemConfig, SceneSubsystemFactory, SceneSubsystemFactoryContext } from './types';
import { composeSceneSubsystem } from './composeSceneSubsystem';

/**
 * Creates a SceneSubsystemFactory from a flat config.
 *
 * Composes domain models and typed use cases without fluent builder nesting.
 * Use this instead of defineSceneSubsystem for simpler, declarative subsystem definition.
 */
export function createSceneSubsystem<TState>(config: SceneSubsystemConfig<TState>): SceneSubsystemFactory {
  const { createState, events = {}, phases = {}, dispose, updateWhenPaused = false } = config;

  return (context: SceneSubsystemFactoryContext): SceneSubsystem => {
    const state = createState(context);
    const composer = composeSceneSubsystem(state);

    for (const [eventKind, useCase] of Object.entries(events)) {
      if (useCase) {
        composer.on(eventKind as keyof typeof events, useCase);
      }
    }

    if (phases.earlyUpdate) composer.onEarlyUpdate(phases.earlyUpdate);
    if (phases.physics) composer.onPhysics(phases.physics);
    if (phases.update) composer.onUpdate(phases.update);
    if (phases.lateUpdate) composer.onLateUpdate(phases.lateUpdate);
    if (phases.preRender) composer.onPreRender(phases.preRender);
    if (phases.postRender) composer.onPostRender(phases.postRender);

    if (dispose) composer.onDispose(dispose);
    if (updateWhenPaused) composer.updateWhenPaused(true);

    return composer.build();
  };
}
