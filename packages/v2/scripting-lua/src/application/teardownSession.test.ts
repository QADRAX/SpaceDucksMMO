import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createEntityId } from '@duckengine/core-v2';
import type { ScriptSchema } from '@duckengine/core-v2';
import { teardownSession } from './teardownSession';
import { createSceneEventBus } from '@duckengine/core-v2';
import { createScriptSlot } from '../domain/slots';
import type { ScriptSandbox } from '../domain/ports';
import type { ScriptingSessionState } from '../domain/session';

function createMockSandbox(): jest.Mocked<ScriptSandbox> {
  return {
    detectHooks: jest.fn(),
    createSlot: jest.fn(),
    destroySlot: jest.fn(),
    callHook: jest.fn().mockReturnValue(true),
    syncProperties: jest.fn(),
    flushDirtyProperties: jest.fn().mockReturnValue(null),
    dispose: jest.fn(),
    bindComponentAccessors: jest.fn(),
  } as unknown as jest.Mocked<ScriptSandbox>;
}

describe('teardownSession', () => {
  let sandbox: jest.Mocked<ScriptSandbox>;
  let session: ScriptingSessionState;

  beforeEach(() => {
    sandbox = createMockSandbox();

    session = {
      slots: new Map(),
      pending: new Map(),
      pendingScripts: [],
      eventBus: createSceneEventBus(),
      timeState: { delta: 0, elapsed: 0, frameCount: 0, scale: 1 },
      sandbox,
      bridges: [],
      ports: {},
      resolveSource: jest.fn<(id: string) => Promise<string | null>>().mockResolvedValue(null),
      resolveScriptSchema: jest.fn<(id: string) => Promise<ScriptSchema | null>>().mockResolvedValue(null),
      pendingDestroys: [],
    };
  });

  it('calls onDisable, onDestroy, destroySlot for each enabled slot', () => {
    const entityId = createEntityId('e1');

    const slot = createScriptSlot(entityId, 'test-script', {}, ['init']);
    slot.sandboxHandle = 'e1::test-script';
    session.slots.set('e1::test-script', slot);

    teardownSession.execute(session);

    expect(sandbox.callHook).toHaveBeenCalledWith('e1::test-script', 'onDisable', 0);
    expect(sandbox.callHook).toHaveBeenCalledWith('e1::test-script', 'onDestroy', 0);
    expect(sandbox.destroySlot).toHaveBeenCalledWith('e1::test-script');
  });

  it('skips onDisable for disabled slots', () => {
    const entityId = createEntityId('e1');

    const slot = createScriptSlot(entityId, 'test-script', {}, ['init']);
    slot.enabled = false;
    slot.sandboxHandle = 'e1::test-script';
    session.slots.set('e1::test-script', slot);

    teardownSession.execute(session);

    expect(sandbox.callHook).not.toHaveBeenCalledWith('e1::test-script', 'onDisable', 0);
    expect(sandbox.callHook).toHaveBeenCalledWith('e1::test-script', 'onDestroy', 0);
    expect(sandbox.destroySlot).toHaveBeenCalledWith('e1::test-script');
  });

  it('clears slots and disposes event bus', () => {
    const entityId = createEntityId('e1');

    const slot = createScriptSlot(entityId, 'test-script', {}, []);
    slot.sandboxHandle = 'e1::test-script';
    session.slots.set('e1::test-script', slot);

    const disposeSpy = jest.spyOn(session.eventBus, 'dispose');

    teardownSession.execute(session);

    expect(session.slots.size).toBe(0);
    expect(disposeSpy).toHaveBeenCalledTimes(1);
  });

  it('tears down multiple slots', () => {
    const entityId = createEntityId('e1');

    const slot1 = createScriptSlot(entityId, 'script-a', {}, []);
    slot1.sandboxHandle = 'e1::script-a';
    const slot2 = createScriptSlot(entityId, 'script-b', {}, []);
    slot2.sandboxHandle = 'e1::script-b';
    session.slots.set('e1::script-a', slot1);
    session.slots.set('e1::script-b', slot2);

    teardownSession.execute(session);

    expect(sandbox.destroySlot).toHaveBeenCalledWith('e1::script-a');
    expect(sandbox.destroySlot).toHaveBeenCalledWith('e1::script-b');
    expect(session.slots.size).toBe(0);
  });
});
