/**
 * Centralized keyboard input service that tracks key state and
 * exposes subscription-based APIs for hotkeys.
 */
export class KeyboardInputService {
  private pressed = new Set<string>();
  private downHandlers = new Map<string, Set<() => void>>();
  private upHandlers = new Map<string, Set<() => void>>();
  private keydownListener = (e: KeyboardEvent) => this.handleKeyDown(e);
  private keyupListener = (e: KeyboardEvent) => this.handleKeyUp(e);

  constructor() {
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('keydown', this.keydownListener);
      window.addEventListener('keyup', this.keyupListener);
    }
  }

  private handleKeyDown(e: KeyboardEvent) {
    const k = e.key;
    this.pressed.add(k);
    const set = this.downHandlers.get(k);
    if (set) for (const h of Array.from(set)) h();
  }

  private handleKeyUp(e: KeyboardEvent) {
    const k = e.key;
    this.pressed.delete(k);
    const set = this.upHandlers.get(k);
    if (set) for (const h of Array.from(set)) h();
  }

  /**
   * Return whether a key is currently pressed.
   */
  isKeyPressed(key: string): boolean {
    return this.pressed.has(key);
  }

  /**
   * Subscribe to keydown for a specific key. Returns an unsubscribe function.
   */
  onKeyDown(key: string, handler: () => void): () => void {
    let set = this.downHandlers.get(key);
    if (!set) {
      set = new Set();
      this.downHandlers.set(key, set);
    }
    set.add(handler);
    return () => set!.delete(handler);
  }

  /**
   * Subscribe to keyup for a specific key. Returns an unsubscribe function.
   */
  onKeyUp(key: string, handler: () => void): () => void {
    let set = this.upHandlers.get(key);
    if (!set) {
      set = new Set();
      this.upHandlers.set(key, set);
    }
    set.add(handler);
    return () => set!.delete(handler);
  }

  /**
   * Clean up listeners and handlers.
   */
  dispose(): void {
    if (typeof window !== 'undefined' && window.removeEventListener) {
      window.removeEventListener('keydown', this.keydownListener);
      window.removeEventListener('keyup', this.keyupListener);
    }
    this.downHandlers.clear();
    this.upHandlers.clear();
    this.pressed.clear();
  }
}

export default KeyboardInputService;
