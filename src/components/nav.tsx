'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui';

export function Nav() {
  const { user, logout, hasRole } = useAuth();
  const router = useRouter();

  return (
    <header className="border-b border-gray-200 bg-white">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3"
      >
        <Link href="/" className="font-semibold text-brand">
          Folded
        </Link>
        <Link href="/services" className="py-1 text-sm text-gray-700 hover:text-gray-900">
          Services
        </Link>
        {user && (
          <Link href="/book" className="py-1 text-sm text-gray-700 hover:text-gray-900">
            Book
          </Link>
        )}
        {user && (
          <Link href="/orders" className="py-1 text-sm text-gray-700 hover:text-gray-900">
            My orders
          </Link>
        )}
        {hasRole('admin', 'operations') && (
          <Link href="/admin/orders" className="py-1 text-sm text-gray-700 hover:text-gray-900">
            Admin
          </Link>
        )}
        {hasRole('partner_staff') && (
          <Link href="/partner/assignments" className="py-1 text-sm text-gray-700 hover:text-gray-900">
            Partner
          </Link>
        )}
        {hasRole('rider') && (
          <Link href="/rider" className="py-1 text-sm text-gray-700 hover:text-gray-900">
            Rider
          </Link>
        )}
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-gray-600">{user.name}</span>
              <Button
                variant="ghost"
                onClick={async () => {
                  await logout();
                  router.push('/login');
                }}
              >
                Log out
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button>Log in</Button>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
