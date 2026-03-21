import type { EntityId } from '../ids';

/**
 * Target property for a single animation channel (glTF channel path + weights).
 */
export type AnimationChannelPath = 'translation' | 'rotation' | 'scale' | 'weights';

/**
 * Interpolation between keyframes.
 */
export type AnimationInterpolation = 'linear' | 'step' | 'cubicSpline';

/**
 * One channel: animated property on a scene entity (node) or morph weights on a mesh entity.
 * - `translation` / `scale`: values are length 3× keyframeCount (flat xyz…).
 * - `rotation`: values are length 4× keyframeCount (flat quaternion xyzw per key).
 * - `weights`: values are morph weight arrays per key (length = morphTargetCount × keyframeCount).
 */
export interface AnimationChannelTrack {
    readonly targetEntityId: EntityId;
    readonly path: AnimationChannelPath;
    readonly interpolation: AnimationInterpolation;
    /** Keyframe times in seconds, monotonic. */
    readonly times: readonly number[];
    /**
     * Sample values; layout depends on `path` and `interpolation`.
     * For `cubicSpline`, follow glTF: packed in-out tangents + values per key.
     */
    readonly values: readonly number[];
}

/**
 * Payload for the `animationClip` resource clip file (JSON or binary decoded to this shape).
 */
export interface AnimationClipFileData {
    /** Clip duration in seconds (max time across channels). */
    readonly duration: number;
    readonly channels: readonly AnimationChannelTrack[];
}
