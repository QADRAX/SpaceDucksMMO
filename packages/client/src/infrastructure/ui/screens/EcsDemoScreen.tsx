/** @jsxImportSource preact */
import type { ComponentChild } from 'preact';
import ScreenId from '@client/domain/ui/ScreenId';
import BaseScreen from './BaseScreen';
import { GameScreens } from '@client/domain/ui/GameScreenRegistry';
import { DraggablePanel } from '../components/common/organisms/DraggablePanel';
import Button from '../components/common/atoms/Button';

export class EcsDemoScreen extends BaseScreen {
  constructor() {
    super(ScreenId.EcsDemo);
  }

  protected renderContent(): ComponentChild {
    // Use DraggablePanel from common components to ensure visible UI with high z-index
    const navigate = (this.services as any)?.navigation as any;

    return (
      <DraggablePanel title="ECS Demo" theme="gold" defaultPosition={{ x: 24, y: 80 }} defaultSize={{ width: 360, height: 240 }}>
        <div style={{ color: '#fff' }}>
          <h3 style={{ marginTop: 0 }}>ECS Demo</h3>
          <p>Small demo scene built with the new ECS primitives. This panel is draggable and stays above the canvas.</p>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="medium" onClick={() => navigate?.navigateTo(GameScreens.MainMenu)}>← Back</Button>
          </div>
        </div>
      </DraggablePanel>
    );
  }
}

export default EcsDemoScreen;
