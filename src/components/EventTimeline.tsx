import { useEffect, useState } from 'react'
import { Card, Eyebrow, Badge } from './ui'
import { api, type EventEntry } from '../lib/api'
import { isInTelegram } from '../lib/telegram'
import { useLiveTime } from '../lib/useLiveTime'
import { cn } from '../lib/cn'

const useMock = !isInTelegram() || import.meta.env.VITE_USE_MOCK === 'true'

/**
 * Timeline des événements ENTRY/EXIT détectés par le bot.
 * Affiche les transitions récentes avec contexte (restock midday, fast sellout, etc).
 */
export function EventTimeline() {
  useLiveTime(60_000)
  const [events, setEvents] = useState<EventEntry[]>([])
  const [stats, setStats] = useState<{ entries_24h: number; exits_24h: number; midday_restocks_7d: number; fast_sellouts_7d: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        if (useMock) {
          await new Promise((r) => setTimeout(r, 200))
          if (cancelled) return
          setEvents(buildMockEvents())
          setStats({ entries_24h: 3, exits_24h: 2, midday_restocks_7d: 1, fast_sellouts_7d: 2 })
        } else {
          const d = await api.events()
          if (cancelled) return
          setEvents(d.recent || [])
          setStats(d.stats)
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    const interval = setInterval(load, 90_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  if (loading) return null
  if (events.length === 0) return null

  const favoriEvents = events.filter((e) => e.is_favori).slice(0, 8)
  if (favoriEvents.length === 0) return null

  return (
    <section className="space-y-3 stagger-3">
      <div className="px-1 flex items-center justify-between">
        <div>
          <Eyebrow>Timeline</Eyebrow>
          <h2 className="mt-0.5 text-lg font-bold tracking-tight text-foreground">
            Activité récente
          </h2>
        </div>
        {stats && (stats.entries_24h > 0 || stats.exits_24h > 0) && (
          <div className="flex items-center gap-1.5">
            <Badge variant="success">
              ↑ {stats.entries_24h}
            </Badge>
            <Badge variant="destructive">
              ↓ {stats.exits_24h}
            </Badge>
          </div>
        )}
      </div>

      <Card className="overflow-hidden noise">
        {favoriEvents.map((event, i) => (
          <EventRow key={event.prid + event.eagid + event.event_at} event={event} isFirst={i === 0} />
        ))}
      </Card>

      {/* Insights pattern */}
      {stats && (stats.midday_restocks_7d > 0 || stats.fast_sellouts_7d > 0) && (
        <div className="rounded-2xl border border-border bg-card/50 p-3 space-y-1.5">
          {stats.midday_restocks_7d > 0 && (
            <p className="text-[11px] text-muted-foreground">
              <span className="font-bold text-foreground">{stats.midday_restocks_7d}</span> restock{stats.midday_restocks_7d > 1 ? 's' : ''} en milieu de journée cette semaine
            </p>
          )}
          {stats.fast_sellouts_7d > 0 && (
            <p className="text-[11px] text-muted-foreground">
              <span className="font-bold text-foreground">{stats.fast_sellouts_7d}</span> épuisement{stats.fast_sellouts_7d > 1 ? 's' : ''} rapide{stats.fast_sellouts_7d > 1 ? 's' : ''} (&lt; 1h) cette semaine
            </p>
          )}
        </div>
      )}
    </section>
  )
}

function EventRow({ event, isFirst }: { event: EventEntry; isFirst: boolean }) {
  const isEntry = event.event_type === 'ENTRY' || event.event_type === 'ENTRY_INITIAL'
  const isMidday = event.context === 'restock_midday'
  const isFastSellout = event.context === 'sold_out_fast'

  const accentColor = isEntry
    ? 'var(--color-success)'
    : 'var(--color-destructive)'

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-4 py-3',
        !isFirst && 'border-t border-border',
        isMidday && 'bg-[var(--color-hot-muted)]',
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span
          className="block h-2 w-2 rounded-full shrink-0"
          style={{ background: accentColor, boxShadow: `0 0 8px ${accentColor}` }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ color: accentColor }}
            >
              {isEntry ? 'En rayon' : 'Épuisé'}
            </span>
            <span className="text-subtle-foreground">·</span>
            <span className="text-[10px] font-semibold text-muted-foreground truncate">
              {event.magasin_nom.replace('FNAC Paris ', '').replace('FNAC ', '')}
            </span>
            {isMidday && <Badge variant="hot">Midday</Badge>}
            {isFastSellout && <Badge variant="warning">Rapide</Badge>}
          </div>
          <p className="mt-0.5 text-[12px] font-semibold text-foreground truncate">
            {cleanName(event.produit_nom)}
          </p>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="text-[11px] font-bold tabular-nums text-foreground">
          {formatAge(event.age_minutes)}
        </p>
        {event.duration_minutes > 0 && !isEntry && (
          <p className="text-[9px] text-muted-foreground tabular-nums">
            durée {formatDuration(event.duration_minutes)}
          </p>
        )}
      </div>
    </div>
  )
}

function formatAge(minutes: number): string {
  if (minutes < 1) return 'maintenant'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}j`
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder > 0 ? `${hours}h${remainder}` : `${hours}h`
}

function cleanName(name: string): string {
  return name
    .replace(/^(Carte|Cartes) à collectionner Pokémon\s*/i, '')
    .replace(/^Pokémon\s+/i, '')
    .replace(/Coffret Dresseur d'Élite/, 'Coffret Élite')
    .replace(/Bundle 6 boosters/, 'Bundle')
    .replace(/Pack 3 boosters/, 'Pack 3')
    .trim()
}

function buildMockEvents(): EventEntry[] {
  return [
    {
      prid: 'mock-1',
      eagid: '171',
      event_type: 'ENTRY',
      produit_nom: "ME04 Coffret Dresseur d'Élite",
      magasin_nom: 'FNAC La Défense-CNIT',
      is_favori: true,
      event_at: new Date(Date.now() - 12 * 60000).toISOString(),
      duration_minutes: 0,
      context: 'restock_morning',
      age_minutes: 12,
    },
  ]
}
