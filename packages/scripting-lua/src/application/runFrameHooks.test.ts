import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createEntityId } from '@duckengine/core-v2';
import type { PropertyValues, ScriptSchema } from '@duckengine/core-v2';
import { runFrameHooks } from './runFrameHooks';
import { createScriptEventBus } from '../domain/events';
import { createScriptSlot } from '../domain/slots';
import type { ScriptSandbox } from '../domain/ports';
import type { ScriptingSessionState } from '../domain/session';
import {
  createMockScene,
  updateParams,
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

describe('runFrameHooks', () => {
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

  it('updates timeState each frame', () => {
    const scene = createMockScene(createEntityId('e1'), []);

    runFrameHooks.execute(session, updateParams(scene, 0.032));

    expect(session.timeState.delta).toBe(0.032);
    expect(session.timeState.elapsed).toBe(0.032);
    expect(session.timeState.frameCount).toBe(1);
  });

  it('binds component accessors when sandbox supports it', () => {
    const scene = createMockScene(createEntityId('e1'), []);

    runFrameHooks.execute(session, updateParams(scene, 0.016));

    expect(sandbox.bindComponentAccessors).toHaveBeenCalledTimes(1);
    expect(sandbox.bindComponentAccessors).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('syncs properties and runs frame hooks for enabled slots', () => {
    const entityId = createEntityId('e1');
    const slot = createScriptSlot(entityId, 'test-script', { speed: 5 }, [
      'earlyUpdate',
      'update',
      'lateUpdate',
    ]);
    slot.sandboxHandle = 'e1::test-script';
    session.slots.set('e1::test-script', slot);

    const scene = createMockScene(entityId, [
      { scriptId: 'test-script', enabled: true, properties: { speed: 10 } },
    ]);

    runFrameHooks.execute(session, { scene, dt: 0.016 });

    expect(sandbox.syncProperties).toHaveBeenCalledWith(
      'e1::test-script',
      expect.objectContaining({ speed: 10 }),
    );
    expect(sandbox.callHook).toHaveBeenCalledWith('e1::test-script', 'earlyUpdate', 0.016);
    expect(sandbox.callHook).toHaveBeenCalledWith('e1::test-script', 'update', 0.016);
    expect(sandbox.callHook).toHaveBeenCalledWith('e1::test-script', 'lateUpdate', 0.016);
  });

  it('skips disabled slots', () => {
    const entityId = createEntityId('e1');
    const slot = createScriptSlot(entityId, 'test-script', {}, ['update']);
    slot.enabled = false;
    slot.sandboxHandle = 'e1::test-script';
    session.slots.set('e1::test-script', slot);

    const scene = createMockScene(entityId, [
      { scriptId: 'test-script', enabled: false, properties: {} },
    ]);

    runFrameHooks.execute(session, updateParams(scene, 0.016));

    expect(sandbox.syncProperties).not.toHaveBeenCalled();
    expect(sandbox.callHook).not.toHaveBeenCalledWith('e1::test-script', 'update', expect.any(Number));
  });

  it('flushes event bus between earlyUpdate and remaining frame hooks', () => {
    const flushSpy = jest.spyOn(session.eventBus, 'flush');
    const scene = createMockScene(createEntityId('e1'), []);

    runFrameHooks.execute(session, { scene, dt: 0.016 });

    expect(flushSpy).toHaveBeenCalledTimes(1);
  });

  it('flushes dirty properties from sandbox to ECS', () => {
    const entityId = createEntityId('e1');
    const slot = createScriptSlot(entityId, 'test-script', { x: 0 }, ['update']);
    slot.sandboxHandle = 'e1::test-script';
    session.slots.set('e1::test-script', slot);

    const flushDirtyPropertiesMock = jest.fn().mockReturnValue({ x: 42 } as PropertyValues);
    const flushSandbox: ScriptSandbox = {
      ...sandbox,
      flushDirtyProperties: flushDirtyPropertiesMock as (key: string) => PropertyValues | null,
    };
    const sessionWithFlush = { ...session, sandbox: flushSandbox };

    const scene = createMockScene(entityId, [
      { scriptId: 'test-script', enabled: true, properties: { x: 0 } },
    ]);

    runFrameHooks.execute(sessionWithFlush, updateParams(scene, 0.016));

    expect(flushDirtyPropertiesMock).toHaveBeenCalledWith('e1::test-script');
    expect(slot.properties.x).toBe(42);

    const scriptComp = scene.entities.get(entityId)?.components.get('script') as
      | { scripts: Array<{ properties: Record<string, unknown> }> }
      | undefined;
    const firstScript = scriptComp?.scripts?.[0];
    expect(firstScript?.properties.x).toBe(42);
  });

  it('disables slot when hook returns false', () => {
    const entityId = createEntityId('e1');
    const slot = createScriptSlot(entityId, 'test-script', {}, ['update']);
    slot.sandboxHandle = 'e1::test-script';
    session.slots.set('e1::test-script', slot);

    const failingSandbox: ScriptSandbox = {
      ...sandbox,
      callHook: (_key: string, hook: string) => hook !== 'update',
    };
    const sessionWithFailingSandbox = { ...session, sandbox: failingSandbox };

    const scene = createMockScene(entityId, [
      { scriptId: 'test-script', enabled: true, properties: {} },
    ]);

    runFrameHooks.execute(sessionWithFailingSandbox, updateParams(scene, 0.016));

    expect(slot.enabled).toBe(false);
  });
});
