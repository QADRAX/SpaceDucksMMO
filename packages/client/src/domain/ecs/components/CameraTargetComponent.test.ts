import { Entity } from '../core/Entity';
import { CameraTargetComponent } from './CameraTargetComponent';
import { CameraViewComponent } from './CameraViewComponent';

class Observer { calls=0; onComponentChanged(){ this.calls++; } }

describe('CameraTargetComponent', () => {
  test('setTarget notifies observer', () => {
    const comp = new CameraTargetComponent({ targetEntityId: 'A' });
    const obs = new Observer();
    comp.addObserver(obs);
    const cam = new Entity('cam');
    cam.addComponent(new CameraViewComponent({})); // required
    cam.addComponent(comp);
    comp.setTarget('B');
    expect(comp.targetEntityId).toBe('B');
    expect(obs.calls).toBe(1);
  });

  test('requires cameraView enforced', () => {
    const comp = new CameraTargetComponent({ targetEntityId: 'A' });
    const cam = new Entity('cam');
    expect(() => cam.addComponent(comp)).toThrow(/requires 'cameraView'/);
  });
});
