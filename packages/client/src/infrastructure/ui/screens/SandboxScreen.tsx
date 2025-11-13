/** @jsxImportSource preact */
import type { ComponentChild } from 'preact';
import ScreenId from '@client/domain/ui/ScreenId';
import BaseScreen from './BaseScreen';
import SandboxComponent from '../components/sandbox/SandboxComponent';

/**
 * Sandbox Screen - Testing/prototyping environment
 * 
 * Provides an interactive environment for testing visual components
 * with grid helpers, axes, lighting, and example objects.
 * 
 * Features:
 * - Navigation back to main menu
 * - Object spawning controls (future)
 * - Camera control panel (future)
 * - Scene stats display (future)
 * - Visual component library browser (future)
 */
export class SandboxScreen extends BaseScreen {
  constructor() {
    super(ScreenId.Sandbox);
  }

  protected renderContent(): ComponentChild {
    return <SandboxComponent />;
  }
}

export default SandboxScreen;
