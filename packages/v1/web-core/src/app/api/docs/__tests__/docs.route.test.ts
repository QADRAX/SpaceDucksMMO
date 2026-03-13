jest.mock('@/lib/swagger', () => ({
  swaggerSpec: { openapi: '3.0.0', info: { title: 'x', version: '1' } },
}));

import { GET } from '../route';

describe('GET /api/docs', () => {
  it('returns swagger spec json', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      openapi: '3.0.0',
      info: { title: 'x', version: '1' },
    });
  });
});
