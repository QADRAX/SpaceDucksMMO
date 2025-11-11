import type IScreen from '../../../domain/ports/IScreen';
import ScreenId from '../../../domain/ui/ScreenId';
import type ServerBrowserService from '../../../application/ServerBrowserService';

export class ServerListScreen implements IScreen {
  id = ScreenId.ServerList;
  private el!: HTMLElement;
  constructor(private go: (id: ScreenId) => void, private servers: ServerBrowserService) {}
  mount(container: HTMLElement): void {
    this.el = document.createElement('div');
    const back = document.createElement('button');
    back.textContent = '< Back';
    back.onclick = () => this.go(ScreenId.Main);
    const title = document.createElement('h4');
    title.textContent = 'Servers';
    const list = document.createElement('div');
    this.el.append(back, title, list);
    container.appendChild(this.el);
    this.servers.withLatency().then(items => {
      items.forEach(s => {
        const item = document.createElement('div');
        item.textContent = `${s.name} (${s.region}) - ${s.pingMs ?? '?'}ms`;
        list.appendChild(item);
      });
    });
  }
  unmount(): void { this.el.remove(); }
}

export default ServerListScreen;
