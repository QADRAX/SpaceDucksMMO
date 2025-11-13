/** @jsxImportSource preact */
import type { ComponentChild } from 'preact';
import ScreenId from '../../../domain/ui/ScreenId';
import BaseScreen from './BaseScreen';
import LobbyApp from '../components/lobby/LobbyApp';
import '../styles/base.css';

/**
 * Main Screen - Lobby/Main Menu
 * 
 * Shows the main menu with:
 * - Logo
 * - Play button (opens server selector)
 * - Sandbox button (navigate to testing environment)
 * - Settings button
 */
export class MainScreen extends BaseScreen {
  constructor() {
    super(ScreenId.Main);
  }

  protected renderContent(): ComponentChild {
    return <LobbyApp />;
  }
}

export default MainScreen;
