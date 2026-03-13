import { Component } from './Component';
import { ComponentMetadata } from './ComponentMetadata';
import IComponentObserver from './IComponentObserver';
import { Entity } from './Entity';
import type { ComponentType } from './ComponentType';

class ObservableTestComponent extends Component {
  constructor() { super(); }
  readonly type = 'ObservableTest' as ComponentType;
  readonly metadata: ComponentMetadata = { type: 'ObservableTest' };
  mutate() { this.notifyChanged(); }
}

class TestObserver implements IComponentObserver {
  calls: Array<{ entityId: string; componentType: ComponentType }> = [];
  onComponentChanged(entityId: string, componentType: ComponentType): void {
    this.calls.push({ entityId, componentType });
  }
  onComponentRemoved(entityId: string, componentType: ComponentType): void {
    // Not tested in these specific tests
  }
}

describe('Component observer pattern', () => {
  test('observer receives change notifications', () => {
    const e = new Entity('E1');
    const comp = new ObservableTestComponent();
    const obs = new TestObserver();
    comp.addObserver(obs);
    e.addComponent(comp);
    comp.mutate();
    comp.mutate();
    expect(obs.calls.length).toBe(2);
    expect(obs.calls[0]).toEqual({ entityId: 'E1', componentType: 'ObservableTest' });
  });

  test('removeObserver prevents further notifications', () => {
    const e = new Entity('E1');
    const comp = new ObservableTestComponent();
    const obs = new TestObserver();
    comp.addObserver(obs);
    e.addComponent(comp);
    comp.mutate();
    comp.removeObserver(obs);
    comp.mutate();
    expect(obs.calls.length).toBe(1);
  });

  test('toggling enabled triggers notifications', () => {
    const e = new Entity('E2');
    const comp = new ObservableTestComponent();
    const obs = new TestObserver();
    comp.addObserver(obs);
    e.addComponent(comp);
    comp.enabled = false;
    comp.enabled = true;
    expect(obs.calls.length).toBe(2);
    expect(obs.calls[0]).toEqual({ entityId: 'E2', componentType: 'ObservableTest' });
  });
});
