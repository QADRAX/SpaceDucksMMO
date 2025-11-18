import { Entity } from '../core/Entity';
import { MaterialComponent } from './MaterialComponent';
import { SphereGeometryComponent } from './SphereGeometryComponent';
import { ShaderMaterialComponent } from './ShaderMaterialComponent';

class Observer { calls=0; onComponentChanged(){ this.calls++; } }

describe('MaterialComponent', () => {
  test('requires geometry enforced', () => {
    const e = new Entity('E');
    const mat = new MaterialComponent({ type:'basic', color:'#fff' });
    expect(() => e.addComponent(mat)).toThrow(/requires 'geometry'/);
  });

  test('conflicts with shaderMaterial enforced', () => {
    const e = new Entity('E');
    e.addComponent(new SphereGeometryComponent({ radius:1 }));
    e.addComponent(new MaterialComponent({ type:'basic', color:'#fff' }));
    const shader = new ShaderMaterialComponent({ shaderType:'custom', uniforms:{ time:{ value:0, type:'float' } } });
    expect(() => e.addComponent(shader)).toThrow(/conflicts with existing 'material'/);
  });

  test('setters notify observers', () => {
    const e = new Entity('E');
    e.addComponent(new SphereGeometryComponent({ radius:1 }));
    const mat = new MaterialComponent({ type:'basic', color:'#fff', opacity:0.5 });
    const obs = new Observer(); mat.addObserver(obs); e.addComponent(mat);
    mat.color = '#ff0000';
    mat.opacity = 0.8;
    mat.transparent = true;
    mat.texture = 'tex.png';
    mat.normalMap = 'norm.png';
    mat.envMap = 'env.hdr';
    expect(obs.calls).toBe(6);
    expect(mat.color).toBe('#ff0000');
    expect(mat.opacity).toBe(0.8);
    expect(mat.transparent).toBe(true);
    expect(mat.texture).toBe('tex.png');
    expect(mat.normalMap).toBe('norm.png');
    expect(mat.envMap).toBe('env.hdr');
  });
});
