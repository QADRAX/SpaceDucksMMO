import { Entity } from '../core/Entity';
import { OrbitComponent } from './OrbitComponent';

class Observer { calls=0; onComponentChanged(){ this.calls++; } }

describe('OrbitComponent', () => {
  test('updateAngle increments angle', () => {
    const comp = new OrbitComponent({ targetEntityId:'T', altitudeFromSurface:1, speed:Math.PI, orbitPlane:'xz' });
    comp.updateAngle(0.5); // angle += PI*0.5
    expect(comp.angle).toBeCloseTo(Math.PI/2);
  });

  test('unique enforcement', () => {
    const e = new Entity('E');
    e.addComponent(new OrbitComponent({ targetEntityId:'T', altitudeFromSurface:1, speed:1 }));
    expect(() => e.addComponent(new OrbitComponent({ targetEntityId:'T', altitudeFromSurface:2, speed:2 }))).toThrow(/already exists/);
  });
});
