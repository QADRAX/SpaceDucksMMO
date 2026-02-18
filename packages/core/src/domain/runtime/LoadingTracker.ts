/**
 * Utility to track asynchronous loading tasks and provide progress reporting.
 */
export class LoadingTracker {
    private pendingTasks = new Set<string>();
    private totalTasksStarted = 0;
    private finishedTasksCount = 0;
    private onProgressListeners = new Set<(progress: number) => void>();
    private initialLoadPromise: Promise<void> | null = null;
    private initialLoadResolver: (() => void) | null = null;

    /**
     * Register a new task to be tracked.
     * @param id Unique identifier for the task.
     */
    startTask(id: string): void {
        if (this.pendingTasks.has(id)) return;

        this.pendingTasks.add(id);
        this.totalTasksStarted++;
        this.emitProgress();
    }

    /**
     * Mark a task as completed.
     * @param id Unique identifier for the task.
     */
    endTask(id: string): void {
        if (!this.pendingTasks.has(id)) return;

        this.pendingTasks.delete(id);
        this.finishedTasksCount++;
        this.emitProgress();

        if (this.pendingTasks.size === 0 && this.initialLoadResolver) {
            this.initialLoadResolver();
            this.initialLoadResolver = null;
            this.initialLoadPromise = null;
        }
    }

    /**
     * Returns a promise that resolves when all currently pending tasks are finished.
     * If no tasks are pending, resolves immediately.
     */
    waitForInitialLoad(): Promise<void> {
        if (this.pendingTasks.size === 0) return Promise.resolve();
        if (this.initialLoadPromise) return this.initialLoadPromise;

        this.initialLoadPromise = new Promise((resolve) => {
            this.initialLoadResolver = resolve;
        });
        return this.initialLoadPromise;
    }

    /**
     * Returns current loading progress from 0.0 to 1.0.
     */
    getProgress(): number {
        if (this.totalTasksStarted === 0) return 1.0;
        return Math.min(1.0, this.finishedTasksCount / this.totalTasksStarted);
    }

    /**
     * Returns true if there are no pending tasks.
     */
    isComplete(): boolean {
        return this.pendingTasks.size === 0;
    }

    /**
     * Subscribe to progress updates.
     */
    onProgress(callback: (progress: number) => void): () => void {
        this.onProgressListeners.add(callback);
        return () => this.onProgressListeners.delete(callback);
    }

    /**
     * Reset the tracker for a new loading phase.
     */
    reset(): void {
        if (this.initialLoadResolver) {
            this.initialLoadResolver();
        }
        this.pendingTasks.clear();
        this.totalTasksStarted = 0;
        this.finishedTasksCount = 0;
        this.initialLoadPromise = null;
        this.initialLoadResolver = null;
        this.emitProgress();
    }

    private emitProgress(): void {
        const p = this.getProgress();
        for (const l of this.onProgressListeners) {
            try { l(p); } catch { }
        }
    }
}

export default LoadingTracker;
