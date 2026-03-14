import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createEntityId } from '@duckengine/core-v2';
import type { ScriptSchema } from '@duckengine/core-v2';
import { reconcileSlots } from './reconcileSlots';
import { createSceneEventBus } from '@duckengine/core-v2';
import { createScriptSlot } from '../domain/slots';
import type { ScriptSandbox } from '../domain/ports';
import type { ScriptingSessionState } from '../domain/session';
import {
  createMockScene,
  componentChangedEvent,
} from '../infrastructure/testing/applicationTestHelpers';

function createMockSandbox(): jest.Mocked<ScriptSandbox> {
  return {
    detectHooks: jest.fn().mockReturnValue(['init']),
    createSlot: jest.fn(),
    destroySlot: jest.fn(),
    callHook: jest.fn().mockReturnValue(true),
    syncProperties: jest.fn(),
    flushDirtyProperties: jest.fn().mockReturnValue(null),
    dispose: jest.fn(),
    bindComponentAccessors: jest.fn(),
  } as unknown as jest.Mocked<ScriptSandbox>;
}

describe('reconcileSlots', () => {
  let sandbox: jest.Mocked<ScriptSandbox>;
  let session: ScriptingSessionState;

  beforeEach(() => {
    sandbox = createMockSandbox();

    const resolveSource = jest.fn<(id: string) => Promise<string | null>>().mockResolvedValue('return { init = function() end }');
    const resolveScriptSchema = jest.fn<(id: string) => Promise<ScriptSchema | null>>().mockResolvedValue(null);

    session = {
      slots: new Map(),
      pending: new Map(),
      pendingScripts: [],
      eventBus: createSceneEventBus(),
      timeState: { delta: 0, elapsed: 0, frameCount: 0, scale: 1 },
      sandbox,
      bridges: [],
      ports: {},
      resolveSource,
      resolveScriptSchema,
      pendingDestroys: [],
    };
  });

  it('does nothing when event is not component-changed', () => {
    const entityId = createEntityId('e1');
    const scene = createMockScene(entityId, [
      { scriptId: 'test-script', enabled: true, properties: {} },
    ]);

    reconcileSlots.execute(session, {
      scene,
      event: { kind: 'entity-removed', entityId },
    });

    expect(sandbox.createSlot).not.toHaveBeenCalled();
    expect(sandbox.bindComponentAccessors).not.toHaveBeenCalled();
  });

  it('does nothing when component type is not script', () => {
    const entityId = createEntityId('e1');
    const scene = createMockScene(entityId, [
      { scriptId: 'test-script', enabled: true, properties: {} },
    ]);

    reconcileSlots.execute(session, componentChangedEvent(scene, entityId, 'name'));

    expect(sandbox.createSlot).not.toHaveBeenCalled();
  });

  it('binds component accessors when sandbox supports it', () => {
    const entityId = createEntityId('e1');
    const scene = createMockScene(entityId, [
      { scriptId: 'test-script', enabled: true, properties: {} },
    ]);

    reconcileSlots.execute(session, componentChangedEvent(scene, entityId));

    expect(sandbox.bindComponentAccessors).toHaveBeenCalledTimes(1);
    expect(sandbox.bindComponentAccessors).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('does not bind accessors when sandbox has no bindComponentAccessors', async () => {
    const sandboxWithoutBind = { ...sandbox };
    delete (sandboxWithoutBind as { bindComponentAccessors?: unknown }).bindComponentAccessors;
    const sessionWithoutBind: typeof session = {
      ...session,
      sandbox: sandboxWithoutBind as ScriptSandbox,
    };

    const entityId = createEntityId('e1');
    const scene = createMockScene(entityId, [
      { scriptId: 'test-script', enabled: true, properties: {} },
    ]);

    reconcileSlots.execute(sessionWithoutBind, componentChangedEvent(scene, entityId));

    await Promise.all(sessionWithoutBind.pending.values());
    expect((sandboxWithoutBind as { bindComponentAccessors?: unknown }).bindComponentAccessors).toBeUndefined();
  });

  it('initiates new slot for script in component', async () => {
    const entityId = createEntityId('e1');
    const scene = createMockScene(entityId, [
      { scriptId: 'test-script', enabled: true, properties: { speed: 5 } },
    ]);

    reconcileSlots.execute(session, componentChangedEvent(scene, entityId));

    await Promise.all(session.pending.values());

    expect(session.resolveSource).toHaveBeenCalledWith('test-script');
    expect(sandbox.detectHooks).toHaveBeenCalled();
    expect(sandbox.createSlot).toHaveBeenCalledWith(
      'e1::test-script',
      expect.any(String),
      expect.any(Object),
      { speed: 5 },
      null,
    );
    expect(session.slots.has('e1::test-script')).toBe(true);
  });

  it('destroys slot when script removed from component', async () => {
    const entityId = createEntityId('e1');
    const slot = createScriptSlot(entityId, 'old-script', {}, ['init']);
    slot.sandboxHandle = 'e1::old-script';
    session.slots.set('e1::old-script', slot);

    const scene = createMockScene(entityId, []);

    reconcileSlots.execute(session, {
      scene,
      event: { kind: 'component-changed', entityId, componentType: 'script' },
    } as Parameters<typeof reconcileSlots.execute>[1]);

    expect(sandbox.callHook).toHaveBeenCalledWith('e1::old-script', 'onDisable', 0);
    expect(sandbox.callHook).toHaveBeenCalledWith('e1::old-script', 'onDestroy', 0);
    expect(sandbox.destroySlot).toHaveBeenCalledWith('e1::old-script');
    expect(session.slots.has('e1::old-script')).toBe(false);
  });

  it('calls onEnable when slot enabled changes to true', async () => {
    const entityId = createEntityId('e1');
    const slot = createScriptSlot(entityId, 'test-script', {}, ['init']);
    slot.enabled = false;
    slot.sandboxHandle = 'e1::test-script';
    session.slots.set('e1::test-script', slot);

    const scene = createMockScene(entityId, [
      { scriptId: 'test-script', enabled: true, properties: {} },
    ]);

    reconcileSlots.execute(session, componentChangedEvent(scene, entityId));

    expect(slot.enabled).toBe(true);
    expect(sandbox.callHook).toHaveBeenCalledWith('e1::test-script', 'onEnable', 0);
  });

  it('calls onDisable when slot enabled changes to false', async () => {
    const entityId = createEntityId('e1');
    const slot = createScriptSlot(entityId, 'test-script', {}, ['init']);
    slot.sandboxHandle = 'e1::test-script';
    session.slots.set('e1::test-script', slot);

    const scene = createMockScene(entityId, [
      { scriptId: 'test-script', enabled: false, properties: {} },
    ]);

    reconcileSlots.execute(session, componentChangedEvent(scene, entityId));

    expect(slot.enabled).toBe(false);
    expect(sandbox.callHook).toHaveBeenCalledWith('e1::test-script', 'onDisable', 0);
  });
});
