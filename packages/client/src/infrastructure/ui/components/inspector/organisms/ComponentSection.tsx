import ComponentFieldList from '../molecules/ComponentFieldList';
import type Entity from '@client/domain/ecs/core/Entity';

type Props = {
  component: any;
  entity: Entity;
  services: any;
  onChanged: () => void;
  t: (k: string, f?: string) => string;
};

export default function ComponentSection({ component, entity, services, onChanged, t }: Props) {
  const handleRemove = () => {
    const res = entity.safeRemoveComponent(component.type);
    if (!res.ok) alert(res.error.message);
    else onChanged();
  };
  const handleToggle = () => {
    try { component.enabled = !component.enabled; } catch {}
    onChanged();
  };

  return (
    <div class="component-section" key={component.type}>
      <div class="component-header">
        <div>{component.type}</div>
        <div class="component-controls">
          <label>
            <input type="checkbox" checked={component.enabled} onChange={handleToggle} /> {t('inspector.enabled','Enabled')}
          </label>
          <button onClick={handleRemove}>{t('inspector.remove','Remove')}</button>
        </div>
      </div>
      <ComponentFieldList component={component} services={services} />
    </div>
  );
}
