'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Card, Input, Spinner } from '@/components/ui';
import { useAuth } from '@/lib/auth/context';
import {
  useAcceptAssignment,
  useAssignmentStatus,
  usePartnerAssignments,
  useRecordIntake,
} from '@/lib/api/hooks';
import type { AssignmentDTO } from '@/lib/api/types';
import { ApiError } from '@/lib/api/client';

export default function PartnerAssignmentsPage() {
  const { isLoading, hasRole } = useAuth();
  const assignments = usePartnerAssignments();

  if (isLoading) return <Spinner />;
  if (!hasRole('partner_staff')) {
    return (
      <Alert tone="info">
        Partner staff access required. <Link href="/login" className="underline">Log in</Link>.
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Partner assignments</h1>
      {assignments.isLoading && <Spinner />}
      {assignments.isError && <Alert>Could not load assignments.</Alert>}
      {assignments.data?.length === 0 && <Alert tone="info">No assignments yet.</Alert>}
      {assignments.data?.map((a) => <AssignmentCard key={a.id} assignment={a} />)}
    </div>
  );
}

function AssignmentCard({ assignment }: { assignment: AssignmentDTO }) {
  const accept = useAcceptAssignment();
  const status = useAssignmentStatus();
  const intake = useRecordIntake();
  const [received, setReceived] = useState<Record<string, number>>(
    Object.fromEntries(assignment.items.map((i) => [i.orderItemId, i.quantity])),
  );
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const run = async (fn: () => Promise<unknown>) => {
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Action failed.');
    }
  };

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold">Order {assignment.orderId.slice(0, 8)}…</p>
          <p className="text-sm text-gray-500">{assignment.status.replace(/_/g, ' ')}</p>
        </div>
      </div>

      <ul className="mt-2 space-y-1 text-sm">
        {assignment.items.map((i) => (
          <li key={i.orderItemId} className="flex justify-between">
            <span>{i.serviceCode}{i.garmentCode ? ` / ${i.garmentCode}` : ''}</span>
            <span>expected {i.quantity}</span>
          </li>
        ))}
      </ul>

      {assignment.intake && assignment.intake.discrepancies.length > 0 && (
        <div className="mt-2">
          <Alert tone="info">
            Discrepancies:{' '}
            {assignment.intake.discrepancies
              .map((d) => `${d.orderItemId.slice(0, 6)} expected ${d.expected}, got ${d.received}`)
              .join('; ')}
          </Alert>
        </div>
      )}

      {err && <div className="mt-2"><Alert>{err}</Alert></div>}

      <div className="mt-3 space-y-3">
        {assignment.status === 'assigned' && (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => run(() => accept.mutateAsync(assignment.id))}>
              Accept
            </Button>
            <Button
              variant="ghost"
              onClick={() => run(() => status.mutateAsync({ id: assignment.id, status: 'rejected' }))}
            >
              Reject
            </Button>
          </div>
        )}

        {assignment.status === 'accepted' && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Record intake (received quantities)</p>
            {assignment.items.map((i) => (
              <div key={i.orderItemId} className="flex items-center justify-between gap-3">
                <span className="text-sm">{i.serviceCode}</span>
                <Input
                  type="number"
                  min={0}
                  className="w-20"
                  value={received[i.orderItemId] ?? 0}
                  onChange={(e) =>
                    setReceived((r) => ({ ...r, [i.orderItemId]: Math.max(0, Number(e.target.value) || 0) }))
                  }
                />
              </div>
            ))}
            <Input placeholder="Condition notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <Button
              onClick={() =>
                run(() =>
                  intake.mutateAsync({
                    id: assignment.id,
                    receivedItems: Object.entries(received).map(([orderItemId, quantity]) => ({
                      orderItemId,
                      quantity,
                    })),
                    conditionNotes: notes || undefined,
                  }),
                )
              }
            >
              Confirm intake
            </Button>
          </div>
        )}

        {assignment.status === 'received' && (
          <Button
            variant="ghost"
            onClick={() => run(() => status.mutateAsync({ id: assignment.id, status: 'processing' }))}
          >
            Start processing
          </Button>
        )}

        {assignment.status === 'processing' && (
          <Button
            variant="ghost"
            onClick={() => run(() => status.mutateAsync({ id: assignment.id, status: 'ready_for_collection' }))}
          >
            Mark ready for collection
          </Button>
        )}
      </div>
    </Card>
  );
}
