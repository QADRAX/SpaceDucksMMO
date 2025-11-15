import { useState } from "preact/hooks";
import "./lobby.css";
import ServerSelectorPopup from "./ServerSelectorPopup";
import SettingsPopup from "../settings/SettingsPopup";
import IconButton from "../common/utility/IconButton";
import Button from "../common/utility/Button";
import useI18n from "../../hooks/useI18n";
import { useNavigation } from "../../hooks/useServices";
import { SettingsIcon } from "../common/icons";
import { GameScreens } from "@client/domain/ui/GameScreenRegistry";

export default function LobbyApp() {
  const { t } = useI18n();
  const { navigateTo } = useNavigation();
  const [showServerPopup, setShowServerPopup] = useState(false);
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);

  const handleSandboxClick = async () => {
    await navigateTo(GameScreens.Sandbox);
  };

  const handleEcsDemoClick = async () => {
    await navigateTo(GameScreens.EcsDemo);
  };

  return (
    <div className="lobby-container">
      {/* Settings button - top right */}
      <div className="settings-btn-wrapper">
        <IconButton
          icon={<SettingsIcon size={20} />}
          title={t('lobby.settings')}
          variant="secondary"
          onClick={() => setShowSettingsPopup(true)}
        />
      </div>

      {/* Center content - logo + play button */}
      <div className="lobby-center">
        <img src="/assets/images/logo.png" alt="SpaceDucks Logo" className="lobby-logo" />
        <div className="lobby-buttons">
          <Button
            variant="primary"
            size="large"
            onClick={() => setShowServerPopup(true)}
          >
            {t('lobby.play')}
          </Button>
          
          <Button
            variant="secondary"
            size="medium"
            onClick={handleSandboxClick}
          >
            🧪 Sandbox
          </Button>
          <Button
            variant="secondary"
            size="medium"
            onClick={handleEcsDemoClick}
          >
            ⚙️ ECS Demo
          </Button>
        </div>
      </div>

      {/* Popups */}
      <ServerSelectorPopup
        isOpen={showServerPopup}
        onClose={() => setShowServerPopup(false)}
      />

      <SettingsPopup
        isOpen={showSettingsPopup}
        onClose={() => setShowSettingsPopup(false)}
      />
    </div>
  );
}
