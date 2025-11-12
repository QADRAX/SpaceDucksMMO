import { useState } from "preact/hooks";
import Popup from "../common/utility/Popup";
import Button from "../common/utility/Button";
import FormSection from "../common/form/FormSection";
import FormField from "../common/form/FormField";
import Select from "../common/form/Select";
import Checkbox from "../common/form/Checkbox";
import Slider from "../common/form/Slider";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function SettingsPopup({ isOpen, onClose }: Props) {
  // Graphics settings
  const [quality, setQuality] = useState("high");
  const [antialiasing, setAntialiasing] = useState(true);
  const [shadows, setShadows] = useState(true);

  // Audio settings
  const [masterVolume, setMasterVolume] = useState(80);
  const [music, setMusic] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);

  // Gameplay settings
  const [mouseSensitivity, setMouseSensitivity] = useState(50);

  const qualityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ];

  const footer = (
    <Button variant="primary" onClick={onClose}>
      Save Changes
    </Button>
  );

  return (
    <Popup isOpen={isOpen} onClose={onClose} title="Settings" footer={footer}>
      <FormSection title="Graphics">
        <FormField label="Quality">
          <Select value={quality} onChange={setQuality} options={qualityOptions} />
        </FormField>
        <FormField label="Antialiasing">
          <Checkbox checked={antialiasing} onChange={setAntialiasing} />
        </FormField>
        <FormField label="Shadows">
          <Checkbox checked={shadows} onChange={setShadows} />
        </FormField>
      </FormSection>

      <FormSection title="Audio">
        <FormField label="Master Volume">
          <Slider value={masterVolume} onChange={setMasterVolume} min={0} max={100} />
        </FormField>
        <FormField label="Music">
          <Checkbox checked={music} onChange={setMusic} />
        </FormField>
        <FormField label="Sound Effects">
          <Checkbox checked={soundEffects} onChange={setSoundEffects} />
        </FormField>
      </FormSection>

      <FormSection title="Gameplay">
        <FormField label="Mouse Sensitivity">
          <Slider value={mouseSensitivity} onChange={setMouseSensitivity} min={1} max={100} />
        </FormField>
      </FormSection>
    </Popup>
  );
}
