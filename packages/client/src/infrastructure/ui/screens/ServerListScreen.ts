import type IScreen from '../../../domain/ports/IScreen';
import ScreenId from '../../../domain/ui/ScreenId';
import type ServerBrowserService from '../../../application/ServerBrowserService';

export class ServerListScreen implements IScreen {
  id = ScreenId.ServerList;
  private el!: HTMLElement;
  constructor(private go: (id: ScreenId) => void, private servers: ServerBrowserService) {}
  mount(container: HTMLElement): void {
    this.el = document.createElement('div');
    this.el.className = 'ui-panel stack';

    const header = document.createElement('div');
    header.className = 'group';
    const back = document.createElement('button');
    back.textContent = '< Back';
    back.className = 'btn ghost';
    back.onclick = () => this.go(ScreenId.Main);
    const title = document.createElement('h4');
    title.textContent = 'Servers';
    title.className = 'ui-title';
    header.append(back, title);

    // Form to add server
    const form = document.createElement('div');
    form.className = 'stack';

    const nameInput = document.createElement('input');
    nameInput.placeholder = 'Server name';
    nameInput.className = 'input';

    const regionInput = document.createElement('input');
    regionInput.placeholder = 'Region (e.g., eu-west, us-east)';
    regionInput.className = 'input';

    const urlInput = document.createElement('input');
    urlInput.placeholder = 'URL (e.g., http://host:port)';
    urlInput.className = 'input';

    const actions = document.createElement('div');
    actions.className = 'group';
    const addBtn = document.createElement('button');
    addBtn.textContent = 'Add server';
    addBtn.className = 'btn primary';

    const errorEl = document.createElement('div');
    errorEl.style.color = '#f87171';
    errorEl.style.fontSize = '12px';
    errorEl.style.minHeight = '16px';

    addBtn.onclick = async () => {
      errorEl.textContent = '';
      const name = nameInput.value.trim();
      const region = regionInput.value.trim();
      const url = urlInput.value.trim();
      if (!name || !url) {
        errorEl.textContent = 'Name and URL are required';
        return;
        }
      try {
        await this.servers.add({ name, region, url });
        nameInput.value = '';
        regionInput.value = '';
        urlInput.value = '';
        await renderList();
      } catch (e: any) {
        errorEl.textContent = e?.message ?? 'Unable to add server';
      }
    };
    actions.append(addBtn);
    form.append(nameInput, regionInput, urlInput, actions, errorEl);

    const listTitle = document.createElement('div');
    listTitle.className = 'label';
    listTitle.textContent = 'Registered servers';

    const list = document.createElement('div');
    list.className = 'stack';

    this.el.append(header, form, listTitle, list);
    container.appendChild(this.el);

    const renderList = async () => {
      list.innerHTML = '';
      const items = await this.servers.list();
      if (items.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'label';
        empty.textContent = 'No servers yet. Add one above.';
        list.appendChild(empty);
        return;
      }
      items.forEach(s => {
        const row = document.createElement('div');
        row.className = 'group';
        const info = document.createElement('div');
        info.className = 'server-item';
        info.style.flex = '1';
        info.textContent = `${s.name} (${s.region}) — ${s.url}`;
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.className = 'btn';
        removeBtn.onclick = async () => {
          await this.servers.remove(s.id);
          await renderList();
        };
        row.append(info, removeBtn);
        list.appendChild(row);
      });
    };

    renderList();
  }
  unmount(): void { this.el.remove(); }
}

export default ServerListScreen;
