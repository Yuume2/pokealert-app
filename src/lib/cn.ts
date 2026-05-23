import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Compose className strings, with Tailwind conflict resolution.
 * Example: cn('px-2 py-1', condition && 'bg-red-500', { 'opacity-50': isDisabled })
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
