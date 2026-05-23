import NumberFlow from '@number-flow/react'
import { cn } from '../lib/cn'

type NumberFlowFormat = React.ComponentProps<typeof NumberFlow>['format']

interface Props {
  value: number
  format?: NumberFlowFormat
  suffix?: string
  className?: string
}

/**
 * Number animé style éditorial (NumberFlow).
 * Typo serif display + tabular nums.
 */
export function NumberDisplay({ value, format, suffix, className }: Props) {
  return (
    <span
      className={cn(
        'font-display tabular-nums tracking-tight inline-flex items-baseline',
        className,
      )}
      style={{ fontFamily: 'var(--font-display)' }}
    >
      <NumberFlow value={value} format={format} />
      {suffix && <span className="ml-1 text-[0.5em] font-sans font-medium uppercase tracking-[0.12em] text-muted-foreground">{suffix}</span>}
    </span>
  )
}
