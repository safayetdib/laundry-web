'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Card, Select, Spinner } from '@/components/ui';
import { useAuth } from '@/lib/auth/context';
import { useAdminOrders, useAssignPartner, useConfirmOrder, usePartners } from '@/lib/api/hooks';
import type { OrderDTO } from '@/lib/api/types';
import { formatBdt } from '@/lib/utils/money';
import { ApiError } from '@/lib/api/client';

export default function AdminOrdersPage() {
  const { isLoading, hasRole } = useAuth();
  const orders = useAdminOrders();
  const partners = usePartners();

  if (isLoading) return <Spinner />;
  if (!hasRole('admin', 'operations')) {
    return (
      <Alert tone="info">
        You need operations access. <Link href="/login" className="underline">Log in</Link> as staff.
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Order queue</h1>
      {orders.isLoading && <Spinner />}
      {orders.isError && <Alert>Could not load orders (staff access required).</Alert>}
      {orders.data?.length === 0 && <Alert tone="info">No orders yet.</Alert>}

      {orders.data?.map((o) => (
        <AdminOrderRow key={o.id} order={o} partnerOptions={partners.data ?? []} />
      ))}
    </div>
  );
}

function AdminOrderRow({
  order,
  partnerOptions,
}: {
  order: OrderDTO;
  partnerOptions: { id: string; name: string }[];
}) {
  const confirmOrder = useConfirmOrder();
  const assignPartner = useAssignPartner();
  const [partnerId, setPartnerId] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const canConfirm = order.status === 'pending_confirmation' && order.quote.status === 'approved';
  const canAssign = ['confirmed', 'pickup_scheduled', 'picked_up', 'in_service'].includes(order.status);

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold">{order.orderCode}</p>
          <p className="text-sm text-gray-500">
            {order.status.replace(/_/g, ' ')} · {order.quote.status} · {order.addressSnapshot.area}
          </p>
        </div>
        <p className="font-semibold">{formatBdt(order.quote.total)}</p>
      </div>

      {msg && <div className="mt-2"><Alert tone="success">{msg}</Alert></div>}
      {err && <div className="mt-2"><Alert>{err}</Alert></div>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {canConfirm && (
          <Button
            variant="ghost"
            disabled={confirmOrder.isPending}
            onClick={async () => {
              setErr(null);
              try {
                await confirmOrder.mutateAsync(order.id);
                setMsg('Order confirmed.');
              } catch (e) {
                setErr(e instanceof ApiError ? e.message : 'Confirm failed.');
              }
            }}
          >
            Confirm
          </Button>
        )}

        {canAssign && (
          <>
            <div className="w-48">
              <Select value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
                <option value="">Assign partner…</option>
                {partnerOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              variant="ghost"
              disabled={!partnerId || assignPartner.isPending}
              onClick={async () => {
                setErr(null);
                try {
                  await assignPartner.mutateAsync({
                    orderId: order.id,
                    partnerId,
                    items: order.quote.lines.map((l) => ({
                      orderItemId: l.orderItemId,
                      serviceCode: l.serviceCode,
                      quantity: l.quantity,
                    })),
                  });
                  setMsg('Assigned to partner.');
                } catch (e) {
                  setErr(e instanceof ApiError ? e.message : 'Assign failed.');
                }
              }}
            >
              Assign
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
