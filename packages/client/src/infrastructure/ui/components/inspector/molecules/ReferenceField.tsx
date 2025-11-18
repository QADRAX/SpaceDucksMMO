import { useI18n } from "@client/infrastructure/ui/hooks/useI18n";
import { useServices } from "@client/infrastructure/ui/hooks/useServices";
import { useEffect, useState } from "preact/hooks";

type Props = {
  value: string | null | undefined;
  onChange: (id: string | null) => void;
  placeholder?: string;
  className?: string;
};

export function ReferenceField({ value, onChange, placeholder, className }: Props) {
  const services = useServices();
  const { t } = useI18n();
  const [entities, setEntities] = useState(() => Array.from(services.sceneManager?.getEntities() || []));

  useEffect(() => {
    const mgr = services.sceneManager;
    if (!mgr) return;
    const update = () => setEntities(Array.from(mgr.getEntities()));
    update();
    const unsub = mgr.subscribeToSceneChanges
      ? mgr.subscribeToSceneChanges((ev: any) => {
          if (["entity-added", "entity-removed", "hierarchy-changed"].includes(ev.kind)) update();
        })
      : undefined;
    return () => {
      try {
        unsub && unsub();
      } catch {}
    };
  }, [services.sceneManager]);

  const isValid = !value || entities.find((e: any) => e.id === value);

  return (
    <div className={`reference-field ${className || ""}`}>
      <select
        className="select-input"
        value={value || ""}
        onChange={(e: JSX.TargetedEvent<HTMLSelectElement, Event>) => onChange(e.currentTarget.value || null)}
      >
        <option value="">{placeholder || t("inspector.noParent", "No parent")}</option>
        {entities.map((ent) => (
          <option key={ent.id} value={ent.id}>
            {ent.id}
          </option>
        ))}
      </select>
      {!isValid && <div className="small-label invalid-ref">{t("inspector.invalidReference", "Invalid reference")}</div>}
    </div>
  );
}
