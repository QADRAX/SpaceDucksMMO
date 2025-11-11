import type IScreen from '../../../domain/ports/IScreen';
import ScreenId from '../../../domain/ui/ScreenId';

export class MainScreen implements IScreen {
  id = ScreenId.Main;
  private el!: HTMLElement;
  constructor(private go: (id: ScreenId) => void) {}
  mount(container: HTMLElement): void {
    this.el = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = 'SpaceDucks - Main Menu';
    const servers = document.createElement('button');
    servers.textContent = 'Servers';
    servers.onclick = () => this.go(ScreenId.ServerList);
    const settings = document.createElement('button');
    settings.textContent = 'Settings';
    settings.onclick = () => this.go(ScreenId.Settings);
    this.el.append(title, servers, settings);
    container.appendChild(this.el);
  }
  unmount(): void { this.el.remove(); }
}

export default MainScreen;
