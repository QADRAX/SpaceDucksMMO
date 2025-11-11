import type IScreen from '../../../domain/ports/IScreen';
import ScreenId from '../../../domain/ui/ScreenId';
import type SettingsService from '../../../application/SettingsService';
import type IGraphicsController from '../../../application/ui/IGraphicsController';

export class SettingsScreen implements IScreen {
  id = ScreenId.Settings;
  private el!: HTMLElement;
  constructor(
    private go: (id: ScreenId) => void,
    private settings: SettingsService,
    private gfx: IGraphicsController
  ) {}

  mount(container: HTMLElement): void {
    this.el = document.createElement('div');
    const back = document.createElement('button');
    back.textContent = '< Back';
    back.onclick = () => this.go(ScreenId.Main);
    const title = document.createElement('h4');
    title.textContent = 'Settings';
    const save = document.createElement('button');
    save.textContent = 'Save';

    const presetLabel = document.createElement('label');
    presetLabel.textContent = 'Quality Preset: ';
    const preset = document.createElement('select');
    const add = (v: string, t: string) => { const o = document.createElement('option'); o.value=v; o.text=t; preset.appendChild(o); };
    ['low','medium','high','ultra','custom'].forEach(p => add(p, p[0].toUpperCase()+p.slice(1)));

    let current: any;
    this.settings.load().then(s => {
      current = s;
      preset.value = s.graphics.qualityPreset ?? 'high';
    });

    save.onclick = () => {
      const p = preset.value as any;
      if (p !== 'custom') {
        if (p === 'low') { current.graphics.antialias = false; current.graphics.shadows = false; }
        if (p === 'medium') { current.graphics.antialias = false; current.graphics.shadows = true; }
        if (p === 'high') { current.graphics.antialias = true; current.graphics.shadows = true; }
        if (p === 'ultra') { current.graphics.antialias = true; current.graphics.shadows = true; }
        current.graphics.qualityPreset = p;
      } else {
        current.graphics.qualityPreset = 'custom';
      }
      this.settings.save(current);
      this.gfx.setAntialias(current.graphics.antialias);
      this.gfx.setShadows(current.graphics.shadows);
    };

    this.el.append(back, title, presetLabel, preset, save);
    container.appendChild(this.el);
  }

  unmount(): void { this.el.remove(); }
}

export default SettingsScreen;
