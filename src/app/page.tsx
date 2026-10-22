import Link from 'next/link';
import { Button, Card } from '@/components/ui';

export default function HomePage() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-bold">Fresh laundry, handled for you.</h1>
        <p className="text-gray-600">
          Folded picks up, cleans with a trusted partner, and delivers back to your door in
          Chattogram.
        </p>
        <div className="flex gap-3 pt-2">
          <Link href="/services">
            <Button variant="ghost">View services &amp; prices</Button>
          </Link>
          <Link href="/book">
            <Button>Book a pickup</Button>
          </Link>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['1. Book', 'Pick your services and a pickup window.'],
          ['2. We collect & clean', 'A rider collects your bag; our partner processes it.'],
          ['3. Delivered back', 'We return your laundry and reconcile payment.'],
        ].map(([title, body]) => (
          <Card key={title}>
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-gray-600">{body}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
