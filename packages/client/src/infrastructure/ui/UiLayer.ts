import './styles/base.css';
import { render, h } from 'preact';
import ScreenTransition from './components/common/utility/ScreenTransition';
import type { GameScreenManager } from '@client/application/ui/GameScreenManager';
import { useState, useEffect } from 'preact/hooks';

export class UiLayer {
  private root!: HTMLElement;
  private screenContainer!: HTMLElement;
  private transitionContainer!: HTMLElement;
  private gameScreenManager?: GameScreenManager;

  constructor(private host: HTMLElement) {}

  mount() {
    const uiRoot = document.createElement('div');
    uiRoot.className = 'ui-root';
    // Ensure overlay above the WebGL canvas if parent styles change.
    // Place UI as fixed overlay to guarantee it's above the renderer canvas
    uiRoot.style.position = 'fixed';
    uiRoot.style.inset = '0';
    uiRoot.style.pointerEvents = 'none';
    uiRoot.style.zIndex = '2000';
    this.host.appendChild(uiRoot);
    this.root = uiRoot;

    // Create container for screen router (DOM-based rendering)
    this.screenContainer = document.createElement('div');
    this.screenContainer.className = 'screen-container';
    // Allow UI elements inside screenContainer to receive pointer events
    this.screenContainer.style.pointerEvents = 'auto';
    this.root.appendChild(this.screenContainer);

    // Create container for transition overlay (Preact-based)
    this.transitionContainer = document.createElement('div');
    this.transitionContainer.className = 'transition-container';
    this.root.appendChild(this.transitionContainer);
  }

  /**
   * Initialize transition overlay
   */
  initializeRootApp(gameScreenManager: GameScreenManager): void {
    this.gameScreenManager = gameScreenManager;
    
    // Render only the transition component
    const TransitionWrapper = () => {
      const [isTransitioning, setIsTransitioning] = useState(false);

      useEffect(() => {
        const unsubscribe = gameScreenManager.onTransition((transitioning) => {
          setIsTransitioning(transitioning);
        });
        return () => unsubscribe();
      }, []);

      return h(ScreenTransition, { isTransitioning, duration: 300 });
    };

    render(h(TransitionWrapper, null), this.transitionContainer);
  }

  getRoot(): HTMLElement { 
    return this.screenContainer; // Return screen container for router
  }
}

export default UiLayer;
