'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Card, Input, Label, Select, Spinner } from '@/components/ui';
import { useAuth } from '@/lib/auth/context';
import {
  useApproveQuote,
  useCreateOrder,
  usePricing,
  useServices,
  useZoneAvailability,
  useZones,
} from '@/lib/api/hooks';
import type { OrderDTO } from '@/lib/api/types';
import { ApiError } from '@/lib/api/client';
import { formatBdt } from '@/lib/utils/money';

const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

export default function BookPage() {
  const { user, isLoading: authLoading } = useAuth();
  const zones = useZones();
  const services = useServices();

  const [zoneId, setZoneId] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [date, setDate] = useState(tomorrow);
  const [pickupStart, setPickupStart] = useState('');
  const [address, setAddress] = useState({ contactName: '', phone: '', line1: '', area: '', city: 'Chattogram' });
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [approved, setApproved] = useState(false);

  const pricing = usePricing(zoneId || undefined);
  const availability = useZoneAvailability(zoneId || undefined, date);
  const createOrder = useCreateOrder();
  const approveQuote = useApproveQuote();

  const priceByCode = useMemo(
    () => new Map(pricing.data?.services.map((p) => [p.serviceCode, p.unitAmount])),
    [pricing.data],
  );
  const estimate = useMemo(
    () =>
      Object.entries(quantities).reduce(
        (sum, [code, qty]) => sum + (priceByCode.get(code) ?? 0) * qty,
        0,
      ),
    [quantities, priceByCode],
  );

  if (authLoading) return <Spinner />;
  if (!user) {
    return (
      <Alert tone="info">
        Please <Link href="/login" className="underline">log in</Link> to book a pickup.
      </Alert>
    );
  }

  const pickupSlots = (availability.data?.slots ?? []).filter((s) => s.type === 'pickup');

  async function submit() {
    setError(null);
    const items = Object.entries(quantities)
      .filter(([, q]) => q > 0)
      .map(([serviceCode, quantity]) => ({ serviceCode, quantity }));

    if (!zoneId) return setError('Select a zone.');
    if (items.length === 0) return setError('Add at least one item.');
    if (!pickupStart) return setError('Choose a pickup window.');
    if (!address.contactName || !address.phone || !address.line1 || !address.area) {
      return setError('Complete the pickup address.');
    }

    try {
      const created = await createOrder.mutateAsync({ addressSnapshot: address, zoneId, items, pickupStart });
      setOrder(created);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the order.');
    }
  }

  if (order) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <h1 className="text-2xl font-bold">Order {order.orderCode}</h1>
        <Card>
          <h2 className="mb-2 font-semibold">Quote</h2>
          <ul className="space-y-1 text-sm">
            {order.quote.lines.map((l) => (
              <li key={l.orderItemId} className="flex justify-between">
                <span>
                  {l.displayName} × {l.quantity}
                </span>
                <span>{formatBdt(l.lineAmount)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 border-t pt-2 text-sm">
            <Row label="Subtotal" value={formatBdt(order.quote.subtotal)} />
            <Row label="Delivery" value={formatBdt(order.quote.deliveryFee)} />
            {order.quote.tax > 0 && <Row label="Tax" value={formatBdt(order.quote.tax)} />}
            <Row label="Total" value={formatBdt(order.quote.total)} strong />
          </div>
        </Card>

        {approved ? (
          <Alert tone="success">
            Quote approved. Track it under <Link href="/orders" className="underline">my orders</Link>.
          </Alert>
        ) : (
          <Button
            className="w-full"
            disabled={approveQuote.isPending}
            onClick={async () => {
              try {
                await approveQuote.mutateAsync({ orderId: order.id, quoteVersion: order.quote.version });
                setApproved(true);
              } catch (err) {
                setError(err instanceof ApiError ? err.message : 'Could not approve the quote.');
              }
            }}
          >
            {approveQuote.isPending ? 'Approving…' : 'Approve quote'}
          </Button>
        )}
        {error && <Alert>{error}</Alert>}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <h1 className="text-2xl font-bold">Book a pickup</h1>
      {error && <Alert>{error}</Alert>}

      <Card className="space-y-4">
        <div>
          <Label>Zone</Label>
          <Select value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
            <option value="">Select a zone…</option>
            {zones.data?.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label>Items</Label>
          {services.isLoading && <Spinner />}
          <div className="space-y-2">
            {services.data?.map((s) => (
              <div key={s.code} className="flex items-center justify-between gap-3">
                <span className="text-sm">
                  {s.name}
                  {priceByCode.get(s.code) !== undefined && (
                    <span className="ml-2 text-xs text-gray-400">{formatBdt(priceByCode.get(s.code)!)}</span>
                  )}
                </span>
                <Input
                  type="number"
                  min={0}
                  className="w-20"
                  value={quantities[s.code] ?? 0}
                  onChange={(e) =>
                    setQuantities((q) => ({ ...q, [s.code]: Math.max(0, Number(e.target.value) || 0) }))
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Pickup date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Pickup window</Label>
            <Select value={pickupStart} onChange={(e) => setPickupStart(e.target.value)}>
              <option value="">Select…</option>
              {pickupSlots.map((s) => (
                <option key={s.start} value={s.start}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">Pickup address</h2>
        {(['contactName', 'phone', 'line1', 'area', 'city'] as const).map((field) => (
          <div key={field}>
            <Label>{field === 'line1' ? 'Address line' : field}</Label>
            <Input
              value={address[field]}
              onChange={(e) => setAddress((a) => ({ ...a, [field]: e.target.value }))}
            />
          </div>
        ))}
      </Card>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">
          Estimated items total: <strong>{formatBdt(estimate)}</strong>
          <span className="ml-1 text-xs text-gray-400">(final quote from server)</span>
        </span>
        <Button onClick={submit} disabled={createOrder.isPending}>
          {createOrder.isPending ? 'Booking…' : 'Create order'}
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? 'font-semibold' : ''}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
