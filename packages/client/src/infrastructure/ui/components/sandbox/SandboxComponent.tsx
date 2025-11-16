/** @jsxImportSource preact */
import { useState, useEffect } from 'preact/hooks';
import { useNavigation } from '../../hooks/useServices';
import useI18n from '../../hooks/useI18n';
import { GameScreens } from '@client/domain/ui/GameScreenRegistry';
import Button from '../common/utility/Button';
import IconButton from '../common/utility/IconButton';
import { SettingsIcon } from '../common/icons';
import SettingsPopup from '../settings/SettingsPopup';
import './sandbox.css';

/**
 * Sandbox Component - UI for visual component testing and scene editing
 */
export function SandboxComponent() {
  const [, forceUpdate] = useState({});
  const { navigateTo } = useNavigation();
  const { t } = useI18n();
  const [showSettings, setShowSettings] = useState(false);


  // Force re-render after scene is loaded
  useEffect(() => {
    const timer = setTimeout(() => forceUpdate({}), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleBackToMenu = async () => {
    await navigateTo(GameScreens.MainMenu);
  };

  return (
    <div class="sandbox-container">

      <div class="sandbox-topbar">
        <div class="sandbox-topbar-buttons">
          <Button
            variant="secondary"
            size="medium"
            onClick={handleBackToMenu}
          >
            ← {t('sandbox.backToMenu')}
          </Button>

          <IconButton
            icon={<SettingsIcon size={20} />}
            title={t('lobby.settings')}
            variant="secondary"
            onClick={() => setShowSettings(true)}
          />
        </div>
      </div>

      <SettingsPopup
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

export default SandboxComponent;
