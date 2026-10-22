'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Card, Input, Spinner } from '@/components/ui';
import { useAuth } from '@/lib/auth/context';
import {
  useCompleteDelivery,
  useCompletePickup,
  useFailTask,
  useRiderManifests,
  useRiderTasks,
} from '@/lib/api/hooks';
import type { RiderTaskDTO } from '@/lib/api/types';
import { ApiError } from '@/lib/api/client';
import { formatBdt, takaToMinor } from '@/lib/utils/money';

const COMPLETABLE = ['scheduled', 'en_route', 'arrived'];

export default function RiderPage() {
  const { isLoading, hasRole } = useAuth();
  const tasks = useRiderTasks();
  const manifests = useRiderManifests();

  if (isLoading) return <Spinner />;
  if (!hasRole('rider')) {
    return (
      <Alert tone="info">
        Rider access required. <Link href="/login" className="underline">Log in</Link>.
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h1 className="text-2xl font-bold">My tasks</h1>
        {tasks.isLoading && <Spinner />}
        {tasks.isError && <Alert>Could not load tasks.</Alert>}
        {tasks.data?.length === 0 && <Alert tone="info">No tasks assigned.</Alert>}
        {tasks.data?.map((t) => <RiderTaskCard key={t.id} task={t} />)}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">My route manifests</h2>
        {manifests.data?.length === 0 && <p className="text-sm text-gray-500">No manifests assigned.</p>}
        {manifests.data?.map((m) => (
          <Card key={m.id}>
            <p className="font-semibold">
              {m.date} · {m.status.replace(/_/g, ' ')}
            </p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
              {m.stops.map((s) => (
                <li key={s.id}>
                  {s.type.replace(/_/g, ' ')} {s.orderId ? `· order ${s.orderId.slice(0, 8)}…` : ''} ({s.status})
                </li>
              ))}
            </ol>
          </Card>
        ))}
      </section>
    </div>
  );
}

function RiderTaskCard({ task }: { task: RiderTaskDTO }) {
  const completePickup = useCompletePickup();
  const completeDelivery = useCompleteDelivery();
  const failTask = useFailTask();
  const [notes, setNotes] = useState('');
  const [codTaka, setCodTaka] = useState('');
  const [reason, setReason] = useState('');
  const [counts, setCounts] = useState<Record<string, number>>(
    Object.fromEntries(task.items.map((i) => [i.orderItemId, i.quantity])),
  );
  const [err, setErr] = useState<string | null>(null);

  const run = async (fn: () => Promise<unknown>) => {
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Action failed.');
    }
  };

  const completable = COMPLETABLE.includes(task.status);

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold">
            {task.type === 'pickup' ? 'Pickup' : 'Delivery'} · {task.orderCode}
          </p>
          <p className="text-xs text-gray-400">
            {task.address.area}, {task.address.city}
          </p>
          <p className="text-sm text-gray-500">
            {task.status} · {new Date(task.scheduledStart).toLocaleString()}
            {task.attempts > 0 ? ` · ${task.attempts} attempt(s)` : ''}
          </p>
          {task.codAmountCollected !== undefined && (
            <p className="text-xs text-gray-400">COD collected {formatBdt(task.codAmountCollected)}</p>
          )}
        </div>
      </div>

      {err && <div className="mt-2"><Alert>{err}</Alert></div>}

      {completable && (
        <div className="mt-3 space-y-2">
          {task.type === 'pickup' ? (
            <>
              <p className="text-sm font-medium">Confirm counts</p>
              {task.items.map((i) => (
                <div key={i.orderItemId} className="flex items-center justify-between gap-3">
                  <span className="text-sm">{i.displayName}</span>
                  <Input
                    type="number"
                    min={0}
                    className="w-20"
                    value={counts[i.orderItemId] ?? 0}
                    onChange={(e) =>
                      setCounts((c) => ({ ...c, [i.orderItemId]: Math.max(0, Number(e.target.value) || 0) }))
                    }
                  />
                </div>
              ))}
              <Input placeholder="Condition notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
              <Button
                onClick={() =>
                  run(() =>
                    completePickup.mutateAsync({
                      id: task.id,
                      counts: Object.entries(counts).map(([orderItemId, quantity]) => ({ orderItemId, quantity })),
                      conditionNotes: notes || undefined,
                    }),
                  )
                }
              >
                Complete pickup
              </Button>
            </>
          ) : (
            <>
              <Input
                type="number"
                min={0}
                placeholder="COD collected (৳, optional)"
                value={codTaka}
                onChange={(e) => setCodTaka(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() =>
                    run(() =>
                      completeDelivery.mutateAsync({
                        id: task.id,
                        ...(codTaka ? { codAmountCollected: takaToMinor(Number(codTaka)) } : {}),
                        conditionNotes: notes || undefined,
                      }),
                    )
                  }
                >
                  Complete delivery
                </Button>
              </div>
              <div className="flex gap-2">
                <Input placeholder="Failure reason" value={reason} onChange={(e) => setReason(e.target.value)} />
                <Button
                  variant="ghost"
                  disabled={!reason}
                  onClick={() => run(() => failTask.mutateAsync({ id: task.id, reason }))}
                >
                  Mark failed
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
