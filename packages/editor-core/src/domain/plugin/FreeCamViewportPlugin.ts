import { IViewportPlugin, ViewportPluginContext, ViewportUIContribution } from './IViewportPlugin';

export class FreeCamViewportPlugin implements IViewportPlugin {
    public readonly id = 'builtin:free-cam';

    private _isDragging = false;
    private _camId: string | null = null;

    public onEnable(ctx: ViewportPluginContext) {
        // Spawn a free camera entity
        const cam = ctx.viewport.spawnEditorEntity('FreeCam');
        this._camId = cam.id;

        // Initially set viewport camera
        ctx.viewport.cameraEntityId = cam.id;

        return () => {
            // Cleanup logic is handled by viewport.dispose() for entities,
            // but we could do extra things here if needed.
            this._camId = null;
        };
    }

    public onTick(dt: number, ctx: ViewportPluginContext) {
        if (this._isDragging) {
            // In a real scenario, we would read mouse delta and update this._camId transform
            // console.log(`Updating camera ${this._camId} position...`);
        }
    }

    public getUI(ctx: ViewportPluginContext): ViewportUIContribution | null {
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
        if (event.button === 2) { // Right click to orbit
            this._isDragging = true;
            return true; // Consume event
        }
    }

    public onPointerUp() {
        this._isDragging = false;
    }
}
