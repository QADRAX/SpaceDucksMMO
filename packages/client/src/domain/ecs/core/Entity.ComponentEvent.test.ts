import { Entity, ComponentEvent, ComponentEventAction } from './Entity';
import { BoxGeometryComponent } from '../components/geometry/BoxGeometryComponent';

describe('Entity component events (typed)', () => {
  it('emits ComponentEvent on add and remove and listener receives typed events', () => {
    const e = new Entity('evt1');
    const received: Array<{ action: ComponentEventAction; componentType: string }> = [];

    const listener = (ev: ComponentEvent) => {
      received.push({ action: ev.action, componentType: ev.component.type });
    };

    e.addComponentListener(listener);

    const geom = new BoxGeometryComponent({ width: 1, height: 1, depth: 1 });
    e.addComponent(geom as any);

    expect(received.length).toBe(1);
    expect(received[0].action).toBe('added');
    expect(received[0].componentType).toBe('boxGeometry');

    e.removeComponent('boxGeometry');

    expect(received.length).toBe(2);
    expect(received[1].action).toBe('removed');
    expect(received[1].componentType).toBe('boxGeometry');

    e.removeComponentListener(listener);
  });
});
