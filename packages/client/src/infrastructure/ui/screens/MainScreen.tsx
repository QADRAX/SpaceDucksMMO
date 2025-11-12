/** @jsxImportSource preact */
import { render } from "preact";
import type IScreen from "../../../domain/ports/IScreen";
import ScreenId from "../../../domain/ui/ScreenId";
import LobbyApp from "../../ui/components/lobby/LobbyApp";
import { ServicesContext, type Services } from "../hooks/useServices";
import "../styles/base.css";

export class MainScreen implements IScreen {
  id = ScreenId.Main;
  private el!: HTMLElement;
  services?: Services; // Public for dependency injection
  
  constructor(
    private _go?: (id: ScreenId) => void
  ) {}
  
  mount(container: HTMLElement): void {
    this.el = document.createElement("div");
    render(
      <ServicesContext.Provider value={this.services || null}>
        <LobbyApp />
      </ServicesContext.Provider>,
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
