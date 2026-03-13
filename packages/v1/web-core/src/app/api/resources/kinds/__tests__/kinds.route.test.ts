import { GET } from '../route';

describe('GET /api/resources/kinds', () => {
  it('returns list of kinds', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data).toEqual(
      expect.arrayContaining(['standardMaterial', 'customMesh'])
    );
  });
});
