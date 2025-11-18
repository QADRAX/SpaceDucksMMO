import { renderPropertyWithConfig } from './ValueEditor';
import type { InspectorFieldConfig } from '@client/domain/ecs/core/ComponentMetadata';

type Props = {
  component: any;
  fieldKey: string;
  fieldConfig?: InspectorFieldConfig;
  services?: any;
};

export default function ComponentFieldRow({ component, fieldKey, fieldConfig, services }: Props) {
  const label = fieldConfig?.label ?? fieldKey;
  return (
    <div class="prop-row" key={fieldKey}>
      <div class="prop-key">{label}</div>
      <div class="prop-value">
        {renderPropertyWithConfig(component, fieldKey, fieldConfig, services)}
      </div>
    </div>
  );
}
