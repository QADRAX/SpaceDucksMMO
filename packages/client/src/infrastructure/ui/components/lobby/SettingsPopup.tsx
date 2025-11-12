import { useState } from "preact/hooks";
import Popup from "../common/utility/Popup";
import Button from "../common/utility/Button";
import FormSection from "../common/form/FormSection";
import FormField from "../common/form/FormField";
import Select from "../common/form/Select";
import Checkbox from "../common/form/Checkbox";
import Slider from "../common/form/Slider";
import useI18n from "../../hooks/useI18n";
import { SUPPORTED_LANGUAGES } from "@client/domain/i18n/Language";
import type { LanguageCode } from "@client/domain/i18n/Language";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function SettingsPopup({ isOpen, onClose }: Props) {
  const { t, language, changeLanguage } = useI18n();
  
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
    { value: "low", label: t('settings.graphics.qualityLow') },
    { value: "medium", label: t('settings.graphics.qualityMedium') },
    { value: "high", label: t('settings.graphics.qualityHigh') },
  ];

  const languageOptions = SUPPORTED_LANGUAGES.map(lang => ({
    value: lang.code,
    label: `${lang.flag} ${lang.name}`
  }));

  const handleLanguageChange = async (langCode: string) => {
    await changeLanguage(langCode as LanguageCode);
  };

  const footer = (
    <Button variant="primary" onClick={onClose}>
      {t('settings.saveChanges')}
    </Button>
  );

  return (
    <Popup isOpen={isOpen} onClose={onClose} title={t('settings.title')} footer={footer}>
      <FormSection title={t('settings.graphics.title')}>
        <FormField label={t('settings.graphics.quality')}>
          <Select value={quality} onChange={setQuality} options={qualityOptions} />
        </FormField>
        <FormField label={t('settings.graphics.antialiasing')}>
          <Checkbox checked={antialiasing} onChange={setAntialiasing} />
        </FormField>
        <FormField label={t('settings.graphics.shadows')}>
          <Checkbox checked={shadows} onChange={setShadows} />
        </FormField>
      </FormSection>

      <FormSection title={t('settings.audio.title')}>
        <FormField label={t('settings.audio.masterVolume')}>
          <Slider value={masterVolume} onChange={setMasterVolume} min={0} max={100} />
        </FormField>
        <FormField label={t('settings.audio.music')}>
          <Checkbox checked={music} onChange={setMusic} />
        </FormField>
        <FormField label={t('settings.audio.soundEffects')}>
          <Checkbox checked={soundEffects} onChange={setSoundEffects} />
        </FormField>
      </FormSection>

      <FormSection title={t('settings.gameplay.title')}>
        <FormField label={t('settings.gameplay.mouseSensitivity')}>
          <Slider value={mouseSensitivity} onChange={setMouseSensitivity} min={1} max={100} />
        </FormField>
        <FormField label={t('settings.gameplay.language')}>
          <Select value={language} onChange={handleLanguageChange} options={languageOptions} />
        </FormField>
      </FormSection>
    </Popup>
  );
}
