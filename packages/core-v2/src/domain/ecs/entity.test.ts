import {
  createEntity,
  addComponent,
  removeComponent,
  getComponent,
  hasComponent,
  getAllComponents,
  updateComponent,
  setComponentEnabled,
  setDisplayName,
  setGizmoIcon,
  setDebugEnabled,
  isDebugEnabled,
  getEnabledDebugs,
  addChild,
  removeChildById,
  getChild,
  getChildren,
} from './entity';
import type {  ComponentBase  } from './types';
import { componentBase } from './component';
import type {  ComponentMetadata  } from '../types/../components';
import type {  ComponentType  } from '../types/../components';

function mockMetadata(
  type: ComponentType,
  overrides: Partial<ComponentMetadata> = {},
): ComponentMetadata {
  return { type, unique: true, ...overrides };
}

function mockComponent(
  type: ComponentType,
  metaOverrides: Partial<ComponentMetadata> = {},
): ComponentBase {
  return componentBase(type, mockMetadata(type, metaOverrides));
}

describe('createEntity', () => {
  it('creates entity with id and default display name', () => {
    const e = createEntity('e1');
    expect(e.id).toBe('e1');
    expect(e.displayName).toBe('e1');
    expect(e.components.size).toBe(0);
    expect(e.parent).toBeUndefined();
  });

  it('accepts custom display name', () => {
    const e = createEntity('e1', 'Player');
    expect(e.displayName).toBe('Player');
  });
});

describe('addComponent / removeComponent', () => {
  it('adds and retrieves a component', () => {
    const e = createEntity('e1');
    const comp = mockComponent('boxGeometry');
    const r = addComponent(e, comp);
    expect(r.ok).toBe(true);
    expect(hasComponent(e, 'boxGeometry')).toBe(true);
    expect(getComponent(e, 'boxGeometry')).toBe(comp);
  });

  it('rejects duplicate unique component', () => {
    const e = createEntity('e1');
    addComponent(e, mockComponent('boxGeometry'));
    const r = addComponent(e, mockComponent('boxGeometry'));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('validation');
  });

  it('removes a component', () => {
    const e = createEntity('e1');
    addComponent(e, mockComponent('boxGeometry'));
    const r = removeComponent(e, 'boxGeometry');
    expect(r.ok).toBe(true);
    expect(hasComponent(e, 'boxGeometry')).toBe(false);
  });

  it('returns err when removing absent component', () => {
    const e = createEntity('e1');
    const r = removeComponent(e, 'boxGeometry');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('not-found');
  });

  it('getAllComponents returns all', () => {
    const e = createEntity('e1');
    addComponent(e, mockComponent('boxGeometry'));
    addComponent(e, mockComponent('name'));
    expect(getAllComponents(e)).toHaveLength(2);
  });
});

describe('validation rules', () => {
  it('requires — rejects when dependency missing', () => {
    const e = createEntity('e1');
    const mat = mockComponent('standardMaterial', { requires: ['boxGeometry'] });
    const r = addComponent(e, mat);
    expect(r.ok).toBe(false);
  });

  it('requires — allows when dependency present', () => {
    const e = createEntity('e1');
    addComponent(e, mockComponent('boxGeometry'));
    const mat = mockComponent('standardMaterial', { requires: ['boxGeometry'] });
    expect(addComponent(e, mat).ok).toBe(true);
  });

  it('requires "geometry" wildcard matches any geometry', () => {
    const e = createEntity('e1');
    addComponent(e, mockComponent('sphereGeometry'));
    const mat = mockComponent('standardMaterial', { requires: ['geometry'] });
    expect(addComponent(e, mat).ok).toBe(true);
  });

  it('conflicts — rejects when conflicting component exists', () => {
    const e = createEntity('e1');
    addComponent(e, mockComponent('ambientLight'));
    const spot = mockComponent('spotLight', { conflicts: ['ambientLight'] });
    expect(addComponent(e, spot).ok).toBe(false);
  });

  it('remove — blocks when other component depends on it', () => {
    const e = createEntity('e1');
    addComponent(e, mockComponent('boxGeometry'));
    addComponent(e, mockComponent('standardMaterial', { requires: ['boxGeometry'] }));
    const r = removeComponent(e, 'boxGeometry');
    expect(r.ok).toBe(false);
  });

  it('requiresInHierarchy — finds on parent', () => {
    const parent = createEntity('p');
    const child = createEntity('c');
    addChild(parent, child);
    addComponent(parent, mockComponent('rigidBody'));
    const collider = mockComponent('boxCollider', {
      requiresInHierarchy: ['rigidBody'],
    });
    expect(addComponent(child, collider).ok).toBe(true);
  });

  it('requiresInHierarchy — rejects when absent everywhere', () => {
    const e = createEntity('e1');
    const collider = mockComponent('boxCollider', {
      requiresInHierarchy: ['rigidBody'],
    });
    expect(addComponent(e, collider).ok).toBe(false);
  });
});

