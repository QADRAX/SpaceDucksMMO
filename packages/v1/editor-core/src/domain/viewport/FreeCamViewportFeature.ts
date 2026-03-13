import { IViewportFeature, ViewportContext, ViewportUIContribution } from './IViewportFeature';

/**
 * Built-in feature for a Free-Roaming Camera.
 * Provides a "Reset" button in the toolbar.
 */
export class FreeCamViewportFeature implements IViewportFeature {
    public readonly id = 'builtin:free-cam';

    public readonly meta = {
        displayName: 'Free Camera Controller',
        description: 'Enables mouse-driven viewport navigation.',
        defaultSlot: 'viewport:toolbar:right'
    };

    private _isDragging = false;
    private _camId: string | null = null;

    public onEnable(ctx: ViewportContext) {
        // The controller (script) usually spawns the camera entity, 
        // but a feature could also contribute logic to it.
        return () => {
            this._camId = null;
        };
    }

    public onTick(dt: number, ctx: ViewportContext) {
        // Feature-specific logic (e.g. smoothing)
    }

    public getUI(ctx: ViewportContext): ViewportUIContribution | null {
        return {
            slot: 'viewport:toolbar:right',
            descriptor: {
                type: 'button',
                props: {
                    text: 'Reset Cam',
                    onClick: () => {
                        console.log('Resetting camera transform...');
                    }
                }
            }
        };
    }

    public onPointerDown(event: PointerEvent) {
        if (event.button === 2) {
            this._isDragging = true;
            return true;
        }
    }

    public onPointerUp() {
        this._isDragging = false;
    }
}
