import { h } from 'preact';
import ReferenceField from './ReferenceField';
import TextureSelector from './TextureSelector';
import { PropertyCheckbox } from '../common/PropertyCheckbox';
import { PropertyInput } from '../common/PropertyInput';
import { PropertyNumber } from '../common/PropertyNumber';
import { PropertyReadonly } from '../common/PropertyReadonly';
import { Vector3Input } from '../common/Vector3Input';
import type { InspectorFieldConfig } from '@client/domain/ecs/core/ComponentMetadata';

function renderValue(
  key: string,
  value: any,
  onChange: (v: any) => void,
  visited?: WeakSet<object>
) {
  if (!visited) visited = new WeakSet<object>();
  if (typeof value === 'number') {
    return <PropertyNumber value={value as number} onChange={onChange} />;
  }
  if (typeof value === 'boolean') {
    return <PropertyCheckbox checked={!!value} onChange={onChange} />;
  }
  if (typeof value === 'string') {
    return <PropertyInput value={String(value)} onChange={onChange} />;
  }
  if (Array.isArray(value) && value.every((x) => typeof x === 'number')) {
    const obj = { x: value[0] || 0, y: value[1] || 0, z: value[2] || 0 };
    return (
      <Vector3Input
        value={obj}
        onChange={(axis, v) => {
          const next = [obj.x, obj.y, obj.z];
          if (axis === 'x') next[0] = v;
          if (axis === 'y') next[1] = v;
          if (axis === 'z') next[2] = v;
          onChange(next);
        }}
      />
    );
  }
  if (typeof value === 'object' && value !== null) {
    if (visited.has(value)) return <PropertyReadonly value="[Circular]" />;
    visited.add(value);
    return (
      <div style={{ paddingLeft: 8 }}>
        {Object.keys(value).map((k) => (
          <div class="prop-row" key={k}>
            <div class="prop-key">{k}</div>
            <div class="prop-value">
              {renderValue(k, (value as any)[k], (nv: any) => {
                (value as any)[k] = nv;
                onChange(value);
              }, visited)}
            </div>
          </div>
        ))}
      </div>
    );
  }
  return <PropertyReadonly value={value === undefined ? '-' : value} />;
}

export function renderPropertyWithConfig(comp: any, key: string, cfg?: InspectorFieldConfig, services?: any) {
  const value = cfg && cfg.get ? cfg.get(comp) : (comp as any)[key];

  const applyChange = (nv: any) => {
    if (cfg && cfg.set) {
      try { cfg.set(comp, nv); } catch {}
    } else {
      try { (comp as any)[key] = nv; comp.notifyChanged && comp.notifyChanged(); } catch {}
    }
  };

  if (key === 'targetEntityId') {
    return (
      <ReferenceField
        value={(value as any) || null}
        onChange={(id) => { applyChange(id || ''); }}
      />
    );
  }

  if (['texture', 'normalMap', 'envMap'].includes(key)) {
    return (
      <TextureSelector
        value={(value as any) || null}
        onChange={(tx) => { applyChange(tx || undefined); }}
      />
    );
  }

  if (key === 'color') {
    const toHex = (v: any) => {
      if (typeof v === 'number') return '#' + (v >>> 0).toString(16).padStart(6, '0');
      if (typeof v === 'string') {
        if (v.startsWith('#')) return v;
        const parsed = parseInt(v as string, 10);
        if (!isNaN(parsed)) return '#' + parsed.toString(16).padStart(6, '0');
        return '#ffffff';
      }
      return '#ffffff';
    };
    const fromHex = (hex: string) => {
      if (!hex) return hex;
      if (hex.startsWith('#')) hex = hex.slice(1);
      return parseInt(hex, 16);
    };
    const colorValue = toHex(value);
    return (
      <input
        type="color"
        value={colorValue}
        onInput={(e: any) => { const v = e.target.value as string; const converted = fromHex(v); applyChange(converted); }}
      />
    );
  }

  if (comp && comp.type === 'shaderMaterial' && key === 'uniforms') {
    const uniforms = value || {};
    return (
      <div style={{ paddingLeft: 8 }}>
        {Object.keys(uniforms).map((uname) => {
          const u = uniforms[uname];
          return (
            <div class="prop-row" key={uname}>
              <div class="prop-key">{uname}</div>
              <div class="prop-value">
                {u && u.type === 'texture' ? (
                  <TextureSelector
                    value={u.value || null}
                    onChange={(tx) => { u.value = tx || null; try { comp.notifyChanged && comp.notifyChanged(); } catch {} }}
                  />
                ) : (
                  renderValue(uname, u?.value, (nv: any) => { if (u) u.value = nv; try { comp.notifyChanged && comp.notifyChanged(); } catch {} })
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return renderValue(key, value, applyChange);
}

export default renderValue;
