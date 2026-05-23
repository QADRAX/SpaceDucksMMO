import type { Document } from '@gltf-transform/core';
import type { MeshGeometryFileData } from '@duckengine/core-v2';

export function extractMeshes(document: Document): Record<string, MeshGeometryFileData> {
    const meshes: Record<string, MeshGeometryFileData> = {};
    
    for (const mesh of document.getRoot().listMeshes()) {
        const primitives = mesh.listPrimitives();
        if (primitives.length === 0) {
            continue;
        }

        const combinedPositions: number[] = [];
        const combinedIndices: number[] = [];
        const combinedNormals: number[] = [];
        const combinedUvs: number[] = [];
        const combinedUvs2: number[] = [];
        const combinedTangents: number[] = [];
        const combinedColors: number[] = [];
        const combinedJointIndices: number[] = [];
        const combinedJointWeights: number[] = [];
        
        let vertexOffset = 0;

        for (const prim of primitives) {
            const posAccessor = prim.getAttribute('POSITION');
            const normAccessor = prim.getAttribute('NORMAL');
            const uvAccessor = prim.getAttribute('TEXCOORD_0');
            const uv2Accessor = prim.getAttribute('TEXCOORD_1');
            const tangentAccessor = prim.getAttribute('TANGENT');
            const colorAccessor = prim.getAttribute('COLOR_0');
            const jointsAccessor = prim.getAttribute('JOINTS_0');
            const weightsAccessor = prim.getAttribute('WEIGHTS_0');
            const indexAccessor = prim.getIndices();

            if (!posAccessor) continue;

            const pArray = posAccessor.getArray();
            if (pArray) {
                for (let i = 0; i < pArray.length; i++) {
                    combinedPositions.push(pArray[i]);
                }
            }

            if (normAccessor) {
                const nArray = normAccessor.getArray();
                if (nArray) {
                    for (let i = 0; i < nArray.length; i++) {
                        combinedNormals.push(nArray[i]);
                    }
                }
            }

            if (uvAccessor) {
                const uvArray = uvAccessor.getArray();
                if (uvArray) {
                    for (let i = 0; i < uvArray.length; i++) {
                        combinedUvs.push(uvArray[i]);
                    }
                }
            }

            if (uv2Accessor) {
                const uvArray = uv2Accessor.getArray();
                if (uvArray) {
                    for (let i = 0; i < uvArray.length; i++) {
                        combinedUvs2.push(uvArray[i]);
                    }
                }
            }

            if (tangentAccessor) {
                const tArray = tangentAccessor.getArray();
                if (tArray) {
                    for (let i = 0; i < tArray.length; i++) {
                        combinedTangents.push(tArray[i]);
                    }
                }
            }

            if (colorAccessor) {
                const cArray = colorAccessor.getArray();
                if (cArray) {
                    for (let i = 0; i < cArray.length; i++) {
                        combinedColors.push(cArray[i]);
                    }
                }
            }
            
            if (jointsAccessor) {
                const jArray = jointsAccessor.getArray();
                if (jArray) {
                    for (let i = 0; i < jArray.length; i++) {
                        combinedJointIndices.push(jArray[i]);
                    }
                }
            }
            
            if (weightsAccessor) {
                const wArray = weightsAccessor.getArray();
                if (wArray) {
                    for (let i = 0; i < wArray.length; i++) {
                        combinedJointWeights.push(wArray[i]);
                    }
                }
            }

            if (indexAccessor) {
                const idxArray = indexAccessor.getArray();
                if (idxArray) {
                    for (let i = 0; i < idxArray.length; i++) {
                        combinedIndices.push(idxArray[i] + vertexOffset);
                    }
                }
            } else if (pArray) {
                const vertexCount = pArray.length / 3;
                for (let i = 0; i < vertexCount; i++) {
                    combinedIndices.push(i + vertexOffset);
                }
            }

            vertexOffset += pArray ? pArray.length / 3 : 0;
        }

        const meshId = mesh.getName() || `mesh_${Object.keys(meshes).length}`;

        // Find standard Inverse Bind Matrices via an instantiating node's skin
        const instancingNode = document.getRoot().listNodes().find(n => n.getMesh() === mesh);
        const skin = instancingNode?.getSkin();
        let inverseBindMatrices: number[] | undefined;
        if (skin) {
            const ibmAccessor = skin.getInverseBindMatrices();
            if (ibmAccessor) {
                const array = ibmAccessor.getArray();
                if (array) {
                    inverseBindMatrices = Array.from(array);
                }
            }
        }

        meshes[meshId] = {
            positions: combinedPositions,
            indices: combinedIndices,
            normals: combinedNormals.length > 0 ? combinedNormals : undefined,
            uvs: combinedUvs.length > 0 ? combinedUvs : undefined,
            uvs2: combinedUvs2.length > 0 ? combinedUvs2 : undefined,
            tangents: combinedTangents.length > 0 ? combinedTangents : undefined,
            colors: combinedColors.length > 0 ? combinedColors : undefined,
            jointIndices: combinedJointIndices.length > 0 ? combinedJointIndices : undefined,
            jointWeights: combinedJointWeights.length > 0 ? combinedJointWeights : undefined,
            skin: inverseBindMatrices ? { inverseBindMatrices } : undefined,
        };
    }

    return meshes;
}
