import type { ILoadingOverlay, ILoadingOverlayFactory } from '../rendering/ILoadingOverlay';

/**
 * Default HTML/CSS loading overlay used by the Three.js renderers.
 *
 * Renders a dark semi-transparent panel with a progress bar and status text.
 * To replace it, implement {@link ILoadingOverlay} and pass a custom
 * {@link ILoadingOverlayFactory} to `ThreeRenderer` / `ThreeMultiRenderer`.
 */
export class DefaultHtmlLoadingOverlay implements ILoadingOverlay {
    private root: HTMLElement | null = null;
    private bar: HTMLElement | null = null;
    private textEl: HTMLElement | null = null;

    mount(container: HTMLElement): void {
        if (this.root) return; // already mounted

        // Ensure the container is positioned so the overlay can be absolute.
        if (getComputedStyle(container).position === 'static') {
            container.style.position = 'relative';
        }

        const root = document.createElement('div');
        root.style.cssText = [
            'position:absolute', 'top:0', 'left:0',
            'width:100%', 'height:100%',
            'background:rgba(0,0,0,0.8)',
            'color:white',
            'display:flex', 'flex-direction:column',
            'align-items:center', 'justify-content:center',
            'z-index:1000',
            'font-family:Inter,system-ui,sans-serif',
        ].join(';');

        const text = document.createElement('div');
        text.innerText = 'Loading Scene…';
        text.style.marginBottom = '10px';

        const track = document.createElement('div');
        track.className = 'engine-loader-progress';
        track.style.cssText = 'width:200px;height:4px;background:#333;border-radius:2px;overflow:hidden';

        const bar = document.createElement('div');
        bar.style.cssText = 'width:0%;height:100%;background:#3b82f6;transition:width 0.2s ease-out';

        track.appendChild(bar);
        root.appendChild(text);
        root.appendChild(track);
        container.appendChild(root);

        this.root = root;
        this.bar = bar;
        this.textEl = text;
    }

    setProgress(progress: number): void {
        if (this.bar) this.bar.style.width = `${Math.floor(progress * 100)}%`;
    }

    setText(text: string): void {
        if (this.textEl) this.textEl.innerText = text;
    }

    setVisible(visible: boolean): void {
        if (this.root) this.root.style.display = visible ? 'flex' : 'none';
    }

    dispose(): void {
        this.root?.remove();
        this.root = null;
        this.bar = null;
        this.textEl = null;
    }
}

/** Factory that creates a {@link DefaultHtmlLoadingOverlay} per canvas. */
export class DefaultHtmlLoadingOverlayFactory implements ILoadingOverlayFactory {
    create(): ILoadingOverlay {
        return new DefaultHtmlLoadingOverlay();
    }
}
