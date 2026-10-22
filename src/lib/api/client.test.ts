import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch, ApiError, setCsrfToken } from './client';

function mockFetch(impl: ReturnType<typeof vi.fn>) {
  global.fetch = impl as unknown as typeof fetch;
  return impl;
}

beforeEach(() => {
  vi.restoreAllMocks();
  setCsrfToken(null);
});

describe('apiFetch', () => {
  it('unwraps the success envelope', async () => {
    mockFetch(vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { x: 1 }, meta: {} }) }));
    await expect(apiFetch('/x')).resolves.toEqual({ x: 1 });
  });

  it('throws an ApiError on an error envelope', async () => {
    mockFetch(
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        statusText: 'Unprocessable',
        json: async () => ({ error: { code: 'NO_PRICE', message: 'No price' } }),
      }),
    );
    await expect(apiFetch('/x')).rejects.toMatchObject({ status: 422, code: 'NO_PRICE' });
    await expect(apiFetch('/x')).rejects.toBeInstanceOf(ApiError);
  });

  it('attaches the CSRF header on mutations but not on GET', async () => {
    setCsrfToken('tok-123');
    const fetchMock = mockFetch(vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: {} }) }));

    await apiFetch('/x', { method: 'POST', body: { a: 1 } });
    const postHeaders = (fetchMock.mock.calls[0]![1] as RequestInit).headers as Record<string, string>;
    expect(postHeaders['x-csrf-token']).toBe('tok-123');

    await apiFetch('/y');
    const getHeaders = (fetchMock.mock.calls[1]![1] as RequestInit).headers as Record<string, string>;
    expect(getHeaders['x-csrf-token']).toBeUndefined();
  });
});
