import type Entity from '@client/domain/ecs/core/Entity';
import { SelectOption, SelectField } from '../../common/molecules/SelectField';
import { GeometryIcon, CameraIcon, LightIcon, EntityIcon } from '../../common/icons';

type Props = {
  entity: Entity;
  services: any;
  onAdded: () => void;
  t: (k: string, f?: string) => string;
};

export function AddComponentSection({ entity, services, onAdded, t }: Props) {
  const factory = services.ecsComponentFactory;

  const list = factory && entity ? factory.listCreatableComponents(entity) as any[] : [];

  const options: SelectOption<string>[] = list.map((d: any) => {
    let icon = <EntityIcon />;
    const type = String(d.type).toLowerCase();
    if (type.includes('geometry')) icon = <GeometryIcon />;
    else if (type.includes('camera')) icon = <CameraIcon />;
    else if (type.includes('light')) icon = <LightIcon />;
    return { value: d.type, label: d.label, icon, group: type.includes('geometry') ? 'Geometry' : type.includes('material') ? 'Material' : type.includes('camera') ? 'Camera' : type.includes('light') ? 'Light' : 'Other' };
  });

  const handleChange = (v: string | null) => {
    if (!v) return;
    if (!factory) { alert(t('inspector.addComponentNoFactory','No component factory available')); return; }
    try {
      const comp = factory.create(v as any);
      const res = entity.safeAddComponent(comp);
      if (!res.ok) alert(res.error.message);
      else onAdded();
    } catch (err: any) { alert(err?.message || String(err)); }
  };

  return (
    <div style={{ marginTop: 8 }}>
      <div className="small-label">{t('inspector.addComponent','Add Component')}</div>
      <div style={{ marginTop: 6 }}>
        <SelectField value={null} options={options} placeholder={t('inspector.selectComponent','Select...')} onChange={handleChange} />
      </div>
    </div>
  );
}

export default AddComponentSection;
