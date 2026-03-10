import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createEntityId } from '@duckengine/core-v2';
import type { ScriptSchema } from '@duckengine/core-v2';
import { destroyEntitySlots } from './destroyEntitySlots';
import { createScriptEventBus } from '../domain/events';
import { createScriptSlot } from '../domain/slots';
import type { ScriptSandbox } from '../domain/ports';
import type { ScriptingSessionState } from '../domain/session';
import {
  createMockScene,
  entityRemovedEvent,
} from '../infrastructure/testing/applicationTestHelpers';

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

describe('destroyEntitySlots', () => {
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
    };
  });

  it('does nothing when event is not entity-removed', () => {
    const entityId = createEntityId('e1');
    const scene = createMockScene(entityId, []);

    const slot = createScriptSlot(entityId, 'test-script', {}, ['init']);
    slot.sandboxHandle = 'e1::test-script';
    session.slots.set('e1::test-script', slot);

    destroyEntitySlots.execute(session, {
      scene,
      event: { kind: 'component-changed', entityId, componentType: 'script' },
    });

    expect(sandbox.destroySlot).not.toHaveBeenCalled();
    expect(session.slots.size).toBe(1);
  });

  it('destroys all slots for the removed entity', () => {
    const entityId = createEntityId('e1');
    const scene = createMockScene(entityId, []);

    const slot1 = createScriptSlot(entityId, 'script-a', {}, ['init']);
    slot1.sandboxHandle = 'e1::script-a';
    const slot2 = createScriptSlot(entityId, 'script-b', {}, ['init']);
    slot2.sandboxHandle = 'e1::script-b';
    session.slots.set('e1::script-a', slot1);
    session.slots.set('e1::script-b', slot2);

    destroyEntitySlots.execute(session, entityRemovedEvent(scene, entityId));

    expect(sandbox.callHook).toHaveBeenCalledWith('e1::script-a', 'onDisable', 0);
    expect(sandbox.callHook).toHaveBeenCalledWith('e1::script-a', 'onDestroy', 0);
    expect(sandbox.destroySlot).toHaveBeenCalledWith('e1::script-a');
    expect(sandbox.callHook).toHaveBeenCalledWith('e1::script-b', 'onDisable', 0);
    expect(sandbox.callHook).toHaveBeenCalledWith('e1::script-b', 'onDestroy', 0);
    expect(sandbox.destroySlot).toHaveBeenCalledWith('e1::script-b');
    expect(session.slots.size).toBe(0);
  });

  it('skips slots belonging to other entities', () => {
    const entityId = createEntityId('e1');
    const otherId = createEntityId('e2');
    const scene = createMockScene(entityId, []);

    const slotToRemove = createScriptSlot(entityId, 'script-a', {}, ['init']);
    slotToRemove.sandboxHandle = 'e1::script-a';
    const slotToKeep = createScriptSlot(otherId, 'script-b', {}, ['init']);
    slotToKeep.sandboxHandle = 'e2::script-b';
    session.slots.set('e1::script-a', slotToRemove);
    session.slots.set('e2::script-b', slotToKeep);

    destroyEntitySlots.execute(session, entityRemovedEvent(scene, entityId));

    expect(sandbox.destroySlot).toHaveBeenCalledTimes(1);
    expect(sandbox.destroySlot).toHaveBeenCalledWith('e1::script-a');
    expect(session.slots.has('e2::script-b')).toBe(true);
  });

  it('skips onDisable when slot is already disabled', () => {
    const entityId = createEntityId('e1');
    const scene = createMockScene(entityId, []);

    const slot = createScriptSlot(entityId, 'script-a', {}, ['init']);
    slot.enabled = false;
    slot.sandboxHandle = 'e1::script-a';
    session.slots.set('e1::script-a', slot);

    destroyEntitySlots.execute(session, entityRemovedEvent(scene, entityId));

    expect(sandbox.callHook).not.toHaveBeenCalledWith('e1::script-a', 'onDisable', 0);
    expect(sandbox.callHook).toHaveBeenCalledWith('e1::script-a', 'onDestroy', 0);
    expect(sandbox.destroySlot).toHaveBeenCalledWith('e1::script-a');
  });
});
