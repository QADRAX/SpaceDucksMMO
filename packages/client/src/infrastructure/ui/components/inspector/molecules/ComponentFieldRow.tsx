import { renderPropertyWithConfig } from './ValueEditor';
import type { InspectorFieldConfig } from '@client/domain/ecs/core/ComponentMetadata';

type Props = {
  component: any;
  fieldKey: string;
  fieldConfig?: InspectorFieldConfig;
  services?: any;
};

export function ComponentFieldRow({ component, fieldKey, fieldConfig, services }: Props) {
  const label = fieldConfig?.label ?? fieldKey;
  return (
    <div className="prop-row" key={fieldKey}>
      <div className="prop-key">{label}</div>
      <div className="prop-value">
        {renderPropertyWithConfig(component, fieldKey, fieldConfig, services)}
      </div>
    </div>
  );
}
