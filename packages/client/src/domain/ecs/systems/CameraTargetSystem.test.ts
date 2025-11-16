import { Entity } from '../core/Entity';
import { CameraTargetComponent } from '../components/CameraTargetComponent';
import { CameraTargetSystem } from './CameraTargetSystem';
import { Component } from '../core/Component';
import { ComponentMetadata } from '../core/ComponentMetadata';

// Minimal cameraView component to satisfy requires metadata
class CameraViewComponent extends Component { readonly type='cameraView'; readonly metadata: ComponentMetadata={ type:'cameraView', unique:true }; }

describe('CameraTargetSystem', () => {
  test('camera interpolates towards offset position', () => {
    const entities = new Map<string, Entity>();
    const target = new Entity('target');
    target.transform.setPosition(10, 0, 0);
    entities.set(target.id, target);
    const cam = new Entity('cam');
    cam.addComponent(new CameraViewComponent());
    cam.addComponent(new CameraTargetComponent({ targetEntityId: 'target', followSpeed: 0.5, offset: [0, 5, 10] }));
    entities.set(cam.id, cam);
    const system = new CameraTargetSystem(entities);
    system.update(1); // dt=1, lerp alpha = 0.5
    const expected = target.transform.worldPosition.clone().add({ x:0, y:5, z:10 } as any);
    // cam should have moved halfway from origin (0,0,0) to expected
    expect(cam.transform.worldPosition.x).toBeCloseTo(expected.x * 0.5, 5);
    expect(cam.transform.worldPosition.y).toBeCloseTo(expected.y * 0.5, 5);
    expect(cam.transform.worldPosition.z).toBeCloseTo(expected.z * 0.5, 5);
  });

  test('camera applies lookAtOffset', () => {
    const entities = new Map<string, Entity>();
    const target = new Entity('t');
    entities.set(target.id, target);
    const cam = new Entity('c');
    cam.addComponent(new CameraViewComponent());
    cam.addComponent(new CameraTargetComponent({ targetEntityId: 't', followSpeed: 1, offset:[0,0,5], lookAtOffset:[0,2,0] }));
    entities.set(cam.id, cam);
    const system = new CameraTargetSystem(entities);
    system.update(1);
    // After update cam should look at target position + offset (0,2,0)
    const forward = cam.transform.getForward();
    // Target lookAt vector (from camera to target+offset)
    const targetPos = target.transform.worldPosition.clone().add({ x:0, y:2, z:0 } as any);
    const toTarget = targetPos.clone().sub(cam.transform.worldPosition).normalize();
    // Forward should align (dot > 0.9)
    const dot = forward.dot(toTarget);
    expect(dot).toBeGreaterThan(0.9);
  });

  test('setTarget triggers notifyChanged (observer scenario)', () => {
    const entities = new Map<string, Entity>();
    const targetA = new Entity('A');
    const targetB = new Entity('B');
    entities.set(targetA.id, targetA); entities.set(targetB.id, targetB);
    const cam = new Entity('cam');
    cam.addComponent(new CameraViewComponent());
    const comp = new CameraTargetComponent({ targetEntityId: 'A' });
    let called=0;
    const obs = { onComponentChanged: () => called++ };
    comp.addObserver(obs);
    cam.addComponent(comp);
    comp.setTarget('B');
    expect(called).toBe(1);
    expect(comp.targetEntityId).toBe('B');
  });
});
