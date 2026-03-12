import { describe, it, expect, beforeEach } from '@jest/globals';
import { createEntityId } from '@duckengine/core-v2';
import type { PropertyValues } from '@duckengine/core-v2';
import { runPostRender } from './runPostRender';
import { createScriptSlot } from '../domain/slots';
import {
  createMockScene,
  createMockSandbox,
  createMockSession,
} from '../infrastructure/testing/applicationTestHelpers';

describe('runPostRender', () => {
  let sandbox: ReturnType<typeof createMockSandbox>;
  let session: ReturnType<typeof createMockSession>;

  beforeEach(() => {
    sandbox = createMockSandbox();
    session = createMockSession(sandbox);
  });

  it('flushes dirty properties from sandbox to ECS', () => {
    const entityId = createEntityId('e1');
    const slot = createScriptSlot(entityId, 'test-script', { x: 0 }, ['update']);
    slot.sandboxHandle = 'e1::test-script';
    session.slots.set('e1::test-script', slot);

    const flushDirtyPropertiesMock = jest.fn().mockReturnValue({ x: 42 } as PropertyValues);
    const flushSandbox = createMockSandbox({
      flushDirtyProperties: flushDirtyPropertiesMock as (key: string) => PropertyValues | null,
    });
    const sessionWithFlush = createMockSession(flushSandbox, { slots: session.slots });

    const scene = createMockScene(entityId, [
      { scriptId: 'test-script', enabled: true, properties: { x: 0 } },
    ]);

    runPostRender.execute(sessionWithFlush, { scene, dt: 0.016 });

    expect(flushDirtyPropertiesMock).toHaveBeenCalledWith('e1::test-script');
    expect(slot.properties.x).toBe(42);

    const scriptComp = scene.entities.get(entityId)?.components.get('script') as
      | { scripts: Array<{ properties: Record<string, unknown> }> }
      | undefined;
    const firstScript = scriptComp?.scripts?.[0];
    expect(firstScript?.properties.x).toBe(42);
  });
});
