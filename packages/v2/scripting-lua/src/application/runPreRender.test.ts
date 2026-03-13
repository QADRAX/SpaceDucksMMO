import { describe, it, expect, beforeEach } from '@jest/globals';
import { createEntityId } from '@duckengine/core-v2';
import { runPreRender } from './runPreRender';
import { createScriptSlot } from '../domain/slots';
import {
  createMockScene,
  createMockSandbox,
  createMockSession,
} from '../infrastructure/testing/applicationTestHelpers';

describe('runPreRender', () => {
  let sandbox: ReturnType<typeof createMockSandbox>;
  let session: ReturnType<typeof createMockSession>;

  beforeEach(() => {
    sandbox = createMockSandbox();
    session = createMockSession(sandbox);
  });

  it('runs onDrawGizmos hook on enabled slots that declare it', () => {
    const entityId = createEntityId('e1');
    const slot = createScriptSlot(entityId, 'test-script', {}, ['onDrawGizmos']);
    slot.sandboxHandle = 'e1::test-script';
    session.slots.set('e1::test-script', slot);

    const scene = createMockScene(entityId, [
      { scriptId: 'test-script', enabled: true, properties: {} },
    ]);

    runPreRender.execute(session, { scene, dt: 0.016 });

    expect(sandbox.callHook).toHaveBeenCalledWith('e1::test-script', 'onDrawGizmos', 0.016);
  });
});
