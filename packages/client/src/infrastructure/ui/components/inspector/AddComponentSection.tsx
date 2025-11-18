import { h } from 'preact';
import type Entity from '@client/domain/ecs/core/Entity';

type Props = {
  entity: Entity;
  services: any;
  onAdded: () => void;
  t: (k: string, f?: string) => string;
};

export default function AddComponentSection({ entity, services, onAdded, t }: Props) {
  const factory = services.ecsComponentFactory;
  return (
    <div style={{ marginTop: 8 }}>
      <div class="small-label">{t('inspector.addComponent','Add Component')}</div>
      <div style={{ marginTop: 4 }}>
        <select
          class="select-input"
          onChange={(e: any) => {
            const value = e.target.value as string | '';
            if (!value) return;
            if (!factory) { alert(t('inspector.addComponentNoFactory','No component factory available')); return; }
            try {
              const comp = factory.create(value as any);
              const res = entity.safeAddComponent(comp);
              if (!res.ok) alert(res.error.message);
              else onAdded();
            } catch (err: any) { alert(err?.message || String(err)); }
            e.target.value = '';
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
