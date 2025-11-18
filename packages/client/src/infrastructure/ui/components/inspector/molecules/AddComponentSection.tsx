import type Entity from '@client/domain/ecs/core/Entity';

type Props = {
  entity: Entity;
  services: any;
  onAdded: () => void;
  t: (k: string, f?: string) => string;
};

export function AddComponentSection({ entity, services, onAdded, t }: Props) {
  const factory = services.ecsComponentFactory;
  return (
    <div style={{ marginTop: 8 }}>
      <div className="small-label">{t('inspector.addComponent','Add Component')}</div>
      <div style={{ marginTop: 4 }}>
        <select
          className="select-input"
          onChange={(e: JSX.TargetedEvent<HTMLSelectElement, Event>) => {
            const value = e.currentTarget.value as string | '';
            if (!value) return;
            if (!factory) { alert(t('inspector.addComponentNoFactory','No component factory available')); return; }
            try {
              const comp = factory.create(value as any);
              const res = entity.safeAddComponent(comp);
              if (!res.ok) alert(res.error.message);
              else onAdded();
            } catch (err: any) { alert(err?.message || String(err)); }
            e.currentTarget.value = '';
          }}
        >
          <option value="">{t('inspector.selectComponent','Select...')}</option>
          {factory && entity ? factory.listCreatableComponents(entity).map((d: any) => (
            <option key={d.type} value={d.type}>{d.label}</option>
          )) : null}
        </select>
      </div>
    </div>
  );
}
