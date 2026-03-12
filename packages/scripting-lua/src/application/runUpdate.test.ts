import { describe, it, expect, beforeEach } from '@jest/globals';
import { createEntityId } from '@duckengine/core-v2';
import { runUpdate } from './runUpdate';
import { createScriptSlot } from '../domain/slots';
import {
  createMockScene,
  createMockSandbox,
  createMockSession,
  updateParams,
} from '../infrastructure/testing/applicationTestHelpers';

describe('runUpdate', () => {
  let sandbox: ReturnType<typeof createMockSandbox>;
  let session: ReturnType<typeof createMockSession>;

  beforeEach(() => {
    sandbox = createMockSandbox();
    session = createMockSession(sandbox);
  });

  it('runs update hook on enabled slots that declare it', () => {
    const entityId = createEntityId('e1');
    const slot = createScriptSlot(entityId, 'test-script', {}, ['update']);
    slot.sandboxHandle = 'e1::test-script';
    session.slots.set('e1::test-script', slot);

    const scene = createMockScene(entityId, [
      { scriptId: 'test-script', enabled: true, properties: {} },
    ]);

    runUpdate.execute(session, { scene, dt: 0.016 });

    expect(sandbox.callHook).toHaveBeenCalledWith('e1::test-script', 'update', 0.016);
  });

  it('disables slot when hook returns false', () => {
    const entityId = createEntityId('e1');
    const slot = createScriptSlot(entityId, 'test-script', {}, ['update']);
    slot.sandboxHandle = 'e1::test-script';
    session.slots.set('e1::test-script', slot);

    const failingSandbox = createMockSandbox({
      callHook: (_key: string, hook: string) => hook !== 'update',
    });
    const sessionWithFailingSandbox = createMockSession(failingSandbox, { slots: session.slots });

    const scene = createMockScene(entityId, [
      { scriptId: 'test-script', enabled: true, properties: {} },
    ]);

    runUpdate.execute(sessionWithFailingSandbox, updateParams(scene, 0.016));

    expect(slot.enabled).toBe(false);
  });
});
