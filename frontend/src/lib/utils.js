import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind classes safely, resolving conflicts.
 * Usage: cn('px-4 py-2', condition && 'bg-accent', className)
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
