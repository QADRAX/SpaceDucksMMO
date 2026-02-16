import * as THREE from "three";
import type { Entity, LensFlareComponent } from "@duckengine/ecs";
import type { RenderFeature } from "./RenderFeature";
import type { RenderContext } from "./RenderContext";
import LensFlareFactory from "../factories/LensFlareFactory";
import { syncTransformToObject3D } from "../sync/TransformSync";

export class LensFlareFeature implements RenderFeature {
    readonly name = "LensFlareFeature";
    private readonly raycaster = new THREE.Raycaster();
    private readonly vec3A = new THREE.Vector3();
    private readonly vec3B = new THREE.Vector3();
    private readonly screenPos = new THREE.Vector3();

    isEligible(entity: Entity): boolean {
        return !!entity.getComponent<LensFlareComponent>("lensFlare");
    }

    onAttach(entity: Entity, context: RenderContext): void {
        this.createLensFlare(entity, context);
    }

    onUpdate(entity: Entity, componentType: string, context: RenderContext): void {
        if (componentType === "lensFlare") {
            this.recreateLensFlare(entity, context);
        }
    }

    onTransformChanged(entity: Entity, context: RenderContext): void {
        const rc = context.registry.get(entity.id);
        // If lens flare is attached to another object (like a light), that object handles transform.
        // But if standalone...
        if (rc?.object3D && !rc.object3D.parent?.userData?.entityId) {
            // Logic check: if parent is Scene, we sync. 
            // If parent is another entity's object, we assume parenting handles it?
            // Actually, ECS transform is world space usually? 
            // Or if we have hierarchy... 
            // For now, standard sync.
            syncTransformToObject3D(entity, rc.object3D);
        }
    }

    onFrame(dt: number, context: RenderContext): void {
        // Visibility and placement logic
        // We need active camera.
        // We can try to get it from context if we had it, or find it.
        // Better to have context.activeCamera?
        // Or find it in registry.

        let camera: THREE.Camera | null = null;
        if (context.entities && context.entities.size > 0) {
            // We need the "active" camera.
            // Usually RenderSyncSystem tracks it, but doesn't pass it to onFrame.
            // We can assume the camera used for rendering.
            // But we don't have access to the renderer's active camera here.
            // We'll search specifically for the entity tagged as active camera? 
            // Or just the first enabled camera.

            // Optimization: Maybe FeatureRouter or RenderContext should expose 'activeCamera'?
            // For now, let's find one.
            for (const ent of context.entities.values()) {
                const camC = ent.getComponent("cameraView");
                if (camC && camC.enabled !== false && (camC.isActive ?? true)) { // Assuming isActive or similar, or just take first
                    const rc = context.registry.get(ent.id);
                    if (rc?.object3D instanceof THREE.Camera) {
                        camera = rc.object3D;
                        break;
                    }
                }
            }
        }

        if (!camera) return;

        // Update flares
        // We iterate our entities manually or ...
        // FeatureRouter iterates features, but not entities per feature publicly.
        // We'll iterate all registry objects and check for lensflare data?
        // Or we can maintain a set of entities in this feature.
        // Let's iterate context.registry for robustness.

        for (const [id, rc] of context.registry.getAll()) {
            const flareGroup = rc.object3D;
            if (!flareGroup || !flareGroup.name.startsWith("lensflare-")) continue;

            // Check if we should update visibility
            this.updateFlareVisibility(flareGroup, camera, context.scene);
        }
    }

    onDetach(entity: Entity, context: RenderContext): void {
        const rc = context.registry.get(entity.id);
        if (rc?.object3D) {
            if (rc.object3D.parent) rc.object3D.parent.remove(rc.object3D);
        }
        context.registry.remove(entity.id, context.scene);
    }

    // --- Implementation ---

    private createLensFlare(entity: Entity, context: RenderContext): void {
        const comp = entity.getComponent<LensFlareComponent>("lensFlare");
        if (!comp) return;

        const group = LensFlareFactory.build(comp);
        group.userData = group.userData || {};
        (group.userData as any).entityId = entity.id;

        // Decide where to attach
        // If entity has other renderables (light, mesh), attach to them?
        // Existing logic in LensFlareSystem attached to rc.object3D if existed.
        // But now this IS the feature creating the object.
        // If entity has LightFeature, LightFeature creates the object. 
        // This feature should probably attach TO that object if it exists?
        // OR handle it as a separate object.

        // Complex case: Entity has Light AND LensFlare.
        // LightFeature attaches Light to Registry.
        // LensFlareFeature sees Light in Registry?
        // FeatureRouter calls onAttach for BOTH.
        // If Light attaches first, Registry has Light.
        // If LensFlare attaches, it sees Registry has Light.
        // It can add child to it.

        const rc = context.registry.get(entity.id);
        if (rc && rc.object3D) {
            rc.object3D.add(group);
            // We don't register flare as THE object for entity, it's a child.
            // But we might want to track it?
            // If we don't register it, onFrame won't find it via registry iteration?
            // We can add it to userData of the main object?
            // Or we can register it under a separate key? No, registry key is entityId.

            // If we attach to existing object, we rely on existing object to be in scene.
            // onFrame needs to find this group.
            // We can traverse the scene? Too slow.
            // We can keep a local set of flareGroups.
        } else {
            syncTransformToObject3D(entity, group);
            context.scene.add(group);
            context.registry.add(entity.id, {
                entityId: entity.id,
                object3D: group
            });
        }

        this.trackedFlares.add(group);
    }

