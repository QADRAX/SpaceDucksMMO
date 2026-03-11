import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupIntegrationTest, createSceneId, createUISlotId } from '../setup';
import type { TestContext } from '../setup';

describe('Integration: Scene > UI slots', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = setupIntegrationTest();
    ctx.api.addScene({ sceneId: createSceneId('main') });
  });

  it('should add a UI slot to the scene', () => {
    const result = ctx.api.scene(createSceneId('main')).addUISlot({
      slotId: createUISlotId('hud'),
      rect: { x: 0, y: 0, w: 1, h: 0.1 },
      descriptor: { componentId: 'HUD' },
    });

    expect(result.ok).toBe(true);
    const scene = ctx.engine.scenes.get(createSceneId('main'));
    expect(scene?.uiSlots.has(createUISlotId('hud'))).toBe(true);
    expect(scene?.uiSlots.get(createUISlotId('hud'))?.descriptor).toEqual({
      componentId: 'HUD',
    });
  });

  it('should reject duplicate slot id', () => {
    ctx.api.scene(createSceneId('main')).addUISlot({
      slotId: createUISlotId('hud'),
      descriptor: {},
    });

    const result = ctx.api.scene(createSceneId('main')).addUISlot({
      slotId: createUISlotId('hud'),
      descriptor: {},
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('validation');
    }
  });

  it('should remove a UI slot', () => {
    ctx.api.scene(createSceneId('main')).addUISlot({
      slotId: createUISlotId('hud'),
      descriptor: {},
    });

    const result = ctx.api.scene(createSceneId('main')).removeUISlot({
      slotId: createUISlotId('hud'),
    });

    expect(result.ok).toBe(true);
    expect(ctx.engine.scenes.get(createSceneId('main'))?.uiSlots.has(createUISlotId('hud'))).toBe(
      false,
    );
  });

  it('should reject remove of non-existent slot', () => {
    const result = ctx.api.scene(createSceneId('main')).removeUISlot({
      slotId: createUISlotId('missing'),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('not-found');
    }
  });

  it('should update a UI slot', () => {
    ctx.api.scene(createSceneId('main')).addUISlot({
      slotId: createUISlotId('hud'),
      rect: { x: 0, y: 0, w: 1, h: 0.1 },
      zIndex: 0,
      descriptor: { a: 1 },
    });

    const result = ctx.api.scene(createSceneId('main')).updateUISlot({
      slotId: createUISlotId('hud'),
      rect: { h: 0.2 },
      zIndex: 10,
      descriptor: { a: 2 },
    });

    expect(result.ok).toBe(true);
    const slot = ctx.engine.scenes.get(createSceneId('main'))?.uiSlots.get(createUISlotId('hud'));
    expect(slot?.rect.h).toBe(0.2);
    expect(slot?.zIndex).toBe(10);
    expect(slot?.descriptor).toEqual({ a: 2 });
  });
});
