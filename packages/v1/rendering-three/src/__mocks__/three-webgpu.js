/**
 * Jest shim for 'three/webgpu'.
 *
 * three/webgpu ships as ESM-only and uses WebGPU-specific node materials
 * (MeshStandardNodeMaterial, MeshBasicNodeMaterial, etc.).  In the test
 * environment we want the same class-instances that the standard 'three'
 * package provides so that `instanceof` checks remain valid.
 *
 * Approach: re-export everything from 'three' and add NodeMaterial aliases
 * that point to their standard counterparts.  The WebGPURenderer is stubbed
 * out separately per-suite when needed (ThreeRenderer / ThreeMultiRenderer).
 */

const THREE = require('three');

// NodeMaterial aliases → standard THREE materials
module.exports = {
    ...THREE,

    // Standard materials aliased as NodeMaterial variants
    MeshStandardNodeMaterial: THREE.MeshStandardMaterial,
    MeshBasicNodeMaterial: THREE.MeshBasicMaterial,
    MeshPhongNodeMaterial: THREE.MeshPhongMaterial,
    MeshLambertNodeMaterial: THREE.MeshLambertMaterial,
    MeshToonNodeMaterial: THREE.MeshToonMaterial,
    MeshNormalNodeMaterial: THREE.MeshNormalMaterial,

    // Lightweight WebGPURenderer stub (tests that need the real one override this
    // with jest.mock() which takes precedence over moduleNameMapper).
    WebGPURenderer: jest.fn().mockImplementation(() => {
        const canvas = (globalThis.document?.createElement('canvas') ?? {});
        return {
            init: jest.fn().mockResolvedValue(undefined),
            setSize: jest.fn(),
            render: jest.fn(),
            dispose: jest.fn(),
            setPixelRatio: jest.fn(),
            clear: jest.fn(),
            setClearColor: jest.fn(),
            compileAsync: jest.fn().mockResolvedValue(undefined),
            shadowMap: { enabled: false, type: null },
            domElement: canvas,
        };
    }),

    // PostProcessing stub
    PostProcessing: jest.fn().mockImplementation(() => ({
        render: jest.fn(),
        dispose: jest.fn(),
        outputNode: null,
    })),

    // Common WebGPU constants re-exported from three
    PCFSoftShadowMap: THREE.PCFSoftShadowMap,
};
