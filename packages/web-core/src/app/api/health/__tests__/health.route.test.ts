import { GET } from '../route';

describe('GET /api/health', () => {
  it('returns healthy payload', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('healthy');
    expect(json.service).toBe('duckengine-web-core');
    expect(typeof json.timestamp).toBe('string');
  });
});
