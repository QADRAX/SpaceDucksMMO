import { useEffect, useMemo, useState } from 'preact/hooks';
import type Entity from '@client/domain/ecs/core/Entity';
import { useServices } from '../../../hooks/useServices';
import { useI18n } from '../../../hooks/useI18n';
import { ComponentSection } from './ComponentSection';
import { AddComponentSection } from '../molecules/AddComponentSection';

type Props = { entity?: Entity };

export function ComponentInspector({ entity }: Props) {
  const services = useServices();
  const { t } = useI18n();
  const [added, setAdded] = useState(0);

  const components = useMemo(() => (entity ? entity.getAllComponents() : []), [entity, added]);

  useEffect(() => {
    const unsub = services.sceneManager?.subscribeToSceneChanges(() => setAdded((c) => c + 1));
    return () => { try { unsub && unsub(); } catch {} };
  }, [services.sceneManager]);

  if (!entity) return <div className="small-label">{t('inspector.noEntitySelected','No entity selected')}</div>;

  const onChanged = () => setAdded((c) => c + 1);

  return (
    <div>
      <div className="component-inspector-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="small-label">{t('inspector.components','Components')}</div>
        <div>
          {/* AddComponentSection handles grouped selection */}
          <AddComponentSection entity={entity} services={services} onAdded={onChanged} t={t} />
        </div>
      </div>

      <div className="components-list" style={{ marginTop: 8 }}>
        {components.map((c: any) => (
          <ComponentSection key={c.type} component={c} entity={entity} services={services} onChanged={onChanged} t={t} />
        ))}
      </div>
    </div>
  );
}
