/** @jsxImportSource preact */
import { render } from "preact";
import type IScreen from "../../../domain/ports/IScreen";
import ScreenId from "../../../domain/ui/ScreenId";
import LobbyApp from "../../ui/components/lobby/LobbyApp";
import type ServerBrowserService from "@client/application/ServerBrowserService";
import type I18nService from "@client/application/I18nService";
import { I18nContext } from "../hooks/useI18n";
import "../styles/base.css";

export class MainScreen implements IScreen {
  id = ScreenId.Main;
  private el!: HTMLElement;
  constructor(
    private _go?: (id: ScreenId) => void,
    private serverBrowser?: ServerBrowserService,
    private i18nService?: I18nService
  ) {}
  mount(container: HTMLElement): void {
    this.el = document.createElement("div");
    render(
      <I18nContext.Provider value={this.i18nService || null}>
        <LobbyApp serverBrowser={this.serverBrowser} />
      </I18nContext.Provider>,
      this.el
    );
    container.appendChild(this.el);
  }
  unmount(): void {
    render(null as any, this.el);
    this.el.remove();
  }
}

export default MainScreen;
