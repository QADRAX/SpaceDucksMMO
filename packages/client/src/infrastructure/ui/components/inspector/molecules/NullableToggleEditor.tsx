import { PropertyCheckbox } from "../../common/atoms/PropertyCheckbox";
import { useI18n } from "../../../hooks/useI18n";

export type NullableToggleEditorProps = {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  children: preact.ComponentChildren;
};

export function NullableToggleEditor({
  enabled,
  onToggle,
  children,
}: NullableToggleEditorProps) {
  const { t } = useI18n();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <PropertyCheckbox checked={enabled} onChange={onToggle} />
      {enabled ? (
        <div style={{ flex: 1 }}>{children}</div>
      ) : (
        <span style={{ color: "#888", fontStyle: "italic" }}>
          {t("inspector.disabled", "Disabled")}
        </span>
      )}
    </div>
  );
}