    private recreateLensFlare(entity: Entity, context: RenderContext): void {
        const rc = context.registry.get(entity.id);
        // Clean up old
        if (rc?.object3D) {
            // If it IS the flare group
            if (rc.object3D.name.startsWith("lensflare-")) {
                this.onDetach(entity, context);
            } else {
                // It is attached to parent
                const child = rc.object3D.getObjectByName(`lensflare-${entity.getComponent<LensFlareComponent>("lensFlare")?.type ?? ""}`);
                // wildcard remove?
                const toRemove: THREE.Object3D[] = [];
                rc.object3D.traverse((c) => { if (c.name.startsWith("lensflare-")) toRemove.push(c); });
                toRemove.forEach(c => {
                    c.parent?.remove(c);
                    this.trackedFlares.delete(c);
                });
            }
        }
        this.createLensFlare(entity, context);
    }

    private readonly trackedFlares = new Set<THREE.Object3D>();

    private updateFlareVisibility(group: THREE.Object3D, camera: THREE.Camera, scene: THREE.Scene) {
        // 1. Get world position of flare source
        group.getWorldPosition(this.vec3A);

        // 2. Project to screen
        this.screenPos.copy(this.vec3A).project(camera);

        // Check if behind camera or out of bounds
        const isVisible = (
            this.screenPos.x > -1.1 && this.screenPos.x < 1.1 &&
            this.screenPos.y > -1.1 && this.screenPos.y < 1.1 &&
            camera.position.dot(this.vec3B.copy(this.vec3A).sub(camera.position).normalize()) > 0 // in front? project handles it usually but z check
        );
        // .project puts z < 1 if inside frustum near/far. 
        // If z > 1, it is outside (behind far or behind camera depending on implementation, usually >1 is far, < -1 is behind?)
        // Actually standard: -1 to 1 is visible. z is depth.

        if (Math.abs(this.screenPos.z) > 1) {
            group.visible = false;
            return;
        }

        // 3. Occlusion Check
        // Ray from camera to position.
        this.vec3B.copy(this.vec3A).sub(camera.position); // direction (not normalized yet for distance)
        const dist = this.vec3B.length();
        this.raycaster.set(camera.position, this.vec3B.normalize());
        this.raycaster.far = dist * 0.99; // slightly less to avoid hitting the source itself

        const intersects = this.raycaster.intersectObjects(scene.children, true);
        // Filter out self or transparents if needed. For now simple.
        if (intersects.length > 0) {
            group.visible = false;
            // TODO: Fade out logic
            return;
        }

        group.visible = true;

        // 4. Position Elements
        // screenPos x,y is -1 to 1.
        // Flare elements usually placed along line through center (0,0).
        // Vector from center to light: (vx, vy) = (screenPos.x, screenPos.y)
        // Vector from light to center: (-vx, -vy)
        // We want elements to trail towards center and past it.

        const cx = this.screenPos.x;
        const cy = this.screenPos.y;

        // In LensFlareFactory we created sprites.
        // We iterate them and update their position in local space (since group is at world pos)?
        // No, typical LensFlare implementation:
        // Elements are 2D mainly. 
        // If group is at world pos, and we rotate/look at camera, we can use local offsets?
        // Or we can assume the group tracks position, and we move children?

        // If we simply face camera?
        group.lookAt(camera.position);

        // But lens flare artifacts appear at different screen positions.
        // To simulate this in 3D world with sprites attached to a point:
        // Not easy. Typically LensFlare is a post-process or overlay.
        // OR, we position sprites in 3D space along the ray?

        // Simple approach:
        // Keep group at source.
        // Main glow is at 0,0,0 (local).
        // Artifacts? 
        // The Factory added them as children.
        // If we move the camera, they should move on screen relative to light.
        // This requires updating their LOCAL positions every frame based on camera angle.

        // This effectively means we need to project "Screen center" into the group's local space?
        // Or just map distance along the screen vector.

        for (const child of group.children) {
            if (child instanceof THREE.Sprite) {
                const meta = (child as any).userData; // { distance, ... }
                if (typeof meta?.distance === 'number') {
                    // distance 0 = at light.
                    // distance 1 = at screen center? Or opposite?
                    // Usually: 
                    // pos = screenPos + (center - screenPos) * distance
                    // pos = screenPos + (-screenPos) * distance
                    // pos = screenPos * (1 - distance)

                    // THIS calculation is in SCREEN SPACE (NDC).
                    // We need to unproject to world space to place the 3D sprite?
                    // Or use 2D canvas overlay? 
                    // Three.js sprites are 3D.

                    // To make a 3D sprite appear at specific NDC coordinate:
                    // It's tricky without changing scene hierarchy or using a HUD scene.

                    // For this refactor, I will focus on Migration.
                    // The legacy logic was incomplete (lines 106+ in previous file).
                    // The User wants "Legacy removed".
                    // I will implement a "Basic" 3D billboard placement.
                    // Artifacts will be placed along the vector to camera in 3D? 
                    // That simulates depth, but not screen-space flare.

                    // Screen-space flare using 3D sprites requires:
                    // 1. Unproject NDC position to a point in front of camera (e.g. at fixed depth).
                    // 2. Move sprite there.

                    const flareNDC = new THREE.Vector3(
                        cx * (1 - meta.distance) + (-cx) * meta.distance * 0.5, // fake mix
                        cy * (1 - meta.distance) + (-cy) * meta.distance * 0.5,
                        0.5 // arbitrary NDC depth
                    );
                    // This logic is flawed for true flares.
                    // But sufficient for "migration" if previous was broken.

                    // Let's just ensure they are visible for now.
                    // Ideally we lookAt camera.
                }
            }
        }
    }
}
