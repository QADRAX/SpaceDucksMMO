import { useState } from "preact/hooks";
import "./lobby.css";
import logo from "../../../../assets/images/logo.png";
import type ServerBrowserService from "@client/application/ServerBrowserService";
import ServerSelectorPopup from "./ServerSelectorPopup";
import SettingsPopup from "./SettingsPopup";
import IconButton from "../common/IconButton";
import Button from "../common/Button";

type Props = {
  serverBrowser?: ServerBrowserService;
};

export default function LobbyApp({ serverBrowser }: Props) {
  const [showServerPopup, setShowServerPopup] = useState(false);
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);

  return (
    <div className="lobby-container">
      {/* Settings button - top right */}
      <div className="settings-btn-wrapper">
        <IconButton
          icon="⚙️"
          title="Settings"
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
          Play
        </Button>
      </div>

      {/* Popups */}
      <ServerSelectorPopup
        isOpen={showServerPopup}
        serverBrowser={serverBrowser}
        onClose={() => setShowServerPopup(false)}
      />

      <SettingsPopup
        isOpen={showSettingsPopup}
        onClose={() => setShowSettingsPopup(false)}
      />
    </div>
  );
}
