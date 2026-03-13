import { Entity } from '../core/Entity';
import { OrbitComponent } from './OrbitComponent';

class Observer { calls=0; onComponentChanged(){ this.calls++; } }

describe('OrbitComponent', () => {
  test('unique enforcement', () => {
    const e = new Entity('E');
    e.addComponent(new OrbitComponent({ targetEntityId:'T', altitudeFromSurface:1, speed:1 }));
    expect(() => e.addComponent(new OrbitComponent({ targetEntityId:'T', altitudeFromSurface:2, speed:2 }))).toThrow(/already exists/);
  });
});
