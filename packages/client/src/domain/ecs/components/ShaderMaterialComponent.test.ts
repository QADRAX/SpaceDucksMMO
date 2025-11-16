import { Entity } from '../core/Entity';
import { GeometryComponent } from './GeometryComponent';
import { ShaderMaterialComponent } from './ShaderMaterialComponent';
import { MaterialComponent } from './MaterialComponent';

class Observer { calls=0; onComponentChanged(){ this.calls++; } }

describe('ShaderMaterialComponent', () => {
  test('requires geometry enforced', () => {
    const e = new Entity('E');
    const shader = new ShaderMaterialComponent({ shaderType:'custom', uniforms:{ time:{ value:0, type:'float' } } });
    expect(() => e.addComponent(shader)).toThrow(/requires 'geometry'/);
  });

  test('conflicts with material enforced', () => {
    const e = new Entity('E');
    e.addComponent(new GeometryComponent({ type:'sphere', radius:1 }));
    e.addComponent(new MaterialComponent({ type:'basic' }));
    const shader = new ShaderMaterialComponent({ shaderType:'custom', uniforms:{ time:{ value:0, type:'float' } } });
    expect(() => e.addComponent(shader)).toThrow(/conflicts with existing 'material'/);
  });

  test('uniform setters notify', () => {
    const e = new Entity('E');
    e.addComponent(new GeometryComponent({ type:'sphere', radius:1 }));
    const shader = new ShaderMaterialComponent({ shaderType:'custom', uniforms:{ time:{ value:0, type:'float' }, color:{ value:'#fff', type:'color' } }, transparent:false });
    const obs = new Observer(); shader.addObserver(obs); e.addComponent(shader);
    shader.setUniform('time', 1.5);
    shader.setUniforms({ color:'#000', time:2.0 });
    shader.transparent = true;
    expect(obs.calls).toBe(3);
    expect(shader.uniforms.time.value).toBe(2.0);
    expect(shader.uniforms.color.value).toBe('#000');
    expect(shader.transparent).toBe(true);
  });
});
