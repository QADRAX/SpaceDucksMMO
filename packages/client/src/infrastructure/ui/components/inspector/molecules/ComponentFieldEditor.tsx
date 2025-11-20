import Vector3Editor from "../../common/molecules/Vector3Editor";
import { ReferenceField } from "./ReferenceField";
import { TextureSelector } from "./TextureSelector";
import { UniformsValueEditor } from "./UniformsValueEditor";
import { PropertyCheckbox } from "../../common/atoms/PropertyCheckbox";
import { PropertyInput } from "../../common/atoms/PropertyInput";
import { PropertyNumber } from "../../common/atoms/PropertyNumber";
import { PropertyReadonly } from "../../common/atoms/PropertyReadonly";
import { PropertyColor } from "../../common/atoms/PropertyColor";
import type { InspectorFieldConfig } from "@client/domain/ecs/core/ComponentMetadata";

type UniformsObject = { [key: string]: { value: any } };

type EditorProps = {
  fieldConfig: InspectorFieldConfig;
  value: unknown;
  readonly: boolean;
  onChange: (nv: unknown) => void;
};

export function renderFieldEditor({
  fieldConfig,
  value,
  readonly,
  onChange,
}: EditorProps): preact.ComponentChildren {
  const readonlyValue = (v: any) => {
    if (v === undefined || v === null) return "-";
    if (
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean"
    ) {
      return v;
    }
    return JSON.stringify(v);
  };

  // --- Type-based editors ---
  switch (fieldConfig.type) {
    case "reference":
      return readonly ? (
        <PropertyReadonly value={readonlyValue(value)} />
      ) : (
        <ReferenceField
          value={typeof value === "string" ? value : null}
          onChange={(id) => onChange(id || "")}
        />
      );

    case "texture":
      return readonly ? (
        <PropertyReadonly value={readonlyValue(value)} />
      ) : (
        <TextureSelector
          value={typeof value === "string" ? value : null}
          onChange={(tx) => onChange(tx || undefined)}
        />
      );

    case "color":
      return readonly ? (
        <PropertyReadonly value={readonlyValue(value)} />
      ) : (
        <PropertyColor
          value={
            typeof value === "string"
              ? parseInt(value.replace("#", ""), 16)
              : 0xffffff
          }
          onChange={(v: number) =>
            onChange("#" + v.toString(16).padStart(6, "0"))
          }
        />
      );

    case "uniforms":
      return readonly ? (
        <PropertyReadonly value={readonlyValue(value)} />
      ) : (
        <UniformsValueEditor
          uniforms={
            typeof value === "object" && value !== null
              ? (value as UniformsObject)
              : {}
          }
          onChange={(uname: string, nv: any) => {
            if (
              value &&
              typeof value === "object" &&
              (value as UniformsObject)[uname]
            ) {
              (value as UniformsObject)[uname].value = nv;
            }
            onChange(value);
          }}
        />
      );

    case "vector":
      return readonly ? (
        <PropertyReadonly value={readonlyValue(value)} />
      ) : (
        <Vector3Editor
          value={
            Array.isArray(value) && value.length === 3
              ? (value as [number, number, number])
              : [0, 0, 0]
          }
          onChange={onChange}
        />
      );

    case "number":
      return readonly ? (
        <PropertyReadonly value={readonlyValue(value)} />
      ) : (
        <PropertyNumber
          value={typeof value === "number" ? value : 0}
          onChange={onChange}
          min={fieldConfig.min}
          max={fieldConfig.max}
          step={fieldConfig.step}
        />
      );

    case "boolean":
      return readonly ? (
        <PropertyReadonly value={readonlyValue(value)} />
      ) : (
        <PropertyCheckbox checked={!!value} onChange={onChange} />
      );

    case "string":
      return readonly ? (
        <PropertyReadonly value={readonlyValue(value)} />
      ) : (
        <PropertyInput
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
        />
      );

    case "enum":
      // aquí podrías meter un <select> usando fieldConfig.options
      // de momento lo dejamos readonly para no inventar UI
      return <PropertyReadonly value={readonlyValue(value)} />;

    case "object":
      // sin editor específico: se ve como JSON
      return <PropertyReadonly value={readonlyValue(value)} />;

    default:
      // fallback
      return <PropertyReadonly value={readonlyValue(value)} />;
  }
}
