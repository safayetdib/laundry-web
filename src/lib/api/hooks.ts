import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, setCsrfToken } from './client';
import type {
  OrderDTO,
  PartnerDTO,
  PricingEntry,
  ServiceDTO,
  UserDTO,
  ZoneDTO,
} from './types';

// --- Auth ---

export function useMe() {
  return useQuery<{ user: UserDTO } | null>({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return await apiFetch<{ user: UserDTO }>('/auth/me');
      } catch {
        return null; // not authenticated
      }
    },
    staleTime: 60_000,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { phone: string; password: string }) =>
      apiFetch<{ user: UserDTO; csrfToken: string }>('/auth/login', { method: 'POST', body: input }),
    onSuccess: (data) => {
      setCsrfToken(data.csrfToken);
      qc.setQueryData(['me'], { user: data.user });
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ status: string }>('/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      setCsrfToken(null);
      qc.setQueryData(['me'], null);
      void qc.invalidateQueries();
    },
  });
}

// --- Catalogue / pricing / zones ---

export function useServices() {
  return useQuery<ServiceDTO[]>({ queryKey: ['services'], queryFn: () => apiFetch('/services') });
}

export function useZones() {
  return useQuery<ZoneDTO[]>({ queryKey: ['zones'], queryFn: () => apiFetch('/zones') });
}

export function useZoneAvailability(zoneId: string | undefined, date: string) {
  return useQuery<{ zone: ZoneDTO; date: string; slots: import('./types').AvailableSlot[] }>({
    queryKey: ['availability', zoneId, date],
    queryFn: () =>
      apiFetch(`/zones/availability?zoneId=${encodeURIComponent(zoneId ?? '')}&date=${date}`),
    enabled: !!zoneId && !!date,
  });
}

export function usePricing(zoneId?: string) {
  return useQuery<{ zoneId: string | null; services: PricingEntry[] }>({
    queryKey: ['pricing', zoneId ?? 'default'],
    queryFn: () => apiFetch(`/pricing${zoneId ? `?zoneId=${encodeURIComponent(zoneId)}` : ''}`),
  });
}

// --- Orders ---

export interface CreateOrderInput {
  addressSnapshot: OrderDTO['addressSnapshot'];
  zoneId: string;
  items: { serviceCode: string; quantity: number }[];
  pickupStart: string;
  deliveryFee?: number;
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrderInput) =>
      apiFetch<OrderDTO>('/orders', {
        method: 'POST',
        body: input,
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['customer-orders'] }),
  });
}

export function useApproveQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { orderId: string; quoteVersion: number }) =>
      apiFetch<OrderDTO>(`/orders/${input.orderId}/approve-quote`, {
        method: 'POST',
        body: { quoteVersion: input.quoteVersion },
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['customer-orders'] }),
  });
}

export function useCustomerOrders() {
  return useQuery<OrderDTO[]>({
    queryKey: ['customer-orders'],
    queryFn: () => apiFetch('/customer/orders'),
  });
}

// --- Admin ---

export function useAdminOrders() {
  return useQuery<OrderDTO[]>({ queryKey: ['admin-orders'], queryFn: () => apiFetch('/admin/orders') });
}

export function usePartners() {
  return useQuery<PartnerDTO[]>({ queryKey: ['partners'], queryFn: () => apiFetch('/admin/partners') });
}

export function useConfirmOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => apiFetch<OrderDTO>(`/orders/${orderId}/confirm`, { method: 'POST' }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-orders'] }),
  });
}

export function useAssignPartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      orderId: string;
      partnerId: string;
      items: { orderItemId: string; serviceCode: string; quantity: number }[];
    }) =>
      apiFetch(`/admin/orders/${input.orderId}/assignments`, {
        method: 'POST',
        body: { partnerId: input.partnerId, items: input.items },
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-orders'] }),
  });
}
