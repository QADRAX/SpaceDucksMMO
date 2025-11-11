export enum MenuState {
  MAIN = 'MAIN',
  SERVER_LIST = 'SERVER_LIST',
  SETTINGS = 'SETTINGS',
}

export class MenuController {
  private state: MenuState = MenuState.MAIN;
  private listeners: Array<(state: MenuState) => void> = [];

  onChange(cb: (state: MenuState) => void) {
    this.listeners.push(cb);
  }

  getState(): MenuState {
    return this.state;
  }

  go(state: MenuState) {
    this.state = state;
    this.listeners.forEach(cb => cb(state));
  }
}
