import { describe, it, expect } from '@jest/globals';
import { createEntity, createComponent, createEntityId } from '@duckengine/core-v2';
import type { SceneState } from '@duckengine/core-v2';
import { createComponentAccessorPair } from './createComponentAccessorPair';

function minimalScene(entities: Map<ReturnType<typeof createEntityId>, ReturnType<typeof createEntity>>): SceneState {
  return { entities } as unknown as SceneState;
}

describe('createComponentAccessorPair', () => {
  it('returns getter that reads component field', () => {
    const entityId = createEntityId('e1');
    const entity = createEntity(entityId);
    const scriptComp = createComponent('script', {
      scripts: [{ scriptId: 'test', enabled: true, properties: { foo: 'bar' } }],
    });
    entity.components.set('script', scriptComp);

    const scene = minimalScene(new Map([[entityId, entity]]));

    const { getter } = createComponentAccessorPair(scene);
    const scripts = getter<Array<{ properties: { foo: string } }>>(entityId, 'script', 'scripts');
    expect(scripts).toBeDefined();
    expect(Array.isArray(scripts)).toBe(true);
    const firstScript = scripts?.[0];
    expect(firstScript?.properties.foo).toBe('bar');
  });

  it('returns undefined when scene is null', () => {
    const { getter } = createComponentAccessorPair(null);
    expect(getter(createEntityId('e1'), 'script', 'scripts')).toBeUndefined();
  });

  it('returns undefined when entity not in scene', () => {
    const scene = minimalScene(new Map());
    const { getter } = createComponentAccessorPair(scene);
    expect(getter(createEntityId('e1'), 'script', 'scripts')).toBeUndefined();
  });

  it('setter updates component and fires component-changed', () => {
    const entityId = createEntityId('e1');
    const entity = createEntity(entityId);
    const scriptComp = createComponent('script', {
      scripts: [{ scriptId: 'test', enabled: true, properties: {} }],
    });
    entity.components.set('script', scriptComp);

    const fireSpy = jest.spyOn(entity.observers, 'fireComponentChanged');

    const scene = minimalScene(new Map([[entityId, entity]]));

    const { setter } = createComponentAccessorPair(scene);
    const newScripts = [{ scriptId: 'test', enabled: true, properties: { x: 1 } }];
    setter(entityId, 'script', 'scripts', newScripts);

    expect((scriptComp as { scripts: unknown[] }).scripts).toBe(newScripts);
    expect(fireSpy).toHaveBeenCalledWith(entityId, 'script');
  });

  it('setter no-ops when scene is null', () => {
    const { setter } = createComponentAccessorPair(null);
    expect(() => setter(createEntityId('e1'), 'script', 'scripts', [])).not.toThrow();
  });
});
