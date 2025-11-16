import { Entity } from './Entity';
import { Component } from './Component';
import { ComponentMetadata } from './ComponentMetadata';

class BaseTestComponent extends Component {
  constructor(public readonly type: string, public readonly metadata: ComponentMetadata) { super(); }
  triggerChange() { this.notifyChanged(); }
}

describe('Entity component validation', () => {
  test('unique component cannot be added twice', () => {
    const e = new Entity('E1');
    const UniqueA = new BaseTestComponent('UniqueA', { type: 'UniqueA', unique: true });
    e.addComponent(UniqueA);
    expect(() => e.addComponent(new BaseTestComponent('UniqueA', { type: 'UniqueA', unique: true }))).toThrow(/already exists/);
  });

  test('requires prevents addition without dependency', () => {
    const e = new Entity('E1');
    const RequiresB = new BaseTestComponent('RequiresB', { type: 'RequiresB', requires: ['DepB'] });
    expect(() => e.addComponent(RequiresB)).toThrow(/requires 'DepB'/);
    e.addComponent(new BaseTestComponent('DepB', { type: 'DepB' }));
    expect(() => e.addComponent(RequiresB)).not.toThrow();
  });

  test('conflicts prevents addition when conflicting component exists', () => {
    const e = new Entity('E1');
    e.addComponent(new BaseTestComponent('A', { type: 'A' }));
    const ConflictsA = new BaseTestComponent('ConflictsA', { type: 'ConflictsA', conflicts: ['A'] });
    expect(() => e.addComponent(ConflictsA)).toThrow(/conflicts with existing 'A'/);
  });

  test('cannot remove component required by another', () => {
    const e = new Entity('E1');
    const DepB = new BaseTestComponent('DepB', { type: 'DepB' });
    const RequiresB = new BaseTestComponent('RequiresB', { type: 'RequiresB', requires: ['DepB'] });
    e.addComponent(DepB).addComponent(RequiresB);
    expect(() => e.removeComponent('DepB')).toThrow(/requires 'DepB'/);
  });

  test('removal succeeds when no dependency', () => {
    const e = new Entity('E1');
    e.addComponent(new BaseTestComponent('X', { type: 'X' }));
    expect(() => e.removeComponent('X')).not.toThrow();
    expect(e.hasComponent('X')).toBe(false);
  });

  test('Entity.update skips disabled components', () => {
    const e = new Entity('E2');
    let called = 0;
    class UpComp extends Component {
      readonly type = 'up';
      readonly metadata = { type: 'up' } as any;
      update(dt: number) { called += 1; }
    }
    const c = new UpComp();
    e.addComponent(c as any);
    e.update(0.016);
    expect(called).toBe(1);
    c.enabled = false;
    e.update(0.016);
    expect(called).toBe(1);
  });
});
