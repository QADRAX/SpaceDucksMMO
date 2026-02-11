import { BoxGeometryComponent } from './BoxGeometryComponent';
import { CylinderGeometryComponent } from './CylinderGeometryComponent';
import { ConeGeometryComponent } from './ConeGeometryComponent';
import { TorusGeometryComponent } from './TorusGeometryComponent';
import SphereGeometryComponent from './SphereGeometryComponent';
import PlaneGeometryComponent from './PlaneGeometryComponent';
import CustomGeometryComponent from './CustomGeometryComponent';
import Entity from '../../core/Entity';
import BasicMaterialComponent from '../material/BasicMaterialComponent';

describe('Geometry components bounding radius', () => {
  test('BoxGeometryComponent diagonal/2 scaled', () => {
    const box = new BoxGeometryComponent({ width: 4, height: 3, depth: 12 });
    const diag = Math.sqrt(4*4 + 3*3 + 12*12) / 2;
    expect(box.getBoundingRadius({ x: 1, y: 1, z: 1 })).toBeCloseTo(diag, 8);
    expect(box.getBoundingRadius({ x: 2, y: 1, z: 1 })).toBeCloseTo(diag * 2, 8);
  });

  test('SphereGeometryComponent radius scaled', () => {
    const s = new SphereGeometryComponent({ radius: 5 });
    expect(s.getBoundingRadius({ x: 1, y: 1, z: 1 })).toBeCloseTo(5, 8);
    expect(s.getBoundingRadius({ x: 2, y: 1, z: 1 })).toBeCloseTo(10, 8);
  });

  test('PlaneGeometryComponent diagonal/2', () => {
    const p = new PlaneGeometryComponent({ width: 4, height: 2 });
    const diag = Math.sqrt(4*4 + 2*2) / 2;
    expect(p.getBoundingRadius({ x: 1, y: 1, z: 1 })).toBeCloseTo(diag, 8);
  });

  test('CylinderGeometryComponent approximated radius', () => {
    const c = new CylinderGeometryComponent({ radiusTop: 2, radiusBottom: 3, height: 4 });
    const maxR = Math.max(2,3);
    const expected = Math.sqrt(maxR*maxR + (4/2)*(4/2));
    expect(c.getBoundingRadius({ x:1,y:1,z:1 })).toBeCloseTo(expected, 8);
  });

  test('ConeGeometryComponent radius fallback', () => {
    const co = new ConeGeometryComponent({ radius: 2, height: 4 });
    expect(co.getBoundingRadius({ x:1,y:1,z:1 })).toBeCloseTo(2, 8);
  });

  test('TorusGeometryComponent outer radius', () => {
    const t = new TorusGeometryComponent({ radius: 3, tube: 1 });
    expect(t.getBoundingRadius({ x:1,y:1,z:1 })).toBeCloseTo(4, 8);
  });

  test('CustomGeometryComponent fallback radius', () => {
    const u = new CustomGeometryComponent({ key: 'foo' });
    expect(u.getBoundingRadius({ x:1,y:1,z:1 })).toBeCloseTo(1, 8);
    expect(u.getBoundingRadius({ x:2,y:1,z:1 })).toBeCloseTo(2, 8);
  });

  test('CustomGeometryComponent bounding radius override', () => {
    const u = new CustomGeometryComponent({ key: 'foo', boundingRadius: 3.5 });
    expect(u.getBoundingRadius({ x:1,y:1,z:1 })).toBeCloseTo(3.5, 8);
    expect(u.getBoundingRadius({ x:2,y:1,z:1 })).toBeCloseTo(7, 8);
  });
});

describe('Entity geometry removal protection', () => {
  test('cannot remove geometry when another component requires geometry', () => {
    const e = new Entity('E');
    const box = new BoxGeometryComponent({ width:1, height:1, depth:1 });
    e.addComponent(box);
    const mat = new BasicMaterialComponent({ color: '#fff' });
    // MaterialComponent requires geometry; adding it should succeed
    e.addComponent(mat);
    // Removing the geometry should throw because material requires it
    expect(() => e.removeComponent(box.type)).toThrow(/requires 'geometry'/);
  });
});
