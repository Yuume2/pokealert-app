import { useEffect, useState } from 'react'
import { Card, Eyebrow, Skeleton, Badge, Button } from '../components/ui'
import { Icon } from '../components/Icons'
import {
  api,
  type TodayData,
  type TodayPrediction,
  type BriefData,
  type CalendrierEntry,
} from '../lib/api'
import { isInTelegram, haptic, openExternal } from '../lib/telegram'
import { cn } from '../lib/cn'
import { useLiveTime, formatRelativeShort } from '../lib/useLiveTime'
import { getStoreByEagid } from '../lib/stores'

interface Props {
  onStoreClick: (eagid: string) => void
  refreshing: boolean
  onRefresh: () => void
}

const useMock = !isInTelegram() || import.meta.env.VITE_USE_MOCK === 'true'

export function DropsPage({ onStoreClick, refreshing, onRefresh }: Props) {
  useLiveTime(60_000)
  const [today, setToday] = useState<TodayData | null>(null)
  const [brief, setBrief] = useState<BriefData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        if (useMock) {
          await new Promise((r) => setTimeout(r, 200))
          if (cancelled) return
          setToday(buildMockToday())
          setBrief(buildMockBrief())
        } else {
          const [t, b] = await Promise.all([api.today(), api.brief()])
          if (cancelled) return
          setToday(t)
          setBrief(b)
        }
      } catch {
        if (!cancelled) {
          setToday(buildMockToday())
          setBrief(buildMockBrief())
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    const interval = setInterval(load, 5 * 60_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [refreshing])

  if (loading) return <DropsSkeleton />
  if (!today) return null

  const topMag = today.top_3[0]
  const upcoming = (brief?.calendrier.imminent || []).slice(0, 5)

  return (
    <div className="space-y-6">
      <Header
        dayLabel={today.date_today}
        lastUpdate={today.generated_at}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />

      {topMag ? (
        <HeroCard prediction={topMag} onClick={() => onStoreClick(topMag.eagid)} />
      ) : (
        <NoPlanCard message={today.context_message} />
      )}

      {today.top_3.length > 1 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <Eyebrow>Plan B</Eyebrow>
            <span className="text-[10px] text-subtle-foreground">Si #1 raté</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {today.top_3.slice(1, 3).map((mag, i) => (
              <BackupCard
                key={mag.eagid}
                prediction={mag}
                rank={i + 2}
                onClick={() => onStoreClick(mag.eagid)}
              />
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <Eyebrow>À venir</Eyebrow>
              <p className="mt-0.5 text-[13px] font-semibold text-foreground">
                Prochaines sorties
              </p>
            </div>
            <span className="text-[10px] text-subtle-foreground tabular-nums">
              J+14 max
            </span>
          </div>
          <Card className="overflow-hidden">
            {upcoming.map((entry, i) => (
              <UpcomingRow key={i} entry={entry} isFirst={i === 0} />
            ))}
          </Card>
        </section>
      )}
    </div>
  )
}

function Header({
  dayLabel,
  lastUpdate,
  refreshing,
  onRefresh,
}: {
  dayLabel: string
  lastUpdate: string
  refreshing: boolean
  onRefresh: () => void
}) {
  const date = new Date(dayLabel + 'T00:00:00')
  const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' })
  const dayNum = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

  return (
    <header className="flex items-end justify-between gap-3 pt-1">
      <div>
        <Eyebrow>Drops</Eyebrow>
        <h1 className="mt-0.5 text-[1.75rem] font-bold tracking-[-0.02em] capitalize text-foreground">
          {dayName} {dayNum}
        </h1>
        <p className="mt-1 text-[11px] text-muted-foreground">
          MAJ {formatRelativeShort(lastUpdate)}
        </p>
      </div>
      <button
        onClick={() => {
          haptic('light')
          onRefresh()
        }}
        className={cn(
          'h-9 w-9 inline-flex items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground transition-colors',
          refreshing && 'animate-spin',
        )}
        aria-label="Rafraîchir"
      >
        <Icon.RefreshCw className="h-3.5 w-3.5" />
      </button>
    </header>
  )
}

