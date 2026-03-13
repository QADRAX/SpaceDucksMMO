import { type EcsTreeSnapshot } from '@/lib/ecs-snapshot';
import { EcsLiveScene, serializeLiveScene } from './EcsLiveScene';
import { restoreSceneFromSnapshot } from './liveSceneRuntime';

export class EditorSceneHistory {
    private stack: EcsTreeSnapshot[] = [];
    private cursor: number = -1;
    private maxFrames: number = 50;

    constructor(initialState?: EcsTreeSnapshot) {
        if (initialState) {
            this.stack = [initialState];
            this.cursor = 0;
        }
    }

    public takeSnapshot(scene: EcsLiveScene): void {
        const snap = serializeLiveScene(scene);

        // Remove redo timeline
        if (this.cursor < this.stack.length - 1) {
            this.stack.splice(this.cursor + 1);
        }

        this.stack.push(snap);
        if (this.stack.length > this.maxFrames) {
            this.stack.shift();
        } else {
            this.cursor++;
        }
    }

    public undo(scene: EcsLiveScene): boolean {
        if (this.cursor > 0) {
            this.cursor--;
            const snap = this.stack[this.cursor];
            restoreSceneFromSnapshot(scene, snap);
            return true;
        }
        return false;
    }

    public redo(scene: EcsLiveScene): boolean {
        if (this.cursor < this.stack.length - 1) {
            this.cursor++;
            const snap = this.stack[this.cursor];
            restoreSceneFromSnapshot(scene, snap);
            return true;
        }
        return false;
    }

    public getState(): { stackCount: number; cursor: number } {
        return {
            stackCount: this.stack.length,
            cursor: this.cursor,
        };
    }
}
