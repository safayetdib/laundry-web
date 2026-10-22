export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// CSRF token from the most recent login, used as a fallback to the cookie
// (the API sets a readable folded_csrf cookie via the double-submit pattern).
let csrfToken: string | null = null;
export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

function readCsrfCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)folded_csrf=([^;]+)/);
  return match && match[1] ? decodeURIComponent(match[1]) : null;
}

export function getCsrfToken(): string | null {
  return csrfToken ?? readCsrfCookie();
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

interface SuccessEnvelope<T> {
  data: T;
}
interface ErrorEnvelope {
  error: { code: string; message: string; details?: unknown };
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...options.headers };

  if (method !== 'GET') {
    const token = getCsrfToken();
    if (token) headers['x-csrf-token'] = token;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });

  const json: unknown = await res.json().catch(() => null);

  if (!res.ok || (json !== null && typeof json === 'object' && 'error' in json)) {
    const err = (json as ErrorEnvelope | null)?.error;
    throw new ApiError(
      res.status,
      err?.code ?? 'HTTP_ERROR',
      err?.message ?? res.statusText ?? 'Request failed',
      err?.details,
    );
  }

  return (json as SuccessEnvelope<T>).data;
}