function HeroCard({
  prediction,
  onClick,
}: {
  prediction: TodayPrediction
  onClick: () => void
}) {
  const info = getStoreByEagid(prediction.eagid)
  const isHigh = prediction.score >= 60
  const ouvertureFmt = String(prediction.ouverture).padStart(2, '0') + 'h00'

  const [scanBusy, setScanBusy] = useState(false)
  const [scanResult, setScanResult] = useState<{
    in_stock: number
    total: number
    products: Array<{ type_produit: string; serie: string; in_stock: boolean; limited: boolean }>
    at: string
  } | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)

  const handleScan = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (scanBusy) return
    haptic('medium')
    setScanBusy(true)
    setScanError(null)
    try {
      const res = await api.scanStore(prediction.eagid)
      if (!res.success) throw new Error('Scan échoué')
      setScanResult({
        in_stock: res.in_stock_count,
        total: res.total_scanned,
        products: res.products,
        at: res.scanned_at,
      })
      setTimeout(() => setScanResult(null), 60_000)
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Scan échoué')
      setTimeout(() => setScanError(null), 4000)
    } finally {
      setScanBusy(false)
    }
  }

  return (
    <div
      className={cn(
        'relative w-full text-left rounded-3xl border overflow-hidden transition-all duration-200',
        isHigh
          ? 'border-primary-border bg-card-elevated'
          : 'border-border bg-card',
      )}
    >
      {isHigh && <div className="absolute inset-0 aurora-primary opacity-30 pointer-events-none" />}

      <div className="relative p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Eyebrow>Top choix</Eyebrow>
            <h2 className="mt-1 text-[1.5rem] font-bold tracking-[-0.02em] leading-tight text-foreground">
              {info?.short ?? prediction.short ?? prediction.nom}
            </h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              {info?.nom ?? prediction.nom}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p
              className={cn(
                'text-[2.5rem] leading-none font-bold tabular-nums tracking-tight',
                isHigh ? 'text-primary' : 'text-foreground',
              )}
            >
              {ouvertureFmt}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
              Cible
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={isHigh ? 'primary' : 'default'}>
            Confiance {prediction.score}%
          </Badge>
          {prediction.en_rayon_count > 0 && (
            <Badge variant="success">
              {prediction.en_rayon_count} en rayon
            </Badge>
          )}
          {prediction.favori && <Badge variant="default">Favori</Badge>}
        </div>

        {prediction.produit_cible && (
          <div className="rounded-2xl bg-card border border-border p-3">
            <Eyebrow>Cible prioritaire</Eyebrow>
            <p className="mt-1 text-[13px] font-semibold text-foreground">
              {prediction.produit_cible}
            </p>
          </div>
        )}

        {prediction.reasoning && prediction.reasoning.length > 0 && (
          <ul className="space-y-1.5">
            {prediction.reasoning.slice(0, 3).map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                <span className="mt-1 h-1 w-1 rounded-full bg-foreground/40 shrink-0" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        )}

        {scanResult && (
          <div className="rounded-2xl border border-success/30 bg-success-muted p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Eyebrow>Live · {new Date(scanResult.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Eyebrow>
              <span className="text-[11px] font-bold text-success tabular-nums">
                {scanResult.in_stock}/{scanResult.total} en rayon
              </span>
            </div>
            <div className="space-y-1">
              {scanResult.products.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-[11px]">
                  <span className="text-foreground font-semibold truncate">
                    {p.type_produit} · {p.serie.replace(/^(ME\d+|EV\d+(?:\.\d+)?|Q\d+)\s*/, '')}
                  </span>
                  <span
                    className={cn(
                      'font-bold tabular-nums',
                      p.in_stock ? 'text-success' : 'text-muted-foreground',
                    )}
                  >
                    {p.in_stock ? (p.limited ? 'Limité' : 'En rayon') : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {scanError && (
          <p className="text-[11px] text-destructive font-semibold text-center">
            {scanError}
          </p>
        )}

        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleScan}
            disabled={scanBusy}
            className="flex-1"
          >
            {scanBusy ? (
              <>
                <Icon.RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Scan…
              </>
            ) : (
              <>
                <Icon.Zap className="h-3.5 w-3.5" />
                Scan magasin
              </>
            )}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              haptic('medium')
              onClick()
            }}
            className="flex-1"
          >
            Détails
            <Icon.ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function BackupCard({
  prediction,
  rank,
  onClick,
}: {
  prediction: TodayPrediction
  rank: number
  onClick: () => void
}) {
  const info = getStoreByEagid(prediction.eagid)
  const ouvertureFmt = String(prediction.ouverture).padStart(2, '0') + 'h'

  return (
    <button
      onClick={() => {
        haptic('light')
        onClick()
      }}
      className="text-left rounded-2xl border border-border bg-card p-3.5 hover:bg-card-hover transition-all active:scale-[0.98]"
    >
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        <span>#{rank}</span>
        <span className="text-subtle-foreground">·</span>
        <span>{prediction.score}%</span>
      </div>
      <p className="mt-1.5 text-[14px] font-bold text-foreground leading-tight truncate">
        {info?.short ?? prediction.short ?? prediction.nom}
      </p>
      <p className="mt-2 text-[18px] font-bold tabular-nums text-foreground leading-none">
        {ouvertureFmt}
      </p>
      {prediction.en_rayon_count > 0 && (
        <p className="mt-1 text-[10px] text-success font-semibold">
          {prediction.en_rayon_count} en rayon
        </p>
      )}
    </button>
  )
}

function UpcomingRow({ entry, isFirst }: { entry: CalendrierEntry; isFirst: boolean }) {
  const j = entry.j_minus_today
  const dateFmt = new Date(entry.date_sortie).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })

  const jLabel = j === 0 ? 'Aujourd\'hui' : j === 1 ? 'Demain' : `J-${j}`

  const handleClick = () => {
    if (entry.source_url) {
      haptic('light')
      openExternal(entry.source_url)
    }
  }

  const priorityColor =
    entry.priorite === 'critique'
      ? 'var(--color-destructive)'
      : entry.priorite === 'haute'
        ? 'var(--color-warning)'
        : 'var(--color-muted-foreground)'

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-card-hover',
        !isFirst && 'border-t border-border',
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="shrink-0 w-12 text-center">
          <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground">
            {jLabel}
          </p>
          <p className="mt-0.5 text-[10px] text-subtle-foreground tabular-nums">
            {dateFmt}
          </p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-foreground truncate">
            {entry.produit_nom}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground truncate">
            {entry.type_produit} · {entry.serie} · ~{entry.prix_estime}€
          </p>
        </div>
      </div>
      <div
        className="shrink-0 h-1.5 w-1.5 rounded-full"
        style={{ background: priorityColor, boxShadow: `0 0 6px ${priorityColor}` }}
      />
    </button>
  )
}

