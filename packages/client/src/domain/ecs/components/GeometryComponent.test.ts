import { Entity } from '../core/Entity';
import { GeometryComponent } from './GeometryComponent';

class Observer { calls:number=0; onComponentChanged(){ this.calls++; } }

describe('GeometryComponent', () => {
  test('parameter mutation notifies observers', () => {
    const comp = new GeometryComponent({ type:'sphere', radius:2 });
    const obs = new Observer();
    comp.addObserver(obs);
    const e = new Entity('E');
    e.addComponent(comp);
    comp.parameters = { type:'box', width:2, height:2, depth:2 };
    expect(obs.calls).toBe(1);
  });

  test('conflicts metadata prevents adding conflicting component when geometry present', () => {
    const e = new Entity('E');
    e.addComponent(new GeometryComponent({ type:'sphere', radius:1 }));
    // Independent component with metadata declaring conflict with geometry
    class SkyboxComponent extends GeometryComponent { constructor(){ super({ type:'custom', key:'sky' }); } }
    // Cannot override type safely due to class design; simulate conflict using a wrapper component instead
    const conflicting = new (class extends GeometryComponent { constructor(){ super({ type:'sphere', radius:1 }); } readonly metadata={ type:'geometry', conflicts:['geometry'] }; })();
    expect(() => e.addComponent(conflicting as any)).toThrow(/conflicts with existing 'geometry'/);
  });
});
