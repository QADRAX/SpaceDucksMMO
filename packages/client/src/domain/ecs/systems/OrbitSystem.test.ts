import { Entity } from '../core/Entity';
import { SphereGeometryComponent } from '../components/SphereGeometryComponent';
import { BoxGeometryComponent } from '../components/BoxGeometryComponent';
import { OrbitComponent } from '../components/OrbitComponent';
import { OrbitSystem } from './OrbitSystem';

function makeEntities() {
  const entities = new Map<string, Entity>();
  return entities;
}

describe('OrbitSystem', () => {
  test('updates position on xz plane around sphere target', () => {
    const entities = makeEntities();
    const target = new Entity('target');
    target.addComponent(new SphereGeometryComponent({ radius: 5 }));
    entities.set(target.id, target);
    const orbiter = new Entity('orbiter');
    orbiter.addComponent(new OrbitComponent({ targetEntityId: 'target', altitudeFromSurface: 2, speed: Math.PI, orbitPlane: 'xz' }));
    entities.set(orbiter.id, orbiter);
    const system = new OrbitSystem(entities);
    // Initial update: angle advanced by dt, position set
    system.update(0.5); // angle = PI * 0.5 = PI/2 -> cos=0, sin=1
    const tp = target.transform.worldPosition;
    const expectedDistance = 5 + 2; // radius + altitude
    expect(Math.round(orbiter.transform.worldPosition.x)).toBe(Math.round(tp.x + 0));
    expect(Math.round(orbiter.transform.worldPosition.z)).toBe(Math.round(tp.z + expectedDistance));
    // Further update to complete full orbit
    system.update(0.5); // angle PI -> cos=-1 sin ~0
    expect(Math.round(orbiter.transform.worldPosition.x)).toBe(Math.round(tp.x - expectedDistance));
  });

  test('box geometry radius uses diagonal/2', () => {
    const entities = makeEntities();
    const target = new Entity('target');
    target.addComponent(new BoxGeometryComponent({ width: 4, height: 3, depth: 12 }));
    entities.set(target.id, target);
    const orbiter = new Entity('orbiter');
    orbiter.addComponent(new OrbitComponent({ targetEntityId: 'target', altitudeFromSurface: 0, speed: 1, orbitPlane: 'xy' }));
    entities.set(orbiter.id, orbiter);
    const system = new OrbitSystem(entities);
    system.update(0); // angle stays 0
    const diag = Math.sqrt(4*4 + 3*3 + 12*12) / 2;
    // xy plane => x = center + cos(0)*diag, y = center + sin(0)*diag (=0)
    expect(orbiter.transform.worldPosition.x).toBeCloseTo(target.transform.worldPosition.x + diag, 5);
    expect(orbiter.transform.worldPosition.y).toBeCloseTo(target.transform.worldPosition.y + 0, 5);
  });

  test('different planes yz produce expected coordinates', () => {
    const entities = makeEntities();
    const target = new Entity('t');
    entities.set(target.id, target);
    const orbiter = new Entity('o');
    orbiter.addComponent(new OrbitComponent({ targetEntityId: 't', altitudeFromSurface: 1, speed: Math.PI/2, orbitPlane: 'yz' }));
    entities.set(orbiter.id, orbiter);
    const system = new OrbitSystem(entities);
    system.update(1); // angle += PI/2 => cos=0 sin=1
    const dist = 1 + 1; // targetRadius default 1 + altitude
    expect(Math.round(orbiter.transform.worldPosition.y)).toBe(Math.round(target.transform.worldPosition.y + 0));
    expect(Math.round(orbiter.transform.worldPosition.z)).toBe(Math.round(target.transform.worldPosition.z + dist));
  });
});
