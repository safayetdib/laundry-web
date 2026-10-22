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
      <nav className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
        <Link href="/" className="font-semibold text-brand">
          Folded
        </Link>
        <Link href="/services" className="text-sm text-gray-600 hover:text-gray-900">
          Services
        </Link>
        {user && (
          <Link href="/book" className="text-sm text-gray-600 hover:text-gray-900">
            Book
          </Link>
        )}
        {user && (
          <Link href="/orders" className="text-sm text-gray-600 hover:text-gray-900">
            My orders
          </Link>
        )}
        {hasRole('admin', 'operations') && (
          <Link href="/admin/orders" className="text-sm text-gray-600 hover:text-gray-900">
            Admin
          </Link>
        )}
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-gray-500">{user.name}</span>
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
