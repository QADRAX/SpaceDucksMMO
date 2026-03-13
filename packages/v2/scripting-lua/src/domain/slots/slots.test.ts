import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createEntity, createComponent, createEntityId } from '@duckengine/core-v2';
import type { SceneState } from '@duckengine/core-v2';
import {
  createScriptSlot,
  slotKey,
  syncSlotPropertiesFromScene,
} from './slots';
import type { ScriptSandbox } from '../ports';

describe('slots', () => {
  describe('createScriptSlot', () => {
    it('creates slot with entityId, scriptId, and properties', () => {
      const entityId = createEntityId('e1');
      const slot = createScriptSlot(
        entityId,
        'test-script',
        { speed: 5 },
        ['init', 'update'],
      );
      expect(slot.entityId).toBe(entityId);
      expect(slot.scriptId).toBe('test-script');
      expect(slot.enabled).toBe(true);
      expect(slot.properties).toEqual({ speed: 5 });
      expect(slot.dirtyKeys.size).toBe(0);
      expect(slot.declaredHooks).toEqual(new Set(['init', 'update']));
      expect(slot.sandboxHandle).toBeUndefined();
    });

    it('copies properties to avoid shared mutation', () => {
      const props = { x: 1 };
      const slot = createScriptSlot(
        createEntityId('e1'),
        's1',
        props,
        [],
      );
      expect(slot.properties).not.toBe(props);
      expect(slot.properties).toEqual(props);
    });
  });

  describe('slotKey', () => {
    it('returns entityId::scriptId format', () => {
      expect(slotKey(createEntityId('e1'), 'ai/patrol')).toBe('e1::ai/patrol');
    });

    it('is deterministic for same inputs', () => {
      const k1 = slotKey(createEntityId('e1'), 's1');
      const k2 = slotKey(createEntityId('e1'), 's1');
      expect(k1).toBe(k2);
    });
  });

  describe('syncSlotPropertiesFromScene', () => {
    let scene: SceneState;
    let sandbox: jest.Mocked<ScriptSandbox>;

    beforeEach(() => {
      const entityId = createEntityId('e1');
      const entity = createEntity(entityId);
      entity.components.set('script', createComponent('script', {
        scripts: [{
          scriptId: 'test-script',
          enabled: true,
          properties: { speed: 10, label: 'fast' },
        }],
      }));

      scene = {
        entities: new Map([[entityId, entity]]),
      } as unknown as SceneState;

      sandbox = {
        syncProperties: jest.fn(),
        callHook: jest.fn().mockReturnValue(true),
      } as unknown as jest.Mocked<ScriptSandbox>;
    });

    it('syncs changed properties from ECS to slot and calls syncProperties', () => {
      const slot = createScriptSlot(
        createEntityId('e1'),
        'test-script',
        { speed: 5 },
        ['onPropertyChanged'],
      );
      slot.sandboxHandle = 'e1::test-script';

      syncSlotPropertiesFromScene(scene, slot, sandbox);

      expect(slot.properties.speed).toBe(10);
      expect(slot.properties.label).toBe('fast');
      expect(sandbox.syncProperties).toHaveBeenCalledWith(
        'e1::test-script',
        slot.properties,
      );
      expect(sandbox.callHook).toHaveBeenCalledWith(
        'e1::test-script',
        'onPropertyChanged',
        0,
        'speed',
        10,
      );
      expect(sandbox.callHook).toHaveBeenCalledWith(
        'e1::test-script',
        'onPropertyChanged',
        0,
        'label',
        'fast',
      );
    });

    it('does nothing when no properties changed', () => {
      const slot = createScriptSlot(
        createEntityId('e1'),
        'test-script',
        { speed: 10, label: 'fast' },
        [],
      );
      slot.sandboxHandle = 'e1::test-script';

      syncSlotPropertiesFromScene(scene, slot, sandbox);

      expect(sandbox.syncProperties).not.toHaveBeenCalled();
      expect(sandbox.callHook).not.toHaveBeenCalled();
    });

    it('does nothing when entity not in scene', () => {
      const slot = createScriptSlot(
        createEntityId('e99'),
        'test-script',
        {},
        [],
      );
      slot.sandboxHandle = 'e99::test-script';

      syncSlotPropertiesFromScene(scene, slot, sandbox);

      expect(sandbox.syncProperties).not.toHaveBeenCalled();
    });

    it('does nothing when script ref not found', () => {
      const entityId = createEntityId('e1');
      const entity = createEntity(entityId);
      entity.components.set('script', createComponent('script', {
        scripts: [{ scriptId: 'other-script', enabled: true, properties: {} }],
      }));
      const scene2 = { entities: new Map([[entityId, entity]]) } as unknown as SceneState;

      const slot = createScriptSlot(entityId, 'test-script', {}, []);
      slot.sandboxHandle = 'e1::test-script';

      syncSlotPropertiesFromScene(scene2, slot, sandbox);

      expect(sandbox.syncProperties).not.toHaveBeenCalled();
    });
  });
});
