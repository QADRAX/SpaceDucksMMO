import type { ComponentChildren } from "preact";
import type { InspectorFieldConfig } from "@client/domain/ecs/core/ComponentMetadata";
import { NullableToggleEditor } from "./NullableToggleEditor";

type NullableFieldWrapperProps = {
  value: unknown;
  fieldKey: string;
  fieldConfig: InspectorFieldConfig;
  onChange: (nv: unknown) => void;
  children: ComponentChildren;
};

/**
 * Wraps a field editor with a nullable toggle.
 * Semantics:
 * - undefined => disabled
 * - any other value (including null, 0, false, '') => enabled
 */
export function NullableFieldWrapper({
  value,
  fieldKey,
  fieldConfig,
  onChange,
  children,
}: NullableFieldWrapperProps) {
  const enabled = value !== undefined;

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

  const defaultValue =
    fieldConfig.default !== undefined
      ? fieldConfig.default
      : getDefaultForType(fieldKey, fieldConfig.type);

  const handleToggle = (checked: boolean) => {
    if (checked) {
      onChange(defaultValue);
    } else {
      onChange(undefined);
    }
  };

  return (
    <NullableToggleEditor enabled={enabled} onToggle={handleToggle}>
      {children}
    </NullableToggleEditor>
  );
}
