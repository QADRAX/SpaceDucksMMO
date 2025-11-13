/** @jsxImportSource preact */
import { render, type ComponentChild } from 'preact';
import type IScreen from '@client/domain/ports/IScreen';
import type ScreenId from '@client/domain/ui/ScreenId';
import type { Services } from '../hooks/useServices';
import { ServicesContext } from '../hooks/useServices';

/**
 * BaseScreen - Generic Screen implementation
 * 
 * Provides:
 * - Automatic DOM lifecycle management
 * - Services injection via React context
 * - Preact rendering boilerplate
 * 
 * Usage:
 * ```ts
 * class MyScreen extends BaseScreen {
 *   constructor() {
 *     super(ScreenId.MyScreen);
 *   }
 * 
 *   protected renderContent(): ComponentChild {
 *     return <MyComponent />;
 *   }
 * }
 * ```
 */
export abstract class BaseScreen implements IScreen {
  readonly id: ScreenId;
  protected root: HTMLElement | null = null;
  protected services?: Services;

  constructor(id: ScreenId) {
    this.id = id;
  }

  /**
   * Render the screen's Preact component
   * Subclasses must implement this to provide their UI
   */
  protected abstract renderContent(): ComponentChild;

  /**
   * Mount the screen to the DOM
   */
  mount(container: HTMLElement): void {
    this.root = document.createElement('div');
    this.root.className = `screen screen-${this.id}`;
    container.appendChild(this.root);
    this.render();
  }

  /**
   * Unmount and cleanup
   */
  unmount(): void {
    if (this.root) {
      render(null, this.root);
      this.root.remove();
      this.root = null;
    }
  }

  /**
   * Render Preact component with services context
   */
  protected render(): void {
    if (!this.root) return;

    const content = this.renderContent();
    
    render(
      <ServicesContext.Provider value={this.services || null}>
        {content}
      </ServicesContext.Provider>,
      this.root
    );
  }

  /**
   * Re-render the screen (for internal state updates)
   */
  protected forceUpdate(): void {
    this.render();
  }
}

export default BaseScreen;
