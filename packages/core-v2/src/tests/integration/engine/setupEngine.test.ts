import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupIntegrationTest } from '../setup';
import type { TestContext } from '../setup';
import type { SceneAdapterFactory } from '../../../domain/adapters';

describe('Integration: Engine > setupEngine', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = setupIntegrationTest();
  });

  it('should register engine adapters provided at setup time', () => {
    const updateSpy = jest.fn();

    ctx.api.setup({
      engineAdapters: [{ update: updateSpy }],
    });
    ctx.api.update({ dt: 0.16 });

    expect(updateSpy).toHaveBeenCalledWith(ctx.engine, 0.16);
  });

  it('should apply scene adapter factories to newly created scenes', () => {
    const eventSpy = jest.fn();
    const factory: SceneAdapterFactory = () => ({
      handleSceneEvent: eventSpy,
    });

    ctx.api.setup({
      sceneAdapters: [factory],
    });

    ctx.api.addScene({ sceneId: 'main' });
    ctx.api.scene('main').setupScene({});

    expect(ctx.engine.scenes.get('main')?.adapters).toHaveLength(1);
    expect(eventSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ kind: 'scene-setup' }),
    );
  });

  it('should expose derived ports to scene adapter factories', () => {
    const derivedPort = { ping: jest.fn(() => 'pong') };
    const factorySpy = jest.fn((context: Parameters<SceneAdapterFactory>[0]) => {
      const io = context.ports.get<typeof derivedPort>('io:derived');
      io?.ping();
      return {
        handleSceneEvent: () => {
          // no-op
        },
      };
    });
    const factory: SceneAdapterFactory = factorySpy;

    ctx.api.setup({
      portDerivers: [({ ports }) => ports.set('io:derived', derivedPort)],
      sceneAdapters: [factory],
    });

    ctx.api.addScene({ sceneId: 'main' });

    expect(factorySpy).toHaveBeenCalledTimes(1);
    expect(derivedPort.ping).toHaveBeenCalledTimes(1);
  });
});
