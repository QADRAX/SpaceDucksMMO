import type { ComponentChildren } from "preact";
import type { Component, InspectorFieldConfig } from "@duckengine/rendering-three/ecs";
import { renderFieldEditor } from "./ComponentFieldEditor";
import { NullableFieldWrapper } from "./NullableFieldWrapper";

type Props = {
  component: Component;
  fieldKey: string;
  fieldConfig?: InspectorFieldConfig;
};

export function ComponentFieldRow({ component, fieldKey, fieldConfig }: Props) {
  const label = fieldConfig?.label ?? fieldKey;
  const description = fieldConfig?.description;

  if (!fieldConfig || typeof fieldConfig.get !== "function") {
    return null;
  }

  const value = fieldConfig.get(component);
  const isMutable = typeof fieldConfig.set === "function";

  const applyChange = (nv: unknown) => {
    console.log("[ComponentFieldRow] applyChange", {
      fieldKey,
      nv,
      isMutable,
      component,
    });

    if (isMutable && fieldConfig.set) {
      fieldConfig.set(component, nv);
    }

    if (typeof fieldConfig.get === "function") {
      console.log("[ComponentFieldRow] after change", {
        value: fieldConfig.get(component),
      });
    }
  };

  const readonly = !isMutable;

  const baseEditor: ComponentChildren = renderFieldEditor({
    fieldConfig,
    value,
    readonly,
    onChange: applyChange,
  });

  const editor = fieldConfig.nullable ? (
    <NullableFieldWrapper
      value={value}
      fieldKey={fieldKey}
      fieldConfig={fieldConfig}
      onChange={applyChange}
    >
      {baseEditor}
    </NullableFieldWrapper>
  ) : (
    baseEditor
  );

  return (
    <div className="prop-row" key={fieldKey}>
      <div className="prop-key" title={description || undefined}>
        <div className="prop-label">{label}</div>
        {description ? <div className="prop-desc">{description}</div> : null}
      </div>
      <div className="prop-value">{editor}</div>
    </div>
  );
}
