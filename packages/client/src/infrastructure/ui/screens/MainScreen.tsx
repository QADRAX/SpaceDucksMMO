/** @jsxImportSource preact */
import { render, FunctionComponent } from 'preact';
import type IScreen from '../../../domain/ports/IScreen';
import ScreenId from '../../../domain/ui/ScreenId';
import logo from '../../../assets/images/logo.png';

const MainScreenView: FunctionComponent<{ go: (id: ScreenId) => void }> = ({ go }) => (
  <div className="main-screen-container">
    <div className="logo-container">
      <img src={logo} alt="SpaceDucks Logo" className="main-logo" />
      <h3 className="ui-title">SpaceDucks - klklll Menu</h3>
    </div>
    <div className="main-menu-buttons">
      <button className="btn primary" onClick={() => go(ScreenId.ServerList)}>Servers</button>
      <button className="btn primary" onClick={() => go(ScreenId.Settings)}>Settings</button>
    </div>
  </div>
);

export class MainScreen implements IScreen {
  id = ScreenId.Main;
  private el!: HTMLElement;
  constructor(private go: (id: ScreenId) => void) {}
  mount(container: HTMLElement): void {
    this.el = document.createElement('div');
    render(<MainScreenView go={this.go} />, this.el);
    container.appendChild(this.el);
  }
  unmount(): void {
    // Unmount Preact tree and remove container
    render(null as any, this.el);
    this.el.remove();
  }
}

export default MainScreen;
