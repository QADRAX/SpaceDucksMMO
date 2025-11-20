import Vector3Editor from "../../common/molecules/Vector3Editor";
import Component from "@client/domain/ecs/core/Component";
import type { InspectorFieldConfig } from "@client/domain/ecs/core/ComponentMetadata";
import { NullableToggleEditor } from "./NullableToggleEditor";
import { ReferenceField } from "./ReferenceField";
import { TextureSelector } from "./TextureSelector";
import { UniformsValueEditor } from "./UniformsValueEditor";
type UniformsObject = { [key: string]: { value: any } };
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
  // If no get, do not render anything
  if (!fieldConfig || typeof fieldConfig.get !== "function") return null;

  // Get value using metadata get or direct
  const value = fieldConfig.get(component);

  // Set value using metadata set or direct
  const isMutable = !!fieldConfig.set;
  const applyChange = (nv: any) => {
    if (isMutable && fieldConfig.set) {
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
    // Always provide a valid onToggle (no-op if not mutable)
    const handleToggle = isMutable
      ? (checked: boolean) => {
          if (checked) {
            applyChange(defaultValue);
          } else {
            applyChange(undefined);
          }
        }
      : () => {};
    return (
      <NullableToggleEditor enabled={enabled} onToggle={handleToggle}>
        {children}
      </NullableToggleEditor>
    );
  }

  // Select editor by type/key
  let editor: preact.ComponentChildren = null;
  // If not mutable, always use PropertyReadonly
  const readonly = !isMutable;
  // Helper for readonly fallback
  const readonlyValue = (v: any) => {
    if (v === undefined || v === null) return "-";
    if (
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean"
    )
      return v;
    return JSON.stringify(v);
  };
  if (fieldConfig?.nullable) {
    editor = (
      <NullableFieldWrapper>
        {fieldKey === "targetEntityId" ? (
          readonly ? (
            <PropertyReadonly value={readonlyValue(value)} />
          ) : (
            <ReferenceField
              value={typeof value === "string" ? value : null}
              onChange={(id) => applyChange(id || "")}
            />
          )
        ) : ["texture", "normalMap", "envMap"].includes(fieldKey) ? (
          readonly ? (
            <PropertyReadonly value={readonlyValue(value)} />
          ) : (
            <TextureSelector
              value={typeof value === "string" ? value : null}
              onChange={(tx) => applyChange(tx || undefined)}
            />
          )
        ) : fieldKey === "color" ? (
          readonly ? (
            <PropertyReadonly value={readonlyValue(value)} />
          ) : (
            <PropertyColor
              value={typeof value === "string" ? parseInt(value.replace('#',''), 16) : 0xffffff}
              onChange={(v: number) => applyChange('#' + v.toString(16).padStart(6, '0'))}
            />
          )
        ) : fieldConfig.type === "vector" ? (
          readonly ? (
            <PropertyReadonly value={readonlyValue(value)} />
          ) : (
            <Vector3Editor
              value={
                Array.isArray(value) && value.length === 3
                  ? (value as [number, number, number])
                  : [0, 0, 0]
              }
              onChange={applyChange}
            />
          )
        ) : fieldConfig.type === "number" ? (
          readonly ? (
            <PropertyReadonly value={readonlyValue(value)} />
          ) : (
            <PropertyNumber
              value={typeof value === "number" ? value : 0}
              onChange={applyChange}
              min={fieldConfig.min}
              max={fieldConfig.max}
              step={fieldConfig.step}
            />
          )
        ) : fieldConfig.type === "boolean" ? (
          readonly ? (
            <PropertyReadonly value={readonlyValue(value)} />
          ) : (
            <PropertyCheckbox checked={!!value} onChange={applyChange} />
          )
        ) : fieldConfig.type === "string" ? (
          readonly ? (
            <PropertyReadonly value={readonlyValue(value)} />
          ) : (
            <PropertyInput
              value={typeof value === "string" ? value : ""}
              onChange={applyChange}
            />
          )
        ) : fieldKey === "uniforms" ? (
          readonly ? (
            <PropertyReadonly value={readonlyValue(value)} />
          ) : (
            <UniformsValueEditor
              uniforms={typeof value === "object" && value !== null ? (value as UniformsObject) : {}}
              onChange={(uname: string, nv: any) => {
                if (value && typeof value === "object" && (value as UniformsObject)[uname]) {
                  (value as UniformsObject)[uname].value = nv;
                }
                applyChange(value);
              }}
            />
          )
        ) : (
          <PropertyReadonly value={readonlyValue(value)} />
        )}
      </NullableFieldWrapper>
    );
  } else {
    editor =
      fieldKey === "targetEntityId" ? (
        readonly ? (
          <PropertyReadonly value={readonlyValue(value)} />
        ) : (
          <ReferenceField
            value={typeof value === "string" ? value : null}
            onChange={(id) => applyChange(id || "")}
          />
        )
      ) : ["texture", "normalMap", "envMap"].includes(fieldKey) ? (
        readonly ? (
          <PropertyReadonly value={readonlyValue(value)} />
        ) : (
          <TextureSelector
            value={typeof value === "string" ? value : null}
            onChange={(tx) => applyChange(tx || undefined)}
          />
        )
      ) : fieldKey === "color" ? (
        readonly ? (
          <PropertyReadonly value={readonlyValue(value)} />
        ) : (
          <PropertyColor
            value={typeof value === "string" ? parseInt(value.replace('#',''), 16) : 0xffffff}
            onChange={(v: number) => applyChange('#' + v.toString(16).padStart(6, '0'))}
          />
        )
      ) : fieldConfig?.type === "vector" ? (
        readonly ? (
          <PropertyReadonly value={readonlyValue(value)} />
        ) : (
          <Vector3Editor
            value={
              Array.isArray(value) && value.length === 3
                ? (value as [number, number, number])
                : [0, 0, 0]
            }
            onChange={applyChange}
          />
        )
      ) : fieldConfig?.type === "number" ? (
        readonly ? (
          <PropertyReadonly value={readonlyValue(value)} />
        ) : (
          <PropertyNumber
            value={typeof value === "number" ? value : 0}
            onChange={applyChange}
            min={fieldConfig?.min}
            max={fieldConfig?.max}
            step={fieldConfig?.step}
          />
        )
      ) : fieldConfig?.type === "boolean" ? (
        readonly ? (
          <PropertyReadonly value={readonlyValue(value)} />
        ) : (
          <PropertyCheckbox checked={!!value} onChange={applyChange} />
        )
      ) : fieldConfig?.type === "string" ? (
        readonly ? (
          <PropertyReadonly value={readonlyValue(value)} />
        ) : (
          <PropertyInput
            value={typeof value === "string" ? value : ""}
            onChange={applyChange}
          />
        )
      ) : fieldKey === "uniforms" ? (
        readonly ? (
          <PropertyReadonly value={readonlyValue(value)} />
        ) : (
          <UniformsValueEditor
            uniforms={typeof value === "object" && value !== null ? (value as UniformsObject) : {}}
            onChange={(uname: string, nv: any) => {
              if (value && typeof value === "object" && (value as UniformsObject)[uname]) {
                (value as UniformsObject)[uname].value = nv;
              }
              applyChange(value);
            }}
          />
        )
      ) : (
        <PropertyReadonly value={readonlyValue(value)} />
      );
  }

  return (
    <div className="prop-row" key={fieldKey}>
      <div className="prop-key">{label}</div>
      <div className="prop-value">{editor}</div>
    </div>
  );
}
