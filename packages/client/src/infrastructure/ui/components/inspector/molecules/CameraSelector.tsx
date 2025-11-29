import { SelectField, SelectOption } from '../../common/molecules/SelectField';
import { CameraIcon, EntityIcon } from '../../common/icons';

type Props = {
  entities: any[];
  activeCamera: string | null;
  onSetActive: (id: string) => void;
};

export function CameraSelector({ entities, activeCamera, onSetActive }: Props) {
  const options: SelectOption<string>[] = [
    { value: '', label: 'None' },
    ...entities.map((ce: any) => ({
      value: ce.id,
      label: ce.id,
      icon: ce.hasComponent && ce.hasComponent('cameraView') ? <CameraIcon /> : <EntityIcon />,
    })),
  ];

  return (
    <div style={{ marginTop: 6 }}>
      <SelectField value={activeCamera || ''} options={options} placeholder="None" onChange={(v) => { if (v) onSetActive(v); }} />
    </div>
  );
}
