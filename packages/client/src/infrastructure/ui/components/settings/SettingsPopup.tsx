/** @jsxImportSource preact */
import { Popup } from "../common/organisms/Popup";
import { FormSection } from "../common/molecules/FormSection";
import { FormField } from "../common/molecules/FormField";
import { Select } from "../common/molecules/Select";
import { Checkbox } from "../common/atoms";
import { Slider } from "../common/molecules/Slider";
import useI18n from "../../hooks/useI18n";
import useSettings from "../../hooks/useSettings";
import { SUPPORTED_LANGUAGES } from "@client/domain/i18n/Language";
import type { LanguageCode } from "@client/domain/i18n/Language";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function SettingsPopup({ isOpen, onClose }: Props) {
  const { t, language, changeLanguage } = useI18n();
  const { settings, updateSetting } = useSettings();

  // Quality preset options
  const qualityOptions = [
    { value: "low", label: t("settings.graphics.qualityLow") },
    { value: "medium", label: t("settings.graphics.qualityMedium") },
    { value: "high", label: t("settings.graphics.qualityHigh") },
    { value: "ultra", label: t("settings.graphics.qualityUltra") },
  ];

  // Language options with flags
  const languageOptions = SUPPORTED_LANGUAGES.map((lang) => ({
    value: lang.code,
    label: `${lang.flag} ${lang.name}`,
  }));

  return (
    <Popup isOpen={isOpen} onClose={onClose} title={t("settings.title")}>
      {/* Graphics Section */}
      <FormSection title={t("settings.graphics.title")}>
        <FormField label={t("settings.graphics.quality")}>
          <Select
            value={settings.graphics.qualityPreset}
            onChange={(value) => updateSetting("graphics.qualityPreset", value)}
            options={qualityOptions}
          />
        </FormField>
        <FormField label={t("settings.graphics.textureQuality")}>
          <Select
            value={settings.graphics.textureQuality}
            onChange={(value) =>
              updateSetting("graphics.textureQuality", value)
            }
            options={qualityOptions}
          />
        </FormField>
        <FormField label={t("settings.graphics.fullscreen")}>
          <Checkbox
            checked={settings.graphics.fullscreen}
            onChange={(checked) =>
              updateSetting("graphics.fullscreen", checked)
            }
          />
        </FormField>
        <FormField label={t("settings.graphics.antialiasing")}>
          <Checkbox
            checked={settings.graphics.antialias}
            onChange={(checked) => updateSetting("graphics.antialias", checked)}
          />
        </FormField>
        <FormField label={t("settings.graphics.shadows")}>
          <Checkbox
            checked={settings.graphics.shadows}
            onChange={(checked) => updateSetting("graphics.shadows", checked)}
          />
        </FormField>
      </FormSection>

      {/* Audio Section */}
      <FormSection title={t("settings.audio.title")}>
        <FormField label={t("settings.audio.masterVolume")}>
          <Slider
            value={Math.round(settings.audio.masterVolume * 100)}
            onChange={(value) =>
              updateSetting("audio.masterVolume", value / 100)
            }
            min={0}
            max={100}
          />
        </FormField>
        <FormField label={t("settings.audio.music")}>
          <Checkbox
            checked={settings.audio.musicVolume > 0}
            onChange={(checked) =>
              updateSetting("audio.musicVolume", checked ? 0.6 : 0)
            }
          />
        </FormField>
        <FormField label={t("settings.audio.soundEffects")}>
          <Checkbox
            checked={settings.audio.sfxVolume > 0}
            onChange={(checked) =>
              updateSetting("audio.sfxVolume", checked ? 0.8 : 0)
            }
          />
        </FormField>
      </FormSection>

      {/* Gameplay Section */}
      <FormSection title={t("settings.gameplay.title")}>
        <FormField label={t("settings.gameplay.mouseSensitivity")}>
          <Slider
            value={Math.round(settings.gameplay.mouseSensitivity * 10)}
            onChange={(value) =>
              updateSetting("gameplay.mouseSensitivity", value / 10)
            }
            min={1}
            max={100}
          />
        </FormField>
      </FormSection>

      {/* Language Section - Separate from Gameplay */}
      <FormSection title={t("settings.language.title")}>
        <FormField label={t("settings.language.select")}>
          <Select
            value={language}
            onChange={(lang) => changeLanguage(lang as LanguageCode)}
            options={languageOptions}
          />
        </FormField>
      </FormSection>
    </Popup>
  );
}
