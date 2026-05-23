/**
 * Composants UI primitifs réutilisables.
 * Toutes les variantes du design system ici, pas dans les pages.
 */

import * as React from 'react'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

/* ============ TYPOGRAPHY ============ */

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground',
        className,
      )}
    >
      {children}
    </p>
  )
}

export function DisplayHeading({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <h1
      className={cn(
        'font-display text-[2.25rem] leading-[1.05] tracking-tight text-foreground',
        className,
      )}
      style={{ fontFamily: 'var(--font-display)' }}
    >
      {children}
    </h1>
  )
}

export function SectionHeading({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <h2 className={cn('text-lg font-semibold tracking-tight text-foreground', className)}>
      {children}
    </h2>
  )
}

/* ============ CARD ============ */

export function Card({
  children,
  className,
  onClick,
  interactive,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
  interactive?: boolean
}) {
  const Component = onClick ? 'button' : 'div'
  return (
    <Component
      onClick={onClick}
      className={cn(
        'rounded-3xl border border-border bg-card text-left',
        'transition-colors duration-200',
        interactive && 'pressable hover:bg-card-hover hover:border-border-strong cursor-pointer',
        className,
      )}
    >
      {children}
    </Component>
  )
}

/* ============ BUTTON ============ */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap',
        'font-medium tracking-tight',
        'transition-all duration-150 ease-out',
        'active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        size === 'sm' && 'h-9 px-4 text-sm rounded-full',
        size === 'md' && 'h-11 px-5 text-sm rounded-full',
        size === 'lg' && 'h-12 px-6 text-base rounded-full',
        variant === 'primary' &&
          'bg-primary text-primary-foreground hover:shadow-[0_0_24px_-8px_rgba(212,168,87,0.5)]',
        variant === 'secondary' &&
          'border border-border bg-card text-foreground hover:bg-card-hover hover:border-border-strong',
        variant === 'ghost' && 'text-foreground hover:bg-card',
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
})

/* ============ BADGE / PILL ============ */

export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: ReactNode
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full',
        'text-[11px] font-medium tracking-tight',
        variant === 'default' && 'border border-border bg-card text-muted-foreground',
        variant === 'primary' && 'bg-primary-muted text-primary border border-primary-border',
        variant === 'success' && 'bg-success-muted text-success border border-success/20',
        variant === 'warning' && 'bg-warning-muted text-warning border border-warning/20',
        variant === 'destructive' &&
          'bg-destructive-muted text-destructive border border-destructive/20',
        className,
      )}
    >
      {children}
    </span>
  )
}

/* ============ TOGGLE SWITCH ============ */

export function Switch({
  checked,
  onChange,
  size = 'md',
}: {
  checked: boolean
  onChange: () => void
  size?: 'sm' | 'md'
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        'relative rounded-full transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        size === 'md' && 'h-6 w-11',
        size === 'sm' && 'h-5 w-9',
        checked ? 'bg-primary' : 'bg-card border border-border',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 rounded-full bg-foreground transition-transform duration-200',
          size === 'md' && 'h-5 w-5',
          size === 'sm' && 'h-4 w-4',
          checked
            ? size === 'md'
              ? 'translate-x-[1.375rem]'
              : 'translate-x-[1.125rem]'
            : 'translate-x-0.5',
        )}
        style={{
          background: checked ? 'var(--color-primary-foreground)' : 'var(--color-foreground)',
        }}
      />
    </button>
  )
}

/* ============ EMPTY STATE ============ */

export function EmptyState({
  title,
  description,
  icon: IconCmp,
  action,
}: {
  title: string
  description: string
  icon?: React.ComponentType<{ className?: string }>
  action?: ReactNode
}) {
  return (
    <div className="rounded-3xl border border-border bg-card px-6 py-10 text-center">
      {IconCmp && (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-muted text-primary">
          <IconCmp className="h-5 w-5" />
        </div>
      )}
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/* ============ SKELETON ============ */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-2xl', className)} />
}

/* ============ STAT (NUMBER + LABEL) ============ */

export function Stat({
  value,
  label,
  accent,
}: {
  value: string | number
  label: string
  accent?: boolean
}) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3.5">
      <p
        className={cn(
          'font-display text-[1.625rem] leading-none tracking-tight tabular-nums',
          accent ? 'text-primary' : 'text-foreground',
        )}
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {value}
      </p>
      <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
    </div>
  )
}

/* ============ DIVIDER WITH LABEL ============ */

export function Divider({ label }: { label?: string }) {
  if (!label) return <hr className="border-border my-6" />
  return (
    <div className="my-6 flex items-center gap-3">
      <hr className="flex-1 border-border" />
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle-foreground">
        {label}
      </span>
      <hr className="flex-1 border-border" />
    </div>
  )
}
