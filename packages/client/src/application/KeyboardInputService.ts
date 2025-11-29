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

    /**
     * Normalize a KeyboardEvent to a canonical key string.
     * - Single characters: lowercased (e.g. 'w', 'a', '1')
     * - Spacebar: 'space'
     * - Shift: 'shift'
     * - Escape: 'escape'
     * - F1-F12: 'f1', 'f2', ...
     * - Otherwise: lowercased e.key
     */
    private normalizeKey(e: KeyboardEvent): string {
      if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Space') return 'space';
      if (e.key === 'Shift' || e.key === 'ShiftLeft' || e.key === 'ShiftRight') return 'shift';
      if (e.key === 'Escape') return 'escape';
      if (/^F\d{1,2}$/i.test(e.key)) return e.key.toLowerCase();
      if (e.key.length === 1) return e.key.toLowerCase();
      return e.key.toLowerCase();
    }

  constructor() {
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('keydown', this.keydownListener);
      window.addEventListener('keyup', this.keyupListener);
    }
  }

  private handleKeyDown(e: KeyboardEvent) {
    const k = this.normalizeKey(e);
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug('[KeyboardInputService] handleKeyDown:', e.key, 'normalized:', k, 'code:', e.code);
    }
    this.pressed.add(k);
    const set = this.downHandlers.get(k);
    if (set) for (const h of Array.from(set)) h();
  }

  private handleKeyUp(e: KeyboardEvent) {
    const k = this.normalizeKey(e);
    this.pressed.delete(k);
    const set = this.upHandlers.get(k);
    if (set) for (const h of Array.from(set)) h();
  }

  /**
   * Return whether a key is currently pressed.
   * @param key Normalized key string (e.g. 'w', 'space', 'shift', 'escape', 'f1')
   */
  isKeyPressed(key: string): boolean {
    return this.pressed.has(key);
  }

  /**
   * Subscribe to keydown for a specific key. Returns an unsubscribe function.
   * @param key Normalized key string (e.g. 'w', 'space', 'shift', 'escape', 'f1')
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
   * @param key Normalized key string (e.g. 'w', 'space', 'shift', 'escape', 'f1')
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
