import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { useServices } from "../../hooks/useServices";
import { useI18n } from "../../hooks/useI18n";

type Props = {
  value: string | null | undefined;
  onChange: (id: string | null) => void;
  placeholder?: string;
  className?: string;
};

export default function ReferenceField({
  value,
  onChange,
  placeholder,
  className,
}: Props) {
  const services = useServices();
  const { t } = useI18n();
  const [entities, setEntities] = useState(() => Array.from(services.sceneManager?.getEntities() || []));

  useEffect(() => {
    const mgr = services.sceneManager;
    if (!mgr) return;
    const update = () => setEntities(Array.from(mgr.getEntities()));
    // initial
    update();
    const unsub = mgr.subscribeToSceneChanges
      ? mgr.subscribeToSceneChanges((ev: any) => {
          if (["entity-added", "entity-removed", "hierarchy-changed"].includes(ev.kind)) update();
        })
      : undefined;
    return () => { try { unsub && unsub(); } catch {} };
  }, [services.sceneManager]);

  const isValid = !value || entities.find((e) => e.id === value);

  return (
    <div class={`reference-field ${className || ""}`}>
      <select
        class="select-input"
        value={value || ""}
        onChange={(e: any) => onChange(e.target.value || null)}
      >
        <option value="">
          {placeholder || t("inspector.noParent", "No parent")}
        </option>
        {entities.map((ent) => (
          <option key={ent.id} value={ent.id}>
            {ent.id}
          </option>
        ))}
      </select>
      {!isValid && (
        <div class="small-label invalid-ref">
          {t("inspector.invalidReference", "Invalid reference")}
        </div>
      )}
    </div>
  );
}
