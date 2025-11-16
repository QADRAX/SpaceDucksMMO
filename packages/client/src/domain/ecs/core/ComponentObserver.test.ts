import { Component } from './Component';
import { ComponentMetadata } from './ComponentMetadata';
import IComponentObserver from './IComponentObserver';
import { Entity } from './Entity';

class ObservableTestComponent extends Component {
  constructor() { super(); }
  readonly type = 'ObservableTest';
  readonly metadata: ComponentMetadata = { type: 'ObservableTest' };
  mutate() { this.notifyChanged(); }
}

class TestObserver implements IComponentObserver {
  calls: Array<{entityId: string; componentType: string}> = [];
  onComponentChanged(entityId: string, componentType: string): void {
    this.calls.push({ entityId, componentType });
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
});
