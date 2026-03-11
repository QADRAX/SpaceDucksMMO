import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createEntityId } from '@duckengine/core-v2';
import type { ScriptSchema } from '@duckengine/core-v2';
import { syncProperties } from './syncProperties';
import { createScriptEventBus } from '../domain/events';
import { createScriptSlot } from '../domain/slots';
import type { ScriptSandbox } from '../domain/ports';
import type { ScriptingSessionState } from '../domain/session';
import { createMockScene } from '../infrastructure/testing/applicationTestHelpers';

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

describe('syncProperties', () => {
  let sandbox: jest.Mocked<ScriptSandbox>;
  let session: ScriptingSessionState;

  beforeEach(() => {
    sandbox = createMockSandbox();

    session = {
      slots: new Map(),
      pending: new Map(),
      eventBus: createScriptEventBus(),
      timeState: { delta: 0, elapsed: 0, frameCount: 0, scale: 1 },
      sandbox,
      bridges: [],
      ports: {},
      resolveSource: jest.fn<(id: string) => Promise<string | null>>().mockResolvedValue(null),
      resolveScriptSchema: jest.fn<(id: string) => Promise<ScriptSchema | null>>().mockResolvedValue(null),
      pendingDestroys: [],
    };
  });

  it('syncs properties for all enabled slots', () => {
    const entityId = createEntityId('e1');
    const scene = createMockScene(entityId, [
      { scriptId: 'test-script', enabled: true, properties: { speed: 10 } },
    ]);

    const slot = createScriptSlot(entityId, 'test-script', { speed: 5 }, ['onPropertyChanged']);
    slot.sandboxHandle = 'e1::test-script';
    session.slots.set('e1::test-script', slot);

    syncProperties.execute(session, { scene });

    expect(sandbox.syncProperties).toHaveBeenCalledWith(
      'e1::test-script',
      expect.objectContaining({ speed: 10 }),
    );
    expect(sandbox.callHook).toHaveBeenCalledWith(
      'e1::test-script',
      'onPropertyChanged',
      0,
      'speed',
      10,
    );
  });

  it('skips disabled slots', () => {
    const entityId = createEntityId('e1');
    const scene = createMockScene(entityId, [
      { scriptId: 'test-script', enabled: true, properties: { speed: 10 } },
    ]);

    const slot = createScriptSlot(entityId, 'test-script', { speed: 5 }, []);
    slot.enabled = false;
    slot.sandboxHandle = 'e1::test-script';
    session.slots.set('e1::test-script', slot);

    syncProperties.execute(session, { scene });

    expect(sandbox.syncProperties).not.toHaveBeenCalled();
  });

  it('syncs multiple slots', () => {
    const entityId = createEntityId('e1');
    const scene = createMockScene(entityId, [
      { scriptId: 'script-a', enabled: true, properties: { x: 1 } },
      { scriptId: 'script-b', enabled: true, properties: { y: 2 } },
    ]);

    const slotA = createScriptSlot(entityId, 'script-a', {}, []);
    slotA.sandboxHandle = 'e1::script-a';
    const slotB = createScriptSlot(entityId, 'script-b', {}, []);
    slotB.sandboxHandle = 'e1::script-b';
    session.slots.set('e1::script-a', slotA);
    session.slots.set('e1::script-b', slotB);

    syncProperties.execute(session, { scene });

    expect(sandbox.syncProperties).toHaveBeenCalledTimes(2);
    expect(sandbox.syncProperties).toHaveBeenCalledWith('e1::script-a', expect.any(Object));
    expect(sandbox.syncProperties).toHaveBeenCalledWith('e1::script-b', expect.any(Object));
  });
});
