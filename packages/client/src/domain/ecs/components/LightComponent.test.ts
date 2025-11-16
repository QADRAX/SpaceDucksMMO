import { Entity } from '../core/Entity';
import { LightComponent } from './LightComponent';

class Observer { calls=0; onComponentChanged(){ this.calls++; } }

describe('LightComponent', () => {
  test('params setter notifies', () => {
    const comp = new LightComponent({ type:'ambient', intensity:0.5 });
    const obs = new Observer(); comp.addObserver(obs);
    const e = new Entity('E'); e.addComponent(comp);
    comp.params = { type:'ambient', intensity:1 };
    expect(obs.calls).toBe(1);
    expect(comp.params.type).toBe('ambient');
    expect((comp.params as any).intensity).toBe(1);
  });

  test('setColor and setIntensity notify', () => {
    const comp = new LightComponent({ type:'point', intensity:2 });
    const obs = new Observer(); comp.addObserver(obs);
    const e = new Entity('E'); e.addComponent(comp);
    comp.setColor('#ff0000');
    comp.setIntensity(3);
    expect(obs.calls).toBe(2);
    expect((comp.params as any).color).toBe('#ff0000');
    expect((comp.params as any).intensity).toBe(3);
  });

  test('unique enforcement', () => {
    const e = new Entity('E');
    e.addComponent(new LightComponent({ type:'ambient' }));
    expect(() => e.addComponent(new LightComponent({ type:'ambient' }))).toThrow(/already exists/);
  });
});
