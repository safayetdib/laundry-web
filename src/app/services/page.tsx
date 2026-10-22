'use client';

import { useState } from 'react';
import { Alert, Card, Select, Spinner } from '@/components/ui';
import { usePricing, useServices, useZones } from '@/lib/api/hooks';
import { formatBdt } from '@/lib/utils/money';

export default function ServicesPage() {
  const services = useServices();
  const zones = useZones();
  const [zoneId, setZoneId] = useState<string>('');
  const pricing = usePricing(zoneId || undefined);

  const priceByCode = new Map(pricing.data?.services.map((p) => [p.serviceCode, p.unitAmount]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Services &amp; prices</h1>
        <div className="w-56">
          <Select value={zoneId} onChange={(e) => setZoneId(e.target.value)} aria-label="Zone">
            <option value="">All zones</option>
            {zones.data?.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {services.isLoading && <Spinner />}
      {services.isError && <Alert>Could not load services. Is the API reachable?</Alert>}

      {services.data && services.data.length === 0 && (
        <Alert tone="info">No services are configured yet.</Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {services.data?.map((s) => {
          const price = priceByCode.get(s.code);
          return (
            <Card key={s.code}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold">{s.name}</h2>
                  {s.description && <p className="mt-1 text-sm text-gray-600">{s.description}</p>}
                  <p className="mt-1 text-xs text-gray-400">per {s.pricingUnit}</p>
                </div>
                <div className="text-right text-sm font-medium">
                  {price !== undefined ? formatBdt(price) : <span className="text-gray-400">—</span>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
