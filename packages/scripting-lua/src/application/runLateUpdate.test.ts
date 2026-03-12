import { describe, it, expect, beforeEach } from '@jest/globals';
import { createEntityId } from '@duckengine/core-v2';
import { runLateUpdate } from './runLateUpdate';
import { createScriptSlot } from '../domain/slots';
import {
  createMockScene,
  createMockSandbox,
  createMockSession,
} from '../infrastructure/testing/applicationTestHelpers';

describe('runLateUpdate', () => {
  let sandbox: ReturnType<typeof createMockSandbox>;
  let session: ReturnType<typeof createMockSession>;

  beforeEach(() => {
    sandbox = createMockSandbox();
    session = createMockSession(sandbox);
  });

  it('runs lateUpdate hook on enabled slots that declare it', () => {
    const entityId = createEntityId('e1');
    const slot = createScriptSlot(entityId, 'test-script', {}, ['lateUpdate']);
    slot.sandboxHandle = 'e1::test-script';
    session.slots.set('e1::test-script', slot);

    const scene = createMockScene(entityId, [
      { scriptId: 'test-script', enabled: true, properties: {} },
    ]);

    runLateUpdate.execute(session, { scene, dt: 0.016 });

    expect(sandbox.callHook).toHaveBeenCalledWith('e1::test-script', 'lateUpdate', 0.016);
  });
});
