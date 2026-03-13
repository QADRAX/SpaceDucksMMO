import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createEntityId } from '@duckengine/core-v2';
import { runEarlyUpdate } from './runEarlyUpdate';
import { createScriptSlot } from '../domain/slots';
import {
  createMockScene,
  createMockSandbox,
  createMockSession,
  updateParams,
} from '../infrastructure/testing/applicationTestHelpers';

describe('runEarlyUpdate', () => {
  let sandbox: ReturnType<typeof createMockSandbox>;
  let session: ReturnType<typeof createMockSession>;

  beforeEach(() => {
    sandbox = createMockSandbox();
    session = createMockSession(sandbox);
  });

  it('updates timeState each frame', () => {
    const scene = createMockScene(createEntityId('e1'), []);

    runEarlyUpdate.execute(session, updateParams(scene, 0.032));

    expect(session.timeState.delta).toBe(0.032);
    expect(session.timeState.elapsed).toBe(0.032);
    expect(session.timeState.frameCount).toBe(1);
  });

  it('binds component accessors when sandbox supports it', () => {
    const scene = createMockScene(createEntityId('e1'), []);

    runEarlyUpdate.execute(session, updateParams(scene, 0.016));

    expect(sandbox.bindComponentAccessors).toHaveBeenCalledTimes(1);
    expect(sandbox.bindComponentAccessors).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('binds script error reporter when sandbox supports it', () => {
    const bindScriptErrorReporter = jest.fn();
    const sandboxWithReporter = createMockSandbox({ bindScriptErrorReporter });
    const sessionWithReporter = createMockSession(sandboxWithReporter);
    const scene = createMockScene(createEntityId('e1'), []);

    runEarlyUpdate.execute(sessionWithReporter, updateParams(scene, 0.016));

    expect(bindScriptErrorReporter).toHaveBeenCalledTimes(1);
    expect(bindScriptErrorReporter).toHaveBeenCalledWith(expect.any(Function));
  });

  it('syncs properties for enabled slots', () => {
    const entityId = createEntityId('e1');
    const slot = createScriptSlot(entityId, 'test-script', { speed: 5 }, ['earlyUpdate']);
    slot.sandboxHandle = 'e1::test-script';
    session.slots.set('e1::test-script', slot);

    const scene = createMockScene(entityId, [
      { scriptId: 'test-script', enabled: true, properties: { speed: 10 } },
    ]);

    runEarlyUpdate.execute(session, { scene, dt: 0.016 });

    expect(sandbox.syncProperties).toHaveBeenCalledWith(
      'e1::test-script',
      expect.objectContaining({ speed: 10 }),
    );
  });

  it('skips disabled slots for sync', () => {
    const entityId = createEntityId('e1');
    const slot = createScriptSlot(entityId, 'test-script', {}, ['earlyUpdate']);
    slot.enabled = false;
    slot.sandboxHandle = 'e1::test-script';
    session.slots.set('e1::test-script', slot);

    const scene = createMockScene(entityId, [
      { scriptId: 'test-script', enabled: false, properties: {} },
    ]);

    runEarlyUpdate.execute(session, updateParams(scene, 0.016));

    expect(sandbox.syncProperties).not.toHaveBeenCalled();
  });

  it('runs earlyUpdate hook on enabled slots', () => {
    const entityId = createEntityId('e1');
    const slot = createScriptSlot(entityId, 'test-script', {}, ['earlyUpdate']);
    slot.sandboxHandle = 'e1::test-script';
    session.slots.set('e1::test-script', slot);

    const scene = createMockScene(entityId, [
      { scriptId: 'test-script', enabled: true, properties: {} },
    ]);

    runEarlyUpdate.execute(session, { scene, dt: 0.016 });

    expect(sandbox.callHook).toHaveBeenCalledWith('e1::test-script', 'earlyUpdate', 0.016);
  });

  it('flushes event bus', () => {
    const flushSpy = jest.spyOn(session.eventBus, 'flush');
    const scene = createMockScene(createEntityId('e1'), []);

    runEarlyUpdate.execute(session, { scene, dt: 0.016 });

    expect(flushSpy).toHaveBeenCalledTimes(1);
  });
});
