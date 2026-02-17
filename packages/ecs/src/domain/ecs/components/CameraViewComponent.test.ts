import { Entity } from '../core/Entity';
import { CameraViewComponent } from './CameraViewComponent';
import type { ComponentType } from '../core/ComponentType';

class Observer {
  calls = 0;
  onComponentChanged() { this.calls++; }
  onComponentRemoved(entityId: string, componentType: ComponentType): void { }
}

describe('CameraViewComponent', () => {
  test('defaults and setFov notify', () => {
    const comp = new CameraViewComponent({});
    expect(comp.fov).toBe(60);
    expect(comp.near).toBeCloseTo(0.1);
    expect(comp.far).toBe(1000);
    expect(comp.aspect).toBe(1);
    const obs = new Observer();
    comp.addObserver(obs);
    const e = new Entity('E');
    e.addComponent(comp);
    comp.setFov(75);
    expect(comp.fov).toBe(75);
    expect(obs.calls).toBe(1);
  });
});
