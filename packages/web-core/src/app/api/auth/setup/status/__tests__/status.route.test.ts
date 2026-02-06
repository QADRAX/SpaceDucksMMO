const isSetupCompleteMock = jest.fn();

jest.mock('@/lib/setup', () => ({
  isSetupComplete: (...args: unknown[]) => isSetupCompleteMock(...args),
}));

import { GET } from '../route';

describe('GET /api/auth/setup/status', () => {
  beforeEach(() => {
    isSetupCompleteMock.mockReset();
  });

  it('returns setupComplete=false', async () => {
    isSetupCompleteMock.mockResolvedValueOnce(false);

    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ setupComplete: false });
  });

  it('returns setupComplete=true', async () => {
    isSetupCompleteMock.mockResolvedValueOnce(true);

    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ setupComplete: true });
  });
});
