import { useState, useEffect } from "preact/hooks";
import type { GameSettings } from "@client/domain/settings/GameSettings";
import { useServices } from "./useServices";

/**
 * Hook to access and modify game settings
 * Automatically subscribes to settings changes and re-renders
 */
export function useSettings() {
  const { settings: settingsService } = useServices();
  const [settings, setSettings] = useState<GameSettings>(settingsService.getSettings());

  useEffect(() => {
    // Subscribe to settings changes
    const unsubscribe = settingsService.subscribe((newSettings) => {
      setSettings(newSettings);
    });

    return unsubscribe;
  }, [settingsService]);

  /**
   * Update a specific setting path and apply immediately
   * @example updateSetting('graphics.antialias', true)
   * @example updateSetting('audio.masterVolume', 0.8)
   */
  const updateSetting = async (path: string, value: any) => {
    const keys = path.split('.');
    const newSettings = JSON.parse(JSON.stringify(settings)); // deep clone
    
    let current: any = newSettings;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;

    await settingsService.updateSettings(newSettings);
  };

  return {
    settings,
    updateSetting,
  };
}

export default useSettings;
