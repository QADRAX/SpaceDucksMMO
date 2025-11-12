import type IScreen from '../../../domain/ports/IScreen';
import ScreenId from '../../../domain/ui/ScreenId';

export class MainScreen implements IScreen {
  id = ScreenId.Main;
  private el!: HTMLElement;
  constructor(private go: (id: ScreenId) => void) {}
  mount(container: HTMLElement): void {
    this.el = document.createElement('div');
    this.el.className = 'main-screen-container';
    
    // Logo centrado
    const logoContainer = document.createElement('div');
    logoContainer.className = 'logo-container';
    
    const logo = document.createElement('img');
    logo.src = '/assets/images/logo.png';
    logo.alt = 'SpaceDucks Logo';
    logo.className = 'main-logo';
    
    const title = document.createElement('h3');
    title.textContent = 'SpaceDucks - Main Menu';
    title.className = 'ui-title';
    
    logoContainer.append(logo, title);
    
    // Botones
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'main-menu-buttons';
    
    const servers = document.createElement('button');
    servers.textContent = 'Servers';
    servers.className = 'btn primary';
    servers.onclick = () => this.go(ScreenId.ServerList);
    
    const settings = document.createElement('button');
    settings.textContent = 'Settings';
    settings.className = 'btn primary';
    settings.onclick = () => this.go(ScreenId.Settings);
    
    buttonContainer.append(servers, settings);
    
    this.el.append(logoContainer, buttonContainer);
    container.appendChild(this.el);
  }
  unmount(): void { this.el.remove(); }
}

export default MainScreen;
