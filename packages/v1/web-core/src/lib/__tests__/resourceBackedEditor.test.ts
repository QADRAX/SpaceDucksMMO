
import { Entity, StandardMaterialComponent, BoxGeometryComponent } from '@duckengine/core';
import { hydrateResourceBackedMaterials, MATERIAL_RESOURCE_REF_KEY } from '../resourceBackedEditor';
import * as resolution from '@/lib/engineResourceResolution';

// Mock resolving resources
jest.mock('@/lib/engineResourceResolution', () => ({
    resolveMaterialResourceActive: jest.fn(),
}));

describe('hydrateResourceBackedMaterials', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should reset properties that are missing in the new resource', async () => {
        // 1. Setup Entity with a Material that has a color set (simulating "previous" state)
        const entity = new Entity('e1');
        const mat = new StandardMaterialComponent();
        mat.color = '#ff0000'; // Red
        (mat as any)[MATERIAL_RESOURCE_REF_KEY] = 'my-material-key';

        // Add required geometry
        const geom = new BoxGeometryComponent();
        entity.addComponent(geom);
        entity.addComponent(mat);

        // Mock Scene
        const mockScene = {
            getEntitiesById: () => new Map([['e1', entity]]),
        } as any;

        // 2. Mock resolution to return a resource that DOES NOT have color (simulating switching to a default material)
        // The resource only has "roughness", so "color" is missing/undefined.
        jest.spyOn(resolution, 'resolveMaterialResourceActive').mockResolvedValue({
            kind: 'standardMaterial',
            componentData: {
                roughness: 0.8,
                // NO color here!
            },
        } as any);

        // 3. Run hydration
        await hydrateResourceBackedMaterials(mockScene);

        // 4. Assertions
        // Expected: color should be reset to undefined (or default if the setter handles it, but here we expect the component property to change)
        // Current Bug: color remains '#ff0000' because the merger doesn't see 'color' in the new data.
        // Desired Fix: color becomes undefined.

        expect(mat.roughness).toBe(0.8);
        expect(mat.color).toBeUndefined();
    });
});
