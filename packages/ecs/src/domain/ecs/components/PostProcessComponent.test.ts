import { Entity } from '../core/Entity';
import { PostProcessComponent } from './PostProcessComponent';
import { CameraViewComponent } from './CameraViewComponent';
import type { ComponentType } from '../core/ComponentType';

class Observer {
  calls = 0;
  onComponentChanged() { this.calls++; }
  onComponentRemoved(entityId: string, componentType: ComponentType): void { }
}

describe('PostProcessComponent', () => {
  test('requires cameraView enforced', () => {
    const e = new Entity('E');
    const pp = new PostProcessComponent([{ name: 'bloom', type: 'bloom', enabled: true }]);
    expect(() => e.addComponent(pp)).toThrow(/requires 'cameraView'/);
  });

  test('setEffects notifies observer', () => {
    const e = new Entity('E');
    e.addComponent(new CameraViewComponent({}));
    const pp = new PostProcessComponent([{ name: 'bloom', type: 'bloom', enabled: true }]);
    const obs = new Observer(); pp.addObserver(obs); e.addComponent(pp);
    pp.setEffects([{ name: 'fxaa', type: 'fxaa', enabled: true }]);
    expect(obs.calls).toBe(1);
    expect(pp.effects[0].name).toBe('fxaa');
  });
});
