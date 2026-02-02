/** @jsxImportSource preact */
import { h } from 'preact';
import BaseScreen from './BaseScreen';
import ScreenId from '@client/domain/ui/ScreenId';

export class SoccerFpsScreen extends BaseScreen {
  constructor() {
    super(ScreenId.SoccerFps);
  }

  protected renderContent() {
    // Minimal HUD overlay. Scene gameplay lives in SoccerFpsScene.
    return (
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        color: '#e5e7eb',
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
      }}>
        <div style={{
          position: 'absolute',
          top: 12,
          left: 12,
          padding: '10px 12px',
          background: 'rgba(0,0,0,0.35)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10,
          backdropFilter: 'blur(6px)',
          maxWidth: 360,
        }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Soccer FPS (prototype)</div>
          <div style={{ fontSize: 13, lineHeight: 1.4, opacity: 0.9 }}>
            <div>WASD: move</div>
            <div>Mouse: look (click to lock pointer)</div>
            <div>Space: jump</div>
            <div>Run into ball to kick</div>
          </div>
        </div>
      </div>
    );
  }
}

export default SoccerFpsScreen;
