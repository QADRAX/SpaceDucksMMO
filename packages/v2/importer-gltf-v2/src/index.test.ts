import { parseGLBToECS } from './index';

describe('importer-gltf-v2', () => {
    it('throws on empty buffer', async () => {
        const dummyBuffer = new Uint8Array(0); 
        
        await expect(parseGLBToECS(dummyBuffer)).rejects.toThrow('Empty GLB buffer provided.');
    });
});
