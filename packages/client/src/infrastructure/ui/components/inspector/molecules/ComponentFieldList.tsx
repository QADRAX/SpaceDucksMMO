import Component from '@client/domain/ecs/core/Component';
import { ComponentFieldRow } from './ComponentFieldRow';
import type { InspectorFieldConfig } from '@client/domain/ecs/core/ComponentMetadata';
import Services from '@client/infrastructure/di/Services';

type Props = {
  component: Component;
  services?: Services;
};

export function ComponentFieldList({ component, services }: Props) {
  const meta = (component as any).metadata as any | undefined;
  let fields: { key: string; cfg?: InspectorFieldConfig }[] = [];
  if (meta?.inspector && Array.isArray(meta.inspector.fields)) {
    fields = meta.inspector.fields.map((f: any) => ({ key: f.key, cfg: f }));
  } else {
    fields = Object.keys(component)
      .filter((k) => k !== 'metadata' && k !== 'type' && !k.startsWith('_'))
      .filter((k) => typeof (component as any)[k] !== 'function')
      .filter((k) => !['scene', 'renderer', 'renderSyncSystem'].includes(k))
      .map((k) => ({ key: k }));
  }

  return (
    <div style={{ paddingTop: 6 }}>
      {fields.map((f) => (
        <ComponentFieldRow key={f.key} component={component} fieldKey={f.key} fieldConfig={f.cfg} services={services} />
      ))}
    </div>
  );
}
