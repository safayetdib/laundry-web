import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils/cn';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1';

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' }
>(function Button({ className, variant = 'primary', type, ...props }, ref) {
  return (
    <button
      ref={ref}
      // Default to a non-submit button so a stray button never submits a form.
      type={type ?? 'button'}
      className={cn(
        'inline-flex min-h-11 items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        focusRing,
        variant === 'primary' && 'bg-brand text-white hover:bg-brand-dark',
        variant === 'ghost' && 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-50',
        className,
      )}
      {...props}
    />
  );
});

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'min-h-11 w-full rounded-md border border-gray-300 px-3 py-2 text-base outline-none sm:text-sm',
          'focus:border-brand focus:ring-1 focus:ring-brand',
          className,
        )}
        {...props}
      />
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          'min-h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base sm:text-sm',
          focusRing,
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-gray-700">
      {children}
    </label>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5', className)}>
      {children}
    </div>
  );
}

export function Alert({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'info' | 'success' }) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-md border px-3 py-2 text-sm',
        tone === 'error' && 'border-red-300 bg-red-50 text-red-800',
        tone === 'info' && 'border-blue-300 bg-blue-50 text-blue-800',
        tone === 'success' && 'border-green-300 bg-green-50 text-green-800',
      )}
    >
      {children}
    </div>
  );
}

const BADGE_TONES: Record<string, string> = {
  neutral: 'bg-gray-100 text-gray-800',
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  amber: 'bg-amber-100 text-amber-900',
  red: 'bg-red-100 text-red-800',
};

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: keyof typeof BADGE_TONES }) {
  return (
    <span className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-medium', BADGE_TONES[tone])}>
      {children}
    </span>
  );
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <p role="status" aria-live="polite" className="py-6 text-center text-sm text-gray-500">
      {label}
    </p>
  );
}
