import type { Document, Node } from '@gltf-transform/core';
import { createEntityId, createResourceKey, createResourceRef } from '@duckengine/core-v2';
import type { ImportedEntityData } from '../../domain/types';

export function extractNodes(document: Document): ImportedEntityData[] {
    const entities: ImportedEntityData[] = [];

    // Pre-pass: Ensure every node has a deterministic name before parsing hierarchy
    const allNodes = document.getRoot().listNodes();
    allNodes.forEach((n, i) => {
        if (!n.getName()) {
            n.setName(`Node_${i}`);
        }
    });

    const allSkins = document.getRoot().listSkins();
    const allAnimations = document.getRoot().listAnimations();
    let isFirstRootNode = true;

    const parseNode = (node: Node, parentName?: string) => {
        const translation = node.getTranslation();
        const rotation = node.getRotation();
        const scale = node.getScale();
        const name = node.getName();

        const entityData: ImportedEntityData = {
            name,
            translation,
            rotation,
            scale,
            parentId: parentName,
            components: []
        };
        
        const nodeMesh = node.getMesh();
        if (nodeMesh) {
            const meshIndex = document.getRoot().listMeshes().indexOf(nodeMesh);
            const meshRef = nodeMesh.getName() || `mesh_${meshIndex}`;
            
            // Attach Geometry component
            entityData.components.push({
                type: 'customGeometry',
                mesh: createResourceRef(createResourceKey(meshRef), 'mesh'),
                castShadow: true,
                receiveShadow: true,
                enabled: true
            });

            // Attach Material component (using the first primitive's material as representative)
            const prims = nodeMesh.listPrimitives();
            if (prims.length > 0) {
                const mat = prims[0].getMaterial();
                if (mat) {
                    const matIndex = document.getRoot().listMaterials().indexOf(mat);
                    const matRef = mat.getName() || `material_${matIndex}`;
                    entityData.components.push({
                        type: 'standardMaterial',
                        material: createResourceRef(createResourceKey(matRef), 'standardMaterial'),
                        enabled: true
                    });
                }
            }
        }

        // Rigging: JointComponent
        for (const skin of allSkins) {
            const jointIndex = skin.listJoints().indexOf(node);
            if (jointIndex !== -1) {
                entityData.components.push({
                    type: 'joint',
                    jointIndex,
                    enabled: true
                });
                break; // A node is typically part of one skin palette
            }
        }

        // Rigging: SkinComponent
        const nodeSkin = node.getSkin();
        if (nodeSkin) {
            const skeletonNode = nodeSkin.getSkeleton() || nodeSkin.listJoints()[0];
            const rigRootEntityId = skeletonNode?.getName();
            if (rigRootEntityId) {
                entityData.components.push({
                    type: 'skin',
                    rigRootEntityId: createEntityId(rigRootEntityId),
                    enabled: true
                });
            }
        }

        // Animations: AnimatorComponent on the root node
        if (isFirstRootNode && !parentName && allAnimations.length > 0) {
            isFirstRootNode = false;
            const animClips = allAnimations.map((anim, i) => createResourceRef(createResourceKey(anim.getName() || `animation_${i}`), 'animationClip'));
            entityData.components.push({
                type: 'animator',
                clips: animClips,
                activeClipIndex: 0,
                playing: true,
                loop: true,
                speed: 1,
                time: 0,
                enabled: true
            });
        }

        entities.push(entityData);

        for (const child of node.listChildren()) {
            parseNode(child, name);
        }
    };

    for (const scene of document.getRoot().listScenes()) {
        for (const rootNode of scene.listChildren()) {
            parseNode(rootNode);
        }
    }

    return entities;
}
