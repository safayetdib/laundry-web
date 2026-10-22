import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, setCsrfToken } from './client';
import type {
  AssignmentDTO,
  DeliveryTaskDTO,
  OrderDTO,
  PartnerDTO,
  PricingEntry,
  RiderTaskDTO,
  RouteManifestDTO,
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

// --- Partner ---

export function usePartnerAssignments() {
  return useQuery<AssignmentDTO[]>({
    queryKey: ['partner-assignments'],
    queryFn: () => apiFetch('/partner/assignments'),
  });
}

export function useAcceptAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<AssignmentDTO>(`/partner/assignments/${id}/accept`, { method: 'POST' }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['partner-assignments'] }),
  });
}

export function useAssignmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; status: AssignmentDTO['status'] }) =>
      apiFetch<AssignmentDTO>(`/partner/assignments/${input.id}/status`, {
        method: 'POST',
        body: { status: input.status },
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['partner-assignments'] }),
  });
}

export function useRecordIntake() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      receivedItems: { orderItemId: string; quantity: number }[];
      conditionNotes?: string;
    }) =>
      apiFetch<AssignmentDTO>(`/partner/assignments/${input.id}/intake`, {
        method: 'POST',
        body: { receivedItems: input.receivedItems, conditionNotes: input.conditionNotes },
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['partner-assignments'] }),
  });
}

// --- Rider ---

export function useRiderTasks() {
  return useQuery<RiderTaskDTO[]>({ queryKey: ['rider-tasks'], queryFn: () => apiFetch('/rider/tasks') });
}

export function useRiderManifests() {
  return useQuery<RouteManifestDTO[]>({
    queryKey: ['rider-manifests'],
    queryFn: () => apiFetch('/rider/manifests'),
  });
}

export function useCompletePickup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      counts: { orderItemId: string; quantity: number }[];
      conditionNotes?: string;
    }) =>
      apiFetch<DeliveryTaskDTO>(`/rider/tasks/${input.id}/complete-pickup`, {
        method: 'POST',
        body: { counts: input.counts, conditionNotes: input.conditionNotes },
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['rider-tasks'] }),
  });
}

export function useCompleteDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; codAmountCollected?: number; conditionNotes?: string }) =>
      apiFetch<DeliveryTaskDTO>(`/rider/tasks/${input.id}/complete-delivery`, {
        method: 'POST',
        body: {
          ...(input.codAmountCollected !== undefined
            ? { codAmountCollected: input.codAmountCollected }
            : {}),
          conditionNotes: input.conditionNotes,
        },
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['rider-tasks'] }),
  });
}

export function useFailTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; reason: string }) =>
      apiFetch<DeliveryTaskDTO>(`/rider/tasks/${input.id}/fail`, {
        method: 'POST',
        body: { reason: input.reason },
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['rider-tasks'] }),
  });
}
