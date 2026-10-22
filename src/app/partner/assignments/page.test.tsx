import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/auth/context';
import PartnerAssignmentsPage from './page';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

function jsonOk(data: unknown) {
  return { ok: true, status: 200, json: async () => ({ data, meta: {} }) };
}

beforeEach(() => {
  global.fetch = vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/auth/me')) {
      return Promise.resolve(
        jsonOk({ user: { id: 'ps1', name: 'PS', phone: '+8801', roles: ['partner_staff'], status: 'active', partnerId: 'p1' } }),
      );
    }
    if (url.includes('/partner/assignments')) {
      return Promise.resolve(jsonOk([]));
    }
    return Promise.resolve(jsonOk(null));
  }) as unknown as typeof fetch;
});

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <PartnerAssignmentsPage />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('PartnerAssignmentsPage', () => {
  it('renders for partner staff and shows the empty state', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Partner assignments' })).toBeInTheDocument();
    expect(await screen.findByText('No assignments yet.')).toBeInTheDocument();
  });
});
