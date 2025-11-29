export interface DevWidget {
  /** Unique widget id */
  id: string;
  /** Render function that returns a Preact vnode (or null) */
  render: () => any;
  /** Optional lifecycle hooks */
  mount?: () => void;
  unmount?: () => void;
  start?: () => void;
  stop?: () => void;
  /** Optional per-frame update hook (dt ms) */
  update?: (dt?: number) => void;
}

export default DevWidget;
