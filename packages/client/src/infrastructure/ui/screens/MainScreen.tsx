/** @jsxImportSource preact */
import { render } from "preact";
import type IScreen from "../../../domain/ports/IScreen";
import ScreenId from "../../../domain/ui/ScreenId";
import LobbyApp from "../../ui/components/lobby/LobbyApp";
import type ServerBrowserService from "@client/application/ServerBrowserService";
import "../styles/base.css";

export class MainScreen implements IScreen {
  id = ScreenId.Main;
  private el!: HTMLElement;
  constructor(
    private _go?: (id: ScreenId) => void,
    private serverBrowser?: ServerBrowserService
  ) {}
  mount(container: HTMLElement): void {
    this.el = document.createElement("div");
    render(<LobbyApp serverBrowser={this.serverBrowser} />, this.el);
    container.appendChild(this.el);
  }
  unmount(): void {
    render(null as any, this.el);
    this.el.remove();
  }
}

export default MainScreen;