function NoPlanCard({ message }: { message: string }) {
  return (
    <Card className="p-6 text-center">
      <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-card-hover text-muted-foreground flex items-center justify-center">
        <Icon.Clock className="h-5 w-5" />
      </div>
      <p className="text-[13px] font-semibold text-foreground">Aucun plan pour aujourd'hui</p>
      <p className="mt-1 text-[11px] text-muted-foreground max-w-xs mx-auto">
        {message || 'Pas de drop critique attendu. Profite du calme.'}
      </p>
    </Card>
  )
}

function DropsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-2/3" />
      <Skeleton className="h-64" />
      <div className="grid grid-cols-2 gap-2.5">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    </div>
  )
}

function buildMockToday(): TodayData {
  return {
    generated_at: new Date().toISOString(),
    date_today: new Date().toISOString().slice(0, 10),
    paris_day: 'Monday',
    paris_hour: 9,
    is_weekend: false,
    top_3: [
      {
        eagid: '171',
        nom: 'FNAC La Défense-CNIT',
        short: 'CNIT',
        favori: true,
        score: 78,
        heure_optimale: '10h00',
        produit_cible: "ME04 Coffret Dresseur d'Élite",
        reasoning: ['Livraison FNAC mardi/jeudi', 'Stock recent observé', 'Magasin favori'],
        ouverture: 10,
        en_rayon_count: 2,
      },
      {
        eagid: '17',
        nom: 'FNAC Forum des Halles',
        short: 'Forum',
        favori: true,
        score: 62,
        heure_optimale: '10h30',
        produit_cible: '',
        reasoning: [],
        ouverture: 10,
        en_rayon_count: 1,
      },
      {
        eagid: '4',
        nom: 'FNAC Montparnasse',
        short: 'Montparnasse',
        favori: true,
        score: 55,
        heure_optimale: '11h00',
        produit_cible: '',
        reasoning: [],
        ouverture: 10,
        en_rayon_count: 0,
      },
    ],
    predictions: [],
    has_urgent: true,
    top_confidence: 78,
    sortie_imminente: [],
    prochaine_critique: null,
    context_message: 'Jour favorable',
  }
}

function buildMockBrief(): BriefData {
  return {
    generated_at: new Date().toISOString(),
    brief: {
      titre: 'Brief',
      contenu: '',
      date: new Date().toISOString(),
      score_confiance: 60,
      next_critique: null,
    },
    calendrier: {
      imminent: [
        {
          produit_nom: 'ETB Nuit Noire - Méga Darkrai ex',
          serie: 'ME05',
          type_produit: 'ETB',
          date_sortie: '2026-07-17',
          prix_estime: 55.99,
          source_url: '',
          j_minus: 53,
          j_minus_today: 53,
          priorite: 'critique',
        },
      ],
      future: [],
      total: 1,
    },
  }
}
