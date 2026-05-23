import type { Document } from '@gltf-transform/core';
import type { AnimationClipFileData } from '@duckengine/core-v2';

export function extractAnimations(document: Document): Record<string, AnimationClipFileData> {
    const animations: Record<string, AnimationClipFileData> = {};
    
    for (const animation of document.getRoot().listAnimations()) {
        const channels: any[] = [];
        let duration = 0;

        for (const channel of animation.listChannels()) {
            const sampler = channel.getSampler();
            const targetNode = channel.getTargetNode();
            if (!sampler || !targetNode) continue;

            const targetPath = channel.getTargetPath()?.toLowerCase();
            const path = targetPath === 'weights' ? 'weights' :
                         targetPath === 'scale' ? 'scale' :
                         targetPath === 'rotation' ? 'rotation' : 'translation';
                         
            const interpRaw = sampler.getInterpolation();
            const interpolation = interpRaw === 'STEP' ? 'step' : 
                                  interpRaw === 'CUBICSPLINE' ? 'cubicSpline' : 'linear';
            
            const input = sampler.getInput();
            const output = sampler.getOutput();
            if (!input || !output) continue;

            const timesArray = input.getArray();
            const valuesArray = output.getArray();
            if (!timesArray || !valuesArray) continue;

            const times = Array.from(timesArray);
            const values = Array.from(valuesArray);

            if (times.length > 0) {
                duration = Math.max(duration, times[times.length - 1]);
            }

            channels.push({
                targetEntityId: targetNode.getName(), // Relies on the pre-pass naming from extractNodes
                path,
                interpolation,
                times,
                values
            });
        }

        const animId = animation.getName() || `animation_${Object.keys(animations).length}`;
        animations[animId] = {
            duration,
            channels
        };
    }

    return animations;
}
