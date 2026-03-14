import { describe, it, expect } from '@jest/globals';
import { createEngine } from '../../../domain/engine/createEngine';
import { createDuckEngineAPI } from '../../../infrastructure/api/createDuckEngineAPI';
import { createSceneId } from '../setup';
import { definePort } from '../../../domain/subsystems';
import { createSceneSubsystem } from '../../../domain/subsystems/createSceneSubsystem';

const SCENE_ID_PORT_ID = 'io:scene-id';

/**
 * Integration test: scene-scoped port isolation.
 *
 * Guarantees that when a scene subsystem registers a port in createState(ctx),
 * that port is stored in that scene's registry only. So each scene gets its own
 * implementation (e.g. physics raycast only hits that scene's world; scripting
 * in scene A cannot get raycast hits from scene B).
 */
describe('Integration: Scene port isolation', () => {
  it('each scene gets its own port implementation from the scene subsystem', () => {
    const sceneIdPortDef = definePort<{ getSceneId(): string }>(SCENE_ID_PORT_ID)
      .addMethod('getSceneId')
      .build();

    const factory = createSceneSubsystem({
      id: 'scene-id-port',
      createState(ctx) {
        const impl = { getSceneId: () => ctx.scene.id };
        ctx.ports.register(sceneIdPortDef, impl);
        return {};
      },
    });

    const engine = createEngine();
    const api = createDuckEngineAPI(engine);

    api.setup({ sceneSubsystems: [factory] });

    const sceneAId = createSceneId('sceneA');
    const sceneBId = createSceneId('sceneB');
    api.addScene({ sceneId: sceneAId });
    api.addScene({ sceneId: sceneBId });

    const sceneA = engine.scenes.get(sceneAId)!;
    const sceneB = engine.scenes.get(sceneBId)!;

    const implA = sceneA.scenePorts.get(SCENE_ID_PORT_ID) as { getSceneId(): string } | undefined;
    const implB = sceneB.scenePorts.get(SCENE_ID_PORT_ID) as { getSceneId(): string } | undefined;

    expect(implA).toBeDefined();
    expect(implB).toBeDefined();
    expect(implA).not.toBe(implB);

    expect(implA!.getSceneId()).toBe(sceneAId);
    expect(implB!.getSceneId()).toBe(sceneBId);
  });
});
