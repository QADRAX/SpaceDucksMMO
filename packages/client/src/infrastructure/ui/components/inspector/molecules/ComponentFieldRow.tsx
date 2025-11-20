import Vector3Editor from "../../common/molecules/Vector3Editor";
import Component from "@client/domain/ecs/core/Component";
import type { InspectorFieldConfig } from "@client/domain/ecs/core/ComponentMetadata";
import { NullableToggleEditor } from "./NullableToggleEditor";
import { ReferenceField } from "./ReferenceField";
import { TextureSelector } from "./TextureSelector";
import { UniformsValueEditor } from "./UniformsValueEditor";
import { PropertyCheckbox } from "../../common/atoms/PropertyCheckbox";
import { PropertyInput } from "../../common/atoms/PropertyInput";
import { PropertyNumber } from "../../common/atoms/PropertyNumber";
import { PropertyReadonly } from "../../common/atoms/PropertyReadonly";
import { PropertyColor } from "../../common/atoms/PropertyColor";

type Props = {
  component: Component;
  fieldKey: string;
  fieldConfig?: InspectorFieldConfig;
};

export function ComponentFieldRow({ component, fieldKey, fieldConfig }: Props) {
  const label = fieldConfig?.label ?? fieldKey;
  // Get value using metadata get or direct
  const value = fieldConfig?.get
    ? fieldConfig.get(component)
    : (component as any)[fieldKey];

  // Set value using metadata set or direct
  const applyChange = (nv: any) => {
    debugger;
    if (fieldConfig?.set) {
      fieldConfig.set(component, nv);
    }
  };

  // Default value logic (by key/type)
  function getDefaultForType(key: string, type?: string): any {
    if (key === "color") return "#ffffff";
    if (["texture", "normalMap", "envMap"].includes(key)) return undefined;
    if (key === "targetEntityId") return "";
    if (key === "uniforms") return {};
    switch (type) {
      case "number":
        return 0;
      case "boolean":
        return false;
      case "string":
        return "";
      case "vector":
        return [0, 0, 0];
      case "color":
        return "#ffffff";
      default:
        return null;
    }
  }

  // Nullable wrapper
  function NullableFieldWrapper({ children }: { children: any }) {
    const enabled = value !== undefined && value !== null;
    const defaultValue =
      fieldConfig?.default !== undefined
        ? fieldConfig.default
        : getDefaultForType(fieldKey, fieldConfig?.type);
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

  // Select editor by type/key
  let editor: preact.ComponentChildren = null;
  if (fieldConfig?.nullable) {
    editor = (
      <NullableFieldWrapper>
        {fieldKey === "targetEntityId" ? (
          <ReferenceField
            value={value || null}
            onChange={(id) => applyChange(id || "")}
          />
        ) : ["texture", "normalMap", "envMap"].includes(fieldKey) ? (
          <TextureSelector
            value={value || null}
            onChange={(tx) => applyChange(tx || undefined)}
          />
        ) : fieldKey === "color" ? (
          <PropertyColor value={value} onChange={applyChange} />
        ) : fieldConfig.type === "vector" ? (
          <Vector3Editor
            value={
              Array.isArray(value) && value.length === 3
                ? (value as [number, number, number])
                : [0, 0, 0]
            }
            onChange={applyChange}
          />
        ) : fieldConfig.type === "number" ? (
          <PropertyNumber
            value={value as number}
            onChange={applyChange}
            min={fieldConfig.min}
            max={fieldConfig.max}
            step={fieldConfig.step}
          />
        ) : fieldConfig.type === "boolean" ? (
          <PropertyCheckbox checked={!!value} onChange={applyChange} />
        ) : fieldConfig.type === "string" ? (
          <PropertyInput value={String(value)} onChange={applyChange} />
        ) : fieldKey === "uniforms" ? (
          <UniformsValueEditor
            uniforms={value || {}}
            onChange={(uname, nv) => {
              if (value && value[uname]) value[uname].value = nv;
              applyChange(value);
            }}
          />
        ) : (
          <PropertyReadonly value={value === undefined ? "-" : value} />
        )}
      </NullableFieldWrapper>
    );
  } else {
    editor =
      fieldKey === "targetEntityId" ? (
        <ReferenceField
          value={value || null}
          onChange={(id) => applyChange(id || "")}
        />
      ) : ["texture", "normalMap", "envMap"].includes(fieldKey) ? (
        <TextureSelector
          value={value || null}
          onChange={(tx) => applyChange(tx || undefined)}
        />
      ) : fieldKey === "color" ? (
        <PropertyColor value={value} onChange={applyChange} />
      ) : fieldConfig?.type === "vector" ? (
        <Vector3Editor
          value={
            Array.isArray(value) && value.length === 3
              ? (value as [number, number, number])
              : [0, 0, 0]
          }
          onChange={applyChange}
        />
      ) : fieldConfig?.type === "number" ? (
        <PropertyNumber
          value={value as number}
          onChange={applyChange}
          min={fieldConfig?.min}
          max={fieldConfig?.max}
          step={fieldConfig?.step}
        />
      ) : fieldConfig?.type === "boolean" ? (
        <PropertyCheckbox checked={!!value} onChange={applyChange} />
      ) : fieldConfig?.type === "string" ? (
        <PropertyInput value={String(value)} onChange={applyChange} />
      ) : fieldKey === "uniforms" ? (
        <UniformsValueEditor
          uniforms={value || {}}
          onChange={(uname, nv) => {
            if (value && value[uname]) value[uname].value = nv;
            applyChange(value);
          }}
        />
      ) : (
        <PropertyReadonly value={value === undefined ? "-" : value} />
      );
  }

  return (
    <div className="prop-row" key={fieldKey}>
      <div className="prop-key">{label}</div>
      <div className="prop-value">{editor}</div>
    </div>
  );
}
