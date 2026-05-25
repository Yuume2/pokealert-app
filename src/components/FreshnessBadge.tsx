import { computeFreshness } from '../lib/freshness'
import { useLiveTime } from '../lib/useLiveTime'
import { cn } from '../lib/cn'

interface Props {
  lastCheck?: string | null
  size?: 'sm' | 'md'
  showWarning?: boolean
  className?: string
}

/**
 * Badge fraicheur qui se rafraîchit toutes les 30s.
 * Affiche un dot coloré + le label.
 */
export function FreshnessBadge({ lastCheck, size = 'sm', showWarning = false, className }: Props) {
  useLiveTime(30_000)
  const f = computeFreshness(lastCheck)

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full',
        size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-1',
        'font-semibold tabular-nums',
        className,
      )}
      style={{
        background: `${f.colorVar}1A`,
        color: f.colorVar,
        border: `1px solid ${f.colorVar}33`,
      }}
    >
      <span
        className={cn(
          'rounded-full',
          size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2',
          f.level === 'fresh' && 'animate-pulse',
        )}
        style={{
          background: f.colorVar,
          boxShadow: f.level === 'fresh' ? `0 0 8px ${f.colorVar}` : 'none',
        }}
      />
      <span>{f.shortLabel}</span>
      {showWarning && f.warning && (
        <span className="opacity-80 ml-1">· {f.warning}</span>
      )}
    </div>
  )
}

/**
 * Version verbose avec confidence % et warning si présent
 */
export function FreshnessFull({ lastCheck, className }: { lastCheck?: string | null; className?: string }) {
  useLiveTime(30_000)
  const f = computeFreshness(lastCheck)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span
        className="h-2 w-2 rounded-full shrink-0"
        style={{
          background: f.colorVar,
          boxShadow: `0 0 8px ${f.colorVar}`,
        }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold" style={{ color: f.colorVar }}>
          {f.label} · confiance {f.confidence}%
        </p>
        {f.warning && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{f.warning}</p>
        )}
      </div>
    </div>
  )
}
