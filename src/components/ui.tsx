import * as React from 'react'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

/* ============ TYPOGRAPHY ============ */

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground',
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
        'text-[2.5rem] leading-[1.05] tracking-[-0.03em] font-bold text-foreground',
        className,
      )}
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
  elevated,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
  interactive?: boolean
  elevated?: boolean
}) {
  const Component = onClick ? 'button' : 'div'
  return (
    <Component
      onClick={onClick}
      className={cn(
        'rounded-2xl border border-border text-left',
        elevated ? 'bg-card-elevated' : 'bg-card',
        'transition-all duration-200',
        interactive && 'pressable hover:bg-card-hover hover:border-border-strong cursor-pointer w-full',
        className,
      )}
    >
      {children}
    </Component>
  )
}

/* ============ BUTTON ============ */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
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
        'font-semibold tracking-tight',
        'transition-all duration-150 ease-out',
        'active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        size === 'sm' && 'h-9 px-4 text-sm rounded-xl',
        size === 'md' && 'h-11 px-5 text-sm rounded-2xl',
        size === 'lg' && 'h-13 px-6 text-base rounded-2xl',
        variant === 'primary' &&
          'bg-primary text-primary-foreground hover:bg-primary-hover hover:shadow-[0_0_24px_-6px_var(--color-primary-glow)]',
        variant === 'secondary' &&
          'border border-border bg-card text-foreground hover:bg-card-hover hover:border-border-strong',
        variant === 'ghost' && 'text-muted-foreground hover:bg-card hover:text-foreground',
        variant === 'destructive' &&
          'bg-destructive-muted text-destructive border border-destructive/30 hover:bg-destructive hover:text-white',
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
})

/* ============ BADGE ============ */

export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: ReactNode
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive' | 'hot'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full',
        'text-[10px] font-semibold tracking-tight uppercase',
        variant === 'default' && 'border border-border bg-card text-muted-foreground',
        variant === 'primary' && 'bg-primary-muted text-primary border border-primary-border',
        variant === 'success' && 'bg-success-muted text-success border border-success/20',
        variant === 'warning' && 'bg-warning-muted text-warning border border-warning/20',
        variant === 'destructive' &&
          'bg-destructive-muted text-destructive border border-destructive/30',
        variant === 'hot' && 'bg-[var(--color-hot-muted)] text-[var(--color-hot)] border border-[var(--color-hot)]/30',
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
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        size === 'md' && 'h-6 w-11',
        size === 'sm' && 'h-5 w-9',
        checked
          ? 'bg-primary shadow-[0_0_12px_-2px_var(--color-primary-glow)]'
          : 'bg-card border border-border',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 rounded-full bg-white transition-transform duration-200',
          size === 'md' && 'h-5 w-5',
          size === 'sm' && 'h-4 w-4',
          checked
            ? size === 'md'
              ? 'translate-x-[1.375rem]'
              : 'translate-x-[1.125rem]'
            : 'translate-x-0.5',
        )}
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
    <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center">
      {IconCmp && (
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-muted text-primary">
          <IconCmp className="h-6 w-6" />
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

/* ============ STAT ============ */

export function Stat({
  value,
  label,
  accent,
  className,
}: {
  value: string | number
  label: string
  accent?: boolean
  className?: string
}) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card px-4 py-3.5', className)}>
      <p
        className={cn(
          'text-[1.75rem] leading-none tracking-tight tabular-nums font-bold',
          accent ? 'text-primary' : 'text-foreground',
        )}
      >
        {value}
      </p>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
    </div>
  )
}

/* ============ HEAT SCORE (🔥/5) ============ */

export function HeatScore({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const cls =
    size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-base' : 'text-xs'
  if (score === 0) return null

  const flames = '🔥'.repeat(score)
  return (
    <span className={cn('inline-flex items-center font-semibold leading-none', cls)}>
      <span aria-label={`Score chaleur ${score} sur 5`}>{flames}</span>
    </span>
  )
}

/* ============ DIVIDER ============ */

export function Divider({ label }: { label?: string }) {
  if (!label) return <hr className="border-border my-6" />
  return (
    <div className="my-6 flex items-center gap-3">
      <hr className="flex-1 border-border" />
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle-foreground">
        {label}
      </span>
      <hr className="flex-1 border-border" />
    </div>
  )
}

/* ============ SEARCH INPUT ============ */

export function SearchInput({
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoFocus?: boolean
}) {
  return (
    <div className="relative">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          'w-full h-12 pl-11 pr-10 rounded-2xl',
          'bg-card border border-border',
          'text-sm font-medium text-foreground placeholder:text-muted-foreground',
          'focus:outline-none focus:border-primary-border focus:bg-card-hover',
          'transition-colors',
        )}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full hover:bg-card-hover text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Effacer"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="m18 6-12 12M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
