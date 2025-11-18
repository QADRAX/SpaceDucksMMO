import * as THREE from 'three';
import { RenderSyncSystem } from './RenderSyncSystem';
import { Entity } from '../../../domain/ecs/core/Entity';
import { SphereGeometryComponent } from '../../../domain/ecs/components/SphereGeometryComponent';
import { MaterialComponent } from '../../../domain/ecs/components/MaterialComponent';
import { LightComponent } from '../../../domain/ecs/components/LightComponent';
import { BoxGeometryComponent } from '../../../domain/ecs/components/BoxGeometryComponent';

describe('RenderSyncSystem enable/disable handling', () => {
  let scene: THREE.Scene;
  let rss: RenderSyncSystem;

  beforeEach(() => {
    scene = new THREE.Scene();
    rss = new RenderSyncSystem(scene);
  });

  it('hides mesh when geometry is disabled and shows when enabled', () => {
    const e = new Entity('e1');
    const geom = new SphereGeometryComponent({ radius: 1 });
    const mat = new MaterialComponent({ type: 'basic', color: 0xffffff });
    e.addComponent(geom as any);
    e.addComponent(mat as any);

    rss.addEntity(e);

    const rc = (rss as any).registry.get('e1');
    expect(rc).toBeDefined();
    expect(rc.object3D).toBeDefined();
    expect(rc.object3D.visible).toBeTruthy();

    // disable geometry
    geom.enabled = false;
    // after notify, object should be hidden
    const rc2 = (rss as any).registry.get('e1');
    expect(rc2).toBeDefined();
    expect(rc2.object3D.visible).toBeFalsy();

    // re-enable geometry
    geom.enabled = true;
    const rc3 = (rss as any).registry.get('e1');
    expect(rc3).toBeDefined();
    // visible should be true again (may be recreated)
    expect(rc3.object3D.visible).toBeTruthy();
  });

  it('hides light when light component is disabled and shows when enabled', () => {
    const e = new Entity('light1');
    const lightComp = new LightComponent({ type: 'point', intensity: 1 });
    e.addComponent(lightComp as any);

    rss.addEntity(e);

    const rc = (rss as any).registry.get('light1');
    expect(rc).toBeDefined();
    expect(rc.object3D).toBeDefined();
    expect(rc.object3D.visible).toBeTruthy();

    lightComp.enabled = false;
    const rc2 = (rss as any).registry.get('light1');
    expect(rc2).toBeDefined();
    expect(rc2.object3D.visible).toBeFalsy();

    lightComp.enabled = true;
    const rc3 = (rss as any).registry.get('light1');
    expect(rc3).toBeDefined();
    expect(rc3.object3D.visible).toBeTruthy();
  });

  it('hides mesh when material is disabled and shows when enabled', () => {
    const e = new Entity('m1');
    const geom = new SphereGeometryComponent({ radius: 1 });
    const mat = new MaterialComponent({ type: 'basic', color: 0xffffff });
    e.addComponent(geom as any);
    e.addComponent(mat as any);

    rss.addEntity(e);

    const rc = (rss as any).registry.get('m1');
    expect(rc).toBeDefined();
    expect(rc.object3D.visible).toBeTruthy();

    mat.enabled = false;
    const rc2 = (rss as any).registry.get('m1');
    expect(rc2).toBeDefined();
    expect(rc2.object3D.visible).toBeFalsy();

    mat.enabled = true;
    const rc3 = (rss as any).registry.get('m1');
    expect(rc3).toBeDefined();
    expect(rc3.object3D.visible).toBeTruthy();
  });

  it('hides mesh when shaderMaterial is disabled and shows when enabled', () => {
    const e = new Entity('s1');
    const geom = new SphereGeometryComponent({ radius: 1 });
    const shader = new (require('../../../domain/ecs/components/ShaderMaterialComponent').ShaderMaterialComponent)({ shaderType: 'atmosphere', uniforms: {} });
    e.addComponent(geom as any);
    e.addComponent(shader as any);

    rss.addEntity(e);

    const rc = (rss as any).registry.get('s1');
    expect(rc).toBeDefined();
    expect(rc.object3D.visible).toBeTruthy();

    shader.enabled = false;
    const rc2 = (rss as any).registry.get('s1');
    expect(rc2).toBeDefined();
    expect(rc2.object3D.visible).toBeFalsy();

    shader.enabled = true;
    const rc3 = (rss as any).registry.get('s1');
    expect(rc3).toBeDefined();
    expect(rc3.object3D.visible).toBeTruthy();
  });

  it('removing geometry actually removes registry entry and disposes resources', () => {
    const e = new Entity('rem1');
    const geom = new SphereGeometryComponent({ radius: 1 });
    const mat = new MaterialComponent({ type: 'basic', color: 0xffffff });
    e.addComponent(geom as any);
    e.addComponent(mat as any);

    // spy on scene.remove
    const spyRemove = jest.spyOn((scene as any), 'remove');

    rss.addEntity(e);

    const rc = (rss as any).registry.get('rem1');
    expect(rc).toBeDefined();
    // attach spies to dispose
    if (rc.geometry) rc.geometry.dispose = jest.fn();
    if (rc.material) (rc.material as any).dispose = jest.fn();

    // remove material component from entity -> should trigger registry.remove
    // (removing geometry would be prevented because material requires it)
    e.removeComponent('material');

    expect((rss as any).registry.has('rem1')).toBe(false);
    // scene.remove should be called
    expect(spyRemove).toHaveBeenCalled();
    if (rc.geometry) expect((rc.geometry.dispose as any)).toHaveBeenCalled();
    if (rc.material) expect((rc.material as any).dispose).toHaveBeenCalled();
  });

  it('creates mesh when geometry then material are added after addEntity', () => {
    const e = new Entity('late1');

    rss.addEntity(e);

    // initially no mesh
    let meshes = scene.children.filter((c) => c instanceof THREE.Mesh);
    expect(meshes.length).toBe(0);

    // add geometry then material
    e.addComponent(new BoxGeometryComponent({ width: 1, height: 1, depth: 1 } as any) as any);
    e.addComponent(new MaterialComponent({ type: 'standard', color: 0xffffff } as any));

    // the entity listener should have created the mesh
    meshes = scene.children.filter((c) => c instanceof THREE.Mesh);
    expect(meshes.length).toBeGreaterThanOrEqual(1);
  });

  it('recreates mesh when geometry and material are removed and re-added', () => {
    const e = new Entity('roundtrip1');

    // Initial geometry + material
    e.addComponent(new BoxGeometryComponent({ width: 1, height: 1, depth: 1 } as any) as any);
    e.addComponent(new MaterialComponent({ type: 'standard', color: 0xffffff } as any));

    rss.addEntity(e);

    // ensure mesh created
    let meshes = scene.children.filter((c) => c instanceof THREE.Mesh);
    expect(meshes.length).toBeGreaterThanOrEqual(1);

    // remove components
    e.removeComponent('material');
    e.removeComponent('boxGeometry');

    // after removals, mesh should be removed
    meshes = scene.children.filter((c) => c instanceof THREE.Mesh);
    expect(meshes.length).toBe(0);

    // re-add components
    e.addComponent(new BoxGeometryComponent({ width: 2, height: 2, depth: 2 } as any) as any);
    e.addComponent(new MaterialComponent({ type: 'standard', color: 0xff0000 } as any));

    // the listener should recreate the mesh
    meshes = scene.children.filter((c) => c instanceof THREE.Mesh);
    expect(meshes.length).toBeGreaterThanOrEqual(1);
  });
});
