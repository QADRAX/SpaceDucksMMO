import { useI18n } from "@client/infrastructure/ui/hooks/useI18n";
import { useServices } from "@client/infrastructure/ui/hooks/useServices";
import { useEffect, useState } from "preact/hooks";
import SelectField from "@client/infrastructure/ui/components/common/molecules/SelectField";

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

  const options = [
    { value: '', label: placeholder || t('inspector.noParent', 'No parent') },
    ...entities.map((ent) => ({ value: ent.id, label: ent.id }))
  ];

  return (
    <div className={`reference-field ${className || ''}`}>
      <SelectField value={value || ''} options={options} placeholder={placeholder || t('inspector.noParent', 'No parent')} onChange={(v) => onChange(v || null)} />
      {!isValid && <div className="small-label invalid-ref">{t('inspector.invalidReference', 'Invalid reference')}</div>}
    </div>
  );
}
