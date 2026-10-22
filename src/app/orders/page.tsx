'use client';

import Link from 'next/link';
import { Alert, Badge, Button, Card, Spinner } from '@/components/ui';
import { useAuth } from '@/lib/auth/context';
import { useApproveQuote, useCustomerOrders } from '@/lib/api/hooks';
import { formatBdt } from '@/lib/utils/money';

export default function OrdersPage() {
  const { user, isLoading } = useAuth();
  const orders = useCustomerOrders();
  const approveQuote = useApproveQuote();

  if (isLoading) return <Spinner />;
  if (!user) {
    return (
      <Alert tone="info">
        Please <Link href="/login" className="underline">log in</Link> to see your orders.
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My orders</h1>
      {orders.isLoading && <Spinner />}
      {orders.isError && <Alert>Could not load your orders.</Alert>}
      {orders.data?.length === 0 && (
        <Alert tone="info">
          No orders yet. <Link href="/book" className="underline">Book a pickup</Link>.
        </Alert>
      )}

      {orders.data?.map((o) => (
        <Card key={o.id}>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold">{o.orderCode}</p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <Badge tone={o.status === 'delivered' ? 'green' : o.status === 'cancelled' ? 'red' : 'blue'}>
                  {o.status.replace(/_/g, ' ')}
                </Badge>
                <span>pickup {new Date(o.pickup.start).toLocaleString()}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{formatBdt(o.quote.total)}</p>
              <p className="text-xs text-gray-400">quote v{o.quote.version} · {o.quote.status}</p>
            </div>
          </div>
          {o.quote.status === 'pending_approval' && o.status === 'pending_confirmation' && (
            <div className="mt-3">
              <Button
                variant="ghost"
                disabled={approveQuote.isPending}
                onClick={() => approveQuote.mutate({ orderId: o.id, quoteVersion: o.quote.version })}
              >
                Approve quote
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
