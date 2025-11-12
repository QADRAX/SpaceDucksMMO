/** @jsxImportSource preact */
import { render, FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import type IScreen from '../../../domain/ports/IScreen';
import ScreenId from '../../../domain/ui/ScreenId';
import type SettingsService from '../../../application/SettingsService';
import type IGraphicsController from '../../../application/ui/IGraphicsController';

interface SettingsViewProps {
  go: (id: ScreenId) => void;
  settings: SettingsService;
  gfx: IGraphicsController;
}

const presets = ['low','medium','high','ultra','custom'] as const;

const SettingsView: FunctionComponent<SettingsViewProps> = ({ go, settings, gfx }) => {
  const [current, setCurrent] = useState<any>(null);
  const [preset, setPreset] = useState<string>('high');

  useEffect(() => {
    settings.load().then(s => { setCurrent(s); setPreset(s.graphics.qualityPreset ?? 'high'); });
  }, []);

  const applyPreset = () => {
    if (!current) return;
    const p = preset;
    if (p !== 'custom') {
      if (p === 'low') { current.graphics.antialias = false; current.graphics.shadows = false; }
      if (p === 'medium') { current.graphics.antialias = false; current.graphics.shadows = true; }
      if (p === 'high') { current.graphics.antialias = true; current.graphics.shadows = true; }
      if (p === 'ultra') { current.graphics.antialias = true; current.graphics.shadows = true; }
      current.graphics.qualityPreset = p;
    } else {
      current.graphics.qualityPreset = 'custom';
    }
    settings.save(current);
    gfx.setAntialias(current.graphics.antialias);
    gfx.setShadows(current.graphics.shadows);
  };

  return (
    <div className="ui-panel stack">
      <div className="group">
        <button className="btn ghost" onClick={() => go(ScreenId.Main)}>&lt; Back</button>
        <h4 className="ui-title" style={{ margin: 0 }}>Settings</h4>
      </div>

      <label className="label">Quality Preset</label>
      <select className="select" value={preset} onChange={e => setPreset((e.target as HTMLSelectElement).value)}>
        {presets.map(p => <option value={p}>{p[0].toUpperCase()+p.slice(1)}</option>)}
      </select>

      <button className="btn primary" onClick={applyPreset} disabled={!current}>Save</button>
    </div>
  );
};

export class SettingsScreen implements IScreen {
  id = ScreenId.Settings;
  private el!: HTMLElement;
  constructor(private go: (id: ScreenId) => void, private settings: SettingsService, private gfx: IGraphicsController) {}
  mount(container: HTMLElement): void {
    this.el = document.createElement('div');
    render(<SettingsView go={this.go} settings={this.settings} gfx={this.gfx} />, this.el);
    container.appendChild(this.el);
  }
  unmount(): void {
    render(null as any, this.el);
    this.el.remove();
  }
}

export default SettingsScreen;
