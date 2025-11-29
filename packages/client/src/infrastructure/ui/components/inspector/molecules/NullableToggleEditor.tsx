import { PropertyCheckbox } from "../../common/atoms/PropertyCheckbox";
import { useI18n } from "../../../hooks/useI18n";
import './nullable-toggle-editor.css';

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
    <div className="nullable-toggle-editor">
      <PropertyCheckbox checked={enabled} onChange={onToggle} />
      {enabled ? (
        <div className="nullable-toggle-editor__content">{children}</div>
      ) : (
        <span style={{ color: "#888", fontStyle: "italic" }}>
          {t("inspector.disabled", "Disabled")}
        </span>
      )}
    </div>
  );
}
