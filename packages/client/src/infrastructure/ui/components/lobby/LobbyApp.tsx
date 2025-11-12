import { useState } from "preact/hooks";
import "./lobby.css";
import logo from "../../../../assets/images/logo.png";
import ServerSelectorPopup from "./ServerSelectorPopup";
import SettingsPopup from "./SettingsPopup";
import IconButton from "../common/utility/IconButton";
import Button from "../common/utility/Button";
import useI18n from "../../hooks/useI18n";
import { SettingsIcon } from "../common/icons";

export default function LobbyApp() {
  const { t } = useI18n();
  const [showServerPopup, setShowServerPopup] = useState(false);
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);

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
        <img src={logo} alt="SpaceDucks Logo" className="lobby-logo" />
        <Button
          variant="primary"
          size="large"
          onClick={() => setShowServerPopup(true)}
        >
          {t('lobby.play')}
        </Button>
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
