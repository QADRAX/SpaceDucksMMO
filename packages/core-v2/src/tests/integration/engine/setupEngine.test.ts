import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupIntegrationTest, createSceneId } from '../setup';
import type { TestContext } from '../setup';
import type { SceneSubsystemFactory } from '../../../domain/subsystems';
import { definePort } from '../../../domain/subsystems';

describe('Integration: Engine > setupEngine', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = setupIntegrationTest();
  });

  it('should register engine subsystems provided at setup time', () => {
    const updateSpy = jest.fn();

    ctx.api.setup({
      engineSubsystems: [{ update: updateSpy }],
    });
    ctx.api.update({ dt: 0.16 });

    expect(updateSpy).toHaveBeenCalledWith(ctx.engine, 0.16);
  });

  it('should apply scene subsystem factories to newly created scenes', () => {
    const eventSpy = jest.fn();
    const factory: SceneSubsystemFactory = () => ({
      handleSceneEvent: eventSpy,
    });

    ctx.api.setup({
      sceneSubsystems: [factory],
    });

    const mainSceneId = createSceneId('main');
    ctx.api.addScene({ sceneId: mainSceneId });
    ctx.api.scene(mainSceneId).setupScene({});

    expect(ctx.engine.scenes.get(mainSceneId)?.subsystems).toHaveLength(1);
    expect(eventSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ kind: 'scene-setup' }),
    );
  });

  it('should expose derived ports to scene subsystem factories', () => {
    const derivedPort = { ping: jest.fn(() => 'pong') };
    const derivedPortDef = definePort<typeof derivedPort>('io:derived')
      .addMethod('ping')
      .build();

    const factorySpy = jest.fn((context: Parameters<SceneSubsystemFactory>[0]) => {
      const io = context.ports.get(derivedPortDef);
      io?.ping();
      return {
        handleSceneEvent: () => {
          // no-op
        },
      };
    });
    const factory: SceneSubsystemFactory = factorySpy;

    ctx.api.setup({
      portDerivers: [({ ports }: any) => ports.register(derivedPortDef, derivedPort)],
      sceneSubsystems: [factory],
    });

    const mainSceneId = createSceneId('main');
    ctx.api.addScene({ sceneId: mainSceneId });

    expect(factorySpy).toHaveBeenCalledTimes(1);
    expect(derivedPort.ping).toHaveBeenCalledTimes(1);
  });
});
