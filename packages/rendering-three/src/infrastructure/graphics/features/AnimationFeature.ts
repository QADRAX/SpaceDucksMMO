// @ts-ignore
import * as THREE from "three/webgpu";
import type { Entity, ComponentType } from "@duckengine/ecs";
import type { RenderFeature } from "./RenderFeature";
import type { RenderContext } from "./RenderContext";

export class AnimationFeature implements RenderFeature {
    readonly name = "AnimationFeature";

    isEligible(entity: Entity): boolean {
        // Animation requires an animation property on a component (like fullMesh.animation)
        // and a registered RenderComponent with a mixer.
        return !!entity.getComponent<any>("fullMesh");
    }

    onAttach(entity: Entity, context: RenderContext): void {
        this.syncAnimation(entity, context);
    }

    onUpdate(entity: Entity, componentType: ComponentType, context: RenderContext): void {
        if (componentType === "fullMesh") {
            this.syncAnimation(entity, context);
        }
    }

    onFrame(dt: number, context: RenderContext): void {
        const ms = dt / 1000;
        for (const rc of context.registry.getAll().values()) {
            if (rc.animationMixer) {
                rc.animationMixer.update(ms);
            }
        }
    }

    onDetach(entity: Entity, context: RenderContext): void {
        const rc = context.registry.get(entity.id);
        if (rc) {
            this.stopAnimations(rc);
        }
    }

    private syncAnimation(entity: Entity, context: RenderContext): void {
        const comp = entity.getComponent<any>("fullMesh");
        if (!comp || !comp.animation) return;

        const rc = context.registry.get(entity.id);
        if (!rc?.animationMixer || !rc.availableAnimations?.length) return;

        const mixer = rc.animationMixer;
        const animations = rc.availableAnimations;
        const config = comp.animation;

        const clipName = String(config.clipName ?? "");
        const clip = clipName ? THREE.AnimationClip.findByName(animations, clipName) : animations[0];
        if (!clip) return;

        const prevAction = rc.activeAction;
        if (prevAction) {
            // If it's the same clip and it's already playing, maybe we don't want to reset it?
            // But usually onUpdate means something might have changed.
            if (prevAction.getClip().name === clip.name) {
                this.applyConfigToAction(prevAction, config);
                return;
            }
            prevAction.stop();
            prevAction.reset();
        }

        const action = mixer.clipAction(clip);
        this.applyConfigToAction(action, config);
        rc.activeAction = action;
    }

    private applyConfigToAction(action: THREE.AnimationAction, config: any): void {
        action.setLoop(config.loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
        if (typeof config.time === 'number' && !action.isRunning()) {
            action.time = config.time;
        }

        if (config.playing === false) {
            action.paused = true;
        } else {
            action.paused = false;
            action.play();
        }
    }

    private stopAnimations(rc: any): void {
        if (rc.animationMixer) {
            rc.animationMixer.stopAllAction();
        }
        rc.activeAction = undefined;
    }
}
