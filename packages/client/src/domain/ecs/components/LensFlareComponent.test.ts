import { Entity } from '../core/Entity';
import { LensFlareComponent } from './LensFlareComponent';

class Observer { calls=0; onComponentChanged(){ this.calls++; } }

describe('LensFlareComponent', () => {
  test('construction sets defaults', () => {
    const comp = new LensFlareComponent({ intensity:1, color:[1,0.5,0.2], flareElements:[{ size:1, distance:0.5, opacity:0.8 }] });
    expect(comp.intensity).toBe(1);
    expect(comp.color).toEqual([1,0.5,0.2]);
    expect(comp.flareElements.length).toBe(1);
    expect(comp.occlusionEnabled).toBe(true);
  });

  test('uniqueness enforced', () => {
    const e = new Entity('E');
    e.addComponent(new LensFlareComponent({ intensity:1, color:[1,1,1], flareElements:[] }));
    expect(() => e.addComponent(new LensFlareComponent({ intensity:2, color:[0,0,0], flareElements:[] }))).toThrow(/already exists/);
  });
});