describe('updateComponent / setComponentEnabled', () => {
  it('mutates component via updater', () => {
    const e = createEntity('e1');
    const comp = { ...mockComponent('boxGeometry'), width: 1 } as ComponentBase & { width: number };
    addComponent(e, comp);

    const r = updateComponent<ComponentBase & { width: number }>(e, 'boxGeometry', (c) => {
      c.width = 5;
    });
    expect(r.ok).toBe(true);
    const updated = getComponent<ComponentBase & { width: number }>(e, 'boxGeometry');
    expect(updated?.width).toBe(5);
  });

  it('toggles enabled flag', () => {
    const e = createEntity('e1');
    addComponent(e, mockComponent('boxGeometry'));
    setComponentEnabled(e, 'boxGeometry', false);
    expect(getComponent(e, 'boxGeometry')?.enabled).toBe(false);
  });
});

describe('observers', () => {
  it('fires add/remove events', () => {
    const e = createEntity('e1');
    const events: string[] = [];
    e.observers.addComponentListener((ev) => events.push(ev.action));
    addComponent(e, mockComponent('boxGeometry'));
    removeComponent(e, 'boxGeometry');
    expect(events).toEqual(['added', 'removed']);
  });

  it('fires change events on updateComponent', () => {
    const e = createEntity('e1');
    addComponent(e, mockComponent('boxGeometry'));
    let changed = false;
    e.observers.addChangeListener(() => {
      changed = true;
    });
    updateComponent(e, 'boxGeometry', () => {});
    expect(changed).toBe(true);
  });

  it('fires presentation events', () => {
    const e = createEntity('e1');
    let fired = false;
    e.observers.addPresentationListener(() => {
      fired = true;
    });
    setDisplayName(e, 'New Name');
    expect(fired).toBe(true);
    expect(e.displayName).toBe('New Name');
  });

  it('fires debug events', () => {
    const e = createEntity('e1');
    const log: [string, boolean][] = [];
    e.observers.addDebugListener((_id, kind, on) => log.push([kind, on]));
    setDebugEnabled(e, 'collider', true);
    setDebugEnabled(e, 'collider', false);
    expect(log).toEqual([
      ['collider', true],
      ['collider', false],
    ]);
  });
});

describe('debug flags', () => {
  it('defaults to false', () => {
    const e = createEntity('e1');
    expect(isDebugEnabled(e, 'transform')).toBe(false);
  });

  it('getEnabledDebugs returns enabled kinds', () => {
    const e = createEntity('e1');
    setDebugEnabled(e, 'mesh', true);
    setDebugEnabled(e, 'collider', true);
    expect(getEnabledDebugs(e)).toEqual(expect.arrayContaining(['mesh', 'collider']));
  });
});

describe('hierarchy', () => {
  it('addChild sets parent and transform parent', () => {
    const p = createEntity('parent');
    const c = createEntity('child');
    addChild(p, c);
    expect(c.parent).toBe(p);
    expect(getChildren(p)).toHaveLength(1);
    expect(c.transform.parent).toBe(p.transform);
  });

  it('reparent removes from old parent', () => {
    const p1 = createEntity('p1');
    const p2 = createEntity('p2');
    const c = createEntity('child');
    addChild(p1, c);
    addChild(p2, c);
    expect(getChildren(p1)).toHaveLength(0);
    expect(getChildren(p2)).toHaveLength(1);
    expect(c.parent).toBe(p2);
  });

  it('removeChildById clears parent', () => {
    const p = createEntity('p');
    const c = createEntity('c');
    addChild(p, c);
    removeChildById(p, 'c');
    expect(c.parent).toBeUndefined();
    expect(c.transform.parent).toBeUndefined();
  });

  it('getChild finds direct child', () => {
    const p = createEntity('p');
    const c = createEntity('c');
    addChild(p, c);
    expect(getChild(p, 'c')).toBe(c);
    expect(getChild(p, 'missing')).toBeUndefined();
  });
});

describe('gizmo icon', () => {
  it('sets and fires presentation event', () => {
    const e = createEntity('e1');
    let fired = false;
    e.observers.addPresentationListener(() => {
      fired = true;
    });
    setGizmoIcon(e, 'Box');
    expect(e.gizmoIcon).toBe('Box');
    expect(fired).toBe(true);
  });
});
