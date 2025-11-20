import Component from '@client/domain/ecs/core/Component';
import type { InspectorFieldConfig } from '@client/domain/ecs/core/ComponentMetadata';
import Services from '@client/infrastructure/di/Services';

type Props = {
  component: Component;
  fieldKey: string;
  fieldConfig?: InspectorFieldConfig;
  services?: Services;
};

export function ComponentFieldRow({ component, fieldKey, fieldConfig, services }: Props) {
  const label = fieldConfig?.label ?? fieldKey;
  return (
    <div className="prop-row" key={fieldKey}>
      <div className="prop-key">{label}</div>
      <div className="prop-value">
        {/* TODO */}
      </div>
    </div>
  );
}
