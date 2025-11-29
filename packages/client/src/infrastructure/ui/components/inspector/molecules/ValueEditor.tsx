import { ReferenceField } from "./ReferenceField";
import { TextureSelector } from "./TextureSelector";
import { PropertyCheckbox } from "../../common/atoms/PropertyCheckbox";
import { PropertyInput } from "../../common/atoms/PropertyInput";
import { PropertyNumber } from "../../common/atoms/PropertyNumber";
import { PropertyReadonly } from "../../common/atoms/PropertyReadonly";
import { ColorPicker } from "../../common/atoms/ColorPicker";
import { Vector3Editor } from "../../common/molecules/Vector3Editor";
import { NullableToggleEditor } from "./NullableToggleEditor";
import { UniformsValueEditor } from "./UniformsValueEditor";
import type { InspectorFieldConfig } from "@client/domain/ecs/core/ComponentMetadata";



function renderValue(
  key: string,
  value: any,
  onChange: (v: any) => void,
  visited?: WeakSet<object>
) {
  if (!visited) visited = new WeakSet<object>();
  if (typeof value === "number") {
    return <PropertyNumber value={value as number} onChange={onChange} />;
  }
  if (typeof value === "boolean") {
    return <PropertyCheckbox checked={!!value} onChange={onChange} />;
  }
  if (typeof value === "string") {
    return <PropertyInput value={String(value)} onChange={onChange} />;
  }
  if (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((x) => typeof x === "number")
  ) {
    // Cast to [number, number, number] for type safety
    const vec: [number, number, number] = [
      value[0] || 0,
      value[1] || 0,
      value[2] || 0,
    ];
    return <Vector3Editor value={vec} onChange={onChange} />;
  }
  if (typeof value === "object" && value !== null) {
    if (visited.has(value)) return <PropertyReadonly value="[Circular]" />;
    visited.add(value);
    return (
      <div style={{ paddingLeft: 8 }}>
        {Object.keys(value).map((k) => (
          <div className="prop-row" key={k}>
            <div className="prop-key">{k}</div>
            <div className="prop-value">
              {renderValue(
                k,
                (value as any)[k],
                (nv: any) => {
                  (value as any)[k] = nv;
                  onChange(value);
                },
                visited
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }
  return <PropertyReadonly value={value === undefined ? "-" : value} />;
}


export function renderPropertyWithConfig<
  T extends { notifyChanged?: () => void; type?: string } = any
>(
  comp: T,
  key: string,
  cfg?: InspectorFieldConfig<T>,
  services?: any
): preact.ComponentChildren {
  const value = cfg && cfg.get ? cfg.get(comp) : (comp as any)[key];

  /**
   * Applies a value change to the component and always notifies.
   * If cfg.set exists, uses it; otherwise assigns directly.
   * Always calls comp.notifyChanged() if available.
   */
  const applyChange = (nv: any) => {
    let changed = false;
    if (cfg && cfg.set) {
      try {
        cfg.set(comp, nv);
        changed = true;
      } catch {}
    } else {
      try {
        (comp as any)[key] = nv;
        changed = true;
      } catch {}
    }
    if (changed && comp.notifyChanged) {
      comp.notifyChanged();
    }
  };

  /**
   * Returns a reasonable default value for a given key and type.
   * Uses key for special cases, otherwise falls back to type.
   */
  function getDefaultForType(type?: InspectorFieldConfig<T>['type']): any {
    switch (type) {
      case 'number':
        return 0;
      case 'boolean':
        return false;
      case 'string':
        return '';
      case 'vector':
        return [0, 0, 0];
      case 'color':
        return '#ffffff';
      case 'texture':
        return null;
      case 'object':
        return {};
      case 'uniforms':
        return {};
      default:
        return null;
    }
  }

  /**
   * Wrapper for nullable fields to handle toggle logic and value assignment.
   * Ensures hooks are used only in components.
   */
  function NullableFieldWrapper({ children }: { children: any }) {
    // Semantics: undefined => disabled; null or any other value => enabled
    const enabled = value !== undefined;
    // Prefer cfg.default, else type-based default
    const defaultValue = cfg?.default !== undefined ? cfg.default : getDefaultForType(cfg?.type);

    return (
      <NullableToggleEditor
        enabled={enabled}
        onToggle={(checked) => {
          if (checked) {
            applyChange(defaultValue);
          } else {
            applyChange(undefined);
          }
        }}
      >
        {children}
      </NullableToggleEditor>
    );
  }

  if (cfg && cfg.nullable) {
    return (
      <NullableFieldWrapper>
        {key === "targetEntityId" ? (
          <ReferenceField
            value={(value as any) || null}
            onChange={(id) => {
              applyChange(id || "");
            }}
          />
        ) : ["texture", "normalMap", "envMap"].includes(key) ? (
          <TextureSelector
            value={(value as any) || null}
            onChange={(tx) => {
              applyChange(tx || undefined);
            }}
          />
        ) : key === "color" ? (
          <ColorPicker value={value} onChange={applyChange} />
        ) : comp && comp.type === "shaderMaterial" && key === "uniforms" ? (
          <UniformsValueEditor
            uniforms={value || {}}
            onChange={(uname, nv) => {
              if (value && value[uname]) value[uname].value = nv;
              applyChange(value);
            }}
            notifyChanged={comp.notifyChanged}
          />
        ) : (
          renderValue(key, value, applyChange)
        )}
      </NullableFieldWrapper>
    );
  }

  if (key === "targetEntityId") {
    return (
      <ReferenceField
        value={(value as any) || null}
        onChange={(id) => {
          applyChange(id || "");
        }}
      />
    );
  }

  if (["texture", "normalMap", "envMap"].includes(key)) {
    return (
      <TextureSelector
        value={(value as any) || null}
        onChange={(tx) => {
          applyChange(tx || undefined);
        }}
      />
    );
  }

  if (key === "color") {
    return <ColorPicker value={value} onChange={applyChange} />;
  }

  if (comp && comp.type === "shaderMaterial" && key === "uniforms") {
    return (
      <UniformsValueEditor
        uniforms={value || {}}
        onChange={(uname, nv) => {
          if (value && value[uname]) value[uname].value = nv;
          applyChange(value);
        }}
        notifyChanged={comp.notifyChanged}
      />
    );
  }

  return renderValue(key, value, applyChange);
}

export default renderValue;
