import type { ComponentBase } from '../core';
import type { ResourceRef } from '../../../resources';

/**
 * Plays animation clips on this entity subtree (channels target entities by id in clip data).
 */
export interface AnimatorComponent extends ComponentBase<'animator', AnimatorComponent> {
    /** Ordered clips; `activeClipIndex` selects the current one. */
    clips: readonly ResourceRef<'animationClip'>[];
    activeClipIndex: number;
    playing: boolean;
    loop: boolean;
    /** 1 = real-time; negative for reverse. */
    speed: number;
    /** Playback time in seconds within the active clip. */
    time: number;
}
