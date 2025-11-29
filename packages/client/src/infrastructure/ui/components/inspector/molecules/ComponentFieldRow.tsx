import type { ComponentChildren } from "preact";
import Component from "@client/domain/ecs/core/Component";
import type { InspectorFieldConfig } from "@client/domain/ecs/core/ComponentMetadata";
import { renderFieldEditor } from "./ComponentFieldEditor";
import { NullableFieldWrapper } from "./NullableFieldWrapper";

type Props = {
  component: Component;
  fieldKey: string;
  fieldConfig?: InspectorFieldConfig;
};

export function ComponentFieldRow({ component, fieldKey, fieldConfig }: Props) {
  const label = fieldConfig?.label ?? fieldKey;

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
    } else {
      (component as any)[fieldKey] = nv;
    }

    if (typeof (component as any).notifyChanged === "function") {
      (component as any).notifyChanged();
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
      <div className="prop-key">{label}</div>
      <div className="prop-value">{editor}</div>
    </div>
  );
}
