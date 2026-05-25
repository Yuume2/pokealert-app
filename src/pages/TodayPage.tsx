import { useEffect, useState } from 'react'
import { Card, Eyebrow, Skeleton, Badge, Button } from '../components/ui'
import { Icon } from '../components/Icons'
import { api, type TodayData, type TodayPrediction, type CalendrierEntry } from '../lib/api'
import { isInTelegram, haptic, openExternal } from '../lib/telegram'
import { cn } from '../lib/cn'
import { useLiveTime, formatRelativeShort } from '../lib/useLiveTime'
import { getStoreByEagid } from '../lib/stores'
import { STORE_INSIGHTS } from '../lib/storeInsights'
import { DropFeed } from '../components/DropFeed'

interface Props {
  onStoreClick: (eagid: string) => void
  refreshing: boolean
  onRefresh: () => void
}

const useMock = !isInTelegram() || import.meta.env.VITE_USE_MOCK === 'true'

export function TodayPage({ onStoreClick, refreshing, onRefresh }: Props) {
  useLiveTime(60_000)
  const [data, setData] = useState<TodayData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        if (useMock) {
          await new Promise((r) => setTimeout(r, 250))
          if (cancelled) return
          setData(buildMockToday())
        } else {
          const d = await api.today()
          if (cancelled) return
          setData(d)
        }
      } catch {
        if (!cancelled) setData(buildMockToday())
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

  if (loading) return <SkeletonStack />
  if (!data) return null

  const topMag = data.top_3[0]
  const isHighConfidence = topMag?.score >= 60

  return (
    <div className="space-y-7">
      <Hero
        refreshing={refreshing}
        onRefresh={onRefresh}
        dayLabel={data.date_today}
        lastUpdate={data.generated_at}
        isWeekend={data.is_weekend}
        parisDay={data.paris_day}
      />

      {/* HERO CARD du jour - le top magasin en grand */}
      {topMag && (
        <HeroCard
          prediction={topMag}
          isHigh={isHighConfidence}
          onClick={() => onStoreClick(topMag.eagid)}
        />
      )}

      {/* Live feed des produits en rayon */}
      <DropFeed />

      {/* Backup magasins 2 & 3 */}
      {data.top_3.length > 1 && (
        <section className="space-y-3 stagger-2">
          <div className="px-1 flex items-center justify-between">
            <Eyebrow>Backup plan</Eyebrow>
            <span className="text-[10px] text-subtle-foreground tabular-nums">
              Si #1 raté
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {data.top_3.slice(1, 3).map((mag, i) => (
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

      {/* Sortie imminente */}
      {data.sortie_imminente && data.sortie_imminente.length > 0 && (
        <ImminentSection sorties={data.sortie_imminente} />
      )}

      {/* Footer signature */}
      <FooterSignature lastUpdate={data.generated_at} />
    </div>
  )
}

/* ========== HERO HEADER ========== */

function Hero({
  refreshing,
  onRefresh,
  dayLabel,
  lastUpdate,
  isWeekend,
  parisDay,
}: {
  refreshing: boolean
  onRefresh: () => void
  dayLabel?: string
  lastUpdate?: string
  isWeekend?: boolean
  parisDay?: string
}) {
  return (
    <header className="pt-2 pb-1 relative stagger-1">
      <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 h-[24rem] w-[28rem] rounded-full mesh-primary blur-[80px] opacity-80" />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <LogoMark />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">
              PokeAlert
            </span>
            <span className="text-[10px] text-muted-foreground capitalize">
              {dayLabel || '...'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lastUpdate && (
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-75" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-success" />
              </span>
              <span className="tabular-nums">{formatRelativeShort(lastUpdate)}</span>
            </div>
          )}
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-card-hover hover:border-border-strong transition-all active:scale-90',
              refreshing && 'opacity-60 pointer-events-none',
            )}
            aria-label="Rafraîchir"
          >
            <Icon.RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          </button>
        </div>
      </div>

      <h1 className="mt-7 text-[2.75rem] font-black tracking-[-0.04em] leading-[0.95] text-foreground">
        Où aller
        <br />
        <em className="not-italic text-primary text-glow">ce matin</em>.
      </h1>
      <p className="mt-3 text-[13px] text-muted-foreground max-w-[32ch]">
        {isWeekend
          ? `${parisDay ?? 'Dimanche'} — pas de livraison FNAC. Veille passive sur les drops de la semaine.`
          : 'Les 3 magasins les plus probables aujourd\'hui. Algo + calendrier officiel + patterns observés.'}
      </p>
    </header>
  )
}

function LogoMark() {
  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-2xl bg-primary blur-md opacity-60 animate-pulse-violet" />
      <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-hover text-primary-foreground shadow-[0_0_24px_-4px_var(--color-primary-glow)]">
        <Icon.Target className="h-5 w-5" strokeWidth={2.2} />
      </div>
    </div>
  )
}

/* ========== HERO CARD - LA CARTE DU JOUR ========== */

function HeroCard({
  prediction,
  isHigh,
  onClick,
}: {
  prediction: TodayPrediction
  isHigh: boolean
  onClick: () => void
}) {
  const insight = STORE_INSIGHTS[prediction.eagid]
  const handleMaps = (e: React.MouseEvent) => {
    e.stopPropagation()
    haptic('medium')
    const info = getStoreByEagid(prediction.eagid)
    if (info) openExternal(info.mapsUrl)
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative w-full text-left rounded-3xl overflow-hidden border transition-all active:scale-[0.99] stagger-1',
        isHigh
          ? 'border-[var(--color-hot)]/40 bg-gradient-to-br from-[var(--color-hot-muted)] to-card-elevated shadow-hot'
          : 'border-primary-border bg-gradient-to-br from-primary-muted to-card-elevated shadow-glow',
      )}
    >
      {/* Mesh background animée */}
      <div className="absolute inset-0 mesh-primary opacity-50 pointer-events-none" />
      <div className="absolute inset-0 dot-pattern opacity-30 pointer-events-none" />

      {/* Scan line animée pour le wow */}
      {isHigh && (
        <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-hot)] to-transparent animate-scan-line opacity-60" />
      )}

      <div className="relative p-6">
        {/* Top row: badge + rank */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            {isHigh ? (
              <Badge variant="hot">
                <Icon.Flame className="h-2.5 w-2.5" fill="currentColor" strokeWidth={0} />
                Drop probable
              </Badge>
            ) : (
              <Badge variant="primary">
                <Icon.Target className="h-2.5 w-2.5" />
                Cible du jour
              </Badge>
            )}
            {prediction.favori && (
              <Badge variant="primary">
                <Icon.Star className="h-2.5 w-2.5" fill="currentColor" strokeWidth={0} />
                Favori
              </Badge>
            )}
          </div>
          <span className="text-[24px] font-black text-foreground/30 leading-none">#1</span>
        </div>

        {/* Heure géante */}
        <div className="mb-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Heure cible
          </p>
          <p className={cn(
            'mt-1 text-[5rem] font-black tracking-[-0.04em] leading-none tabular-nums',
            isHigh ? 'text-[var(--color-hot)] text-glow-hot' : 'text-primary text-glow',
          )}>
            {prediction.heure_optimale.replace('h00 pile', '').replace('h00', 'h')}
          </p>
        </div>

        {/* Magasin + produit */}
        <div className="mb-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Direction
          </p>
          <h2 className="mt-1 text-[1.75rem] font-bold tracking-[-0.02em] leading-tight text-foreground">
            {prediction.short}
          </h2>
          {prediction.produit_cible && (
            <p className="mt-1 text-[13px] text-muted-foreground">
              Cible : <span className="font-semibold text-foreground">{prediction.produit_cible}</span>
            </p>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <StatPill
            label="Confiance"
            value={`${prediction.score}%`}
            accent={isHigh ? 'hot' : 'primary'}
          />
          <StatPill
            label="En rayon"
            value={prediction.en_rayon_count.toString()}
            accent={prediction.en_rayon_count > 0 ? 'success' : 'muted'}
          />
          <StatPill
            label="Ouverture"
            value={`${prediction.ouverture}h`}
          />
        </div>

        {/* Reasoning compact */}
        {prediction.reasoning && prediction.reasoning.length > 0 && (
          <div className="mb-5 pt-4 border-t border-border space-y-1.5">
            {prediction.reasoning.slice(0, 3).map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                <Icon.Sparkles className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                <span>{r}</span>
              </div>
            ))}
          </div>
        )}

        {/* Insight terrain */}
        {insight && (
          <div className="mb-5 rounded-2xl border border-border bg-background/40 p-3">
            <div className="flex items-start gap-2.5">
              <Icon.Navigation className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-[11px] font-semibold text-foreground">
                  {insight.metroSortie}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {insight.etage} · {insight.rayonLocation}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CTA bar */}
        <div className="flex gap-2">
          <Button variant="primary" size="md" className="flex-1" onClick={onClick}>
            <Icon.Compass className="h-4 w-4" />
            Plan détaillé
          </Button>
          <button
            onClick={handleMaps}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-card-hover active:scale-90 transition-all"
            aria-label="Itinéraire"
          >
            <Icon.Navigation className="h-4 w-4" />
          </button>
        </div>
      </div>
    </button>
  )
}

function StatPill({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: 'primary' | 'success' | 'hot' | 'muted'
}) {
  return (
    <div className="rounded-2xl border border-border bg-background/40 px-3 py-2.5">
      <p
        className={cn(
          'text-[1.125rem] font-black leading-none tabular-nums',
          accent === 'hot'
            ? 'text-[var(--color-hot)]'
            : accent === 'success'
              ? 'text-success'
              : accent === 'primary'
                ? 'text-primary'
                : 'text-foreground',
        )}
      >
        {value}
      </p>
      <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
    </div>
  )
}

/* ========== BACKUP CARDS ========== */

function BackupCard({
  prediction,
  rank,
  onClick,
}: {
  prediction: TodayPrediction
  rank: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group relative text-left rounded-2xl border border-border bg-card hover:bg-card-hover hover:border-border-strong p-3.5 transition-all active:scale-[0.98]"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[28px] font-black text-foreground/20 leading-none">
          {rank === 2 ? '#2' : '#3'}
        </span>
        <ConfidenceMini score={prediction.score} />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {prediction.heure_optimale}
      </p>
      <p className="mt-0.5 text-base font-bold text-foreground tracking-tight leading-tight">
        {prediction.short}
      </p>
      <p className="mt-1.5 text-[10px] text-muted-foreground line-clamp-2">
        {prediction.produit_cible}
      </p>
    </button>
  )
}

function ConfidenceMini({ score }: { score: number }) {
  const color =
    score >= 60
      ? 'var(--color-hot)'
      : score >= 40
        ? 'var(--color-primary)'
        : 'var(--color-muted-foreground)'

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/60 border border-border">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
      <span className="text-[10px] font-bold tabular-nums" style={{ color }}>
        {score}%
      </span>
    </div>
  )
}

/* ========== IMMINENT SECTION ========== */

function ImminentSection({ sorties }: { sorties: CalendrierEntry[] }) {
  return (
    <section className="space-y-3 stagger-3">
      <div className="px-1 flex items-center justify-between">
        <div>
          <Eyebrow>Imminent</Eyebrow>
          <h2 className="mt-0.5 text-lg font-bold tracking-tight text-foreground">
            Sorties J-2 → J+14
          </h2>
        </div>
        <Badge variant="default">
          <Icon.Sparkles className="h-2.5 w-2.5" />
          {sorties.length}
        </Badge>
      </div>
      <div className="space-y-2">
        {sorties.map((s, i) => (
          <ImminentRow key={s.produit_nom + i} entry={s} />
        ))}
      </div>
    </section>
  )
}

function ImminentRow({ entry }: { entry: CalendrierEntry }) {
  const j = entry.j_minus_today ?? entry.j_minus
  const handleClick = () => {
    haptic('light')
    if (entry.source_url) openExternal(entry.source_url)
  }

  const isCritique = entry.priorite === 'critique'

  return (
    <Card
      interactive
      onClick={handleClick}
      className={cn(
        'p-3.5 noise',
        isCritique && 'border-[var(--color-hot)]/30 bg-[var(--color-hot-muted)]',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {entry.type_produit}
            </span>
            {isCritique && <Badge variant="hot">Critique</Badge>}
          </div>
          <p className="mt-0.5 text-[13px] font-bold text-foreground truncate">
            {cleanName(entry.produit_nom)}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
            {formatDate(entry.date_sortie)} · {Math.round(entry.prix_estime)}€
          </p>
        </div>
        <div className="text-right shrink-0">
          <p
            className={cn(
              'text-xl font-black tabular-nums leading-none',
              j <= 7 ? 'text-[var(--color-hot)]' : j <= 14 ? 'text-primary' : 'text-foreground',
            )}
          >
            J{j >= 0 ? '-' : '+'}
            {Math.abs(j)}
          </p>
          <p className="mt-1 text-[9px] uppercase font-bold tracking-[0.12em] text-muted-foreground">
            jours
          </p>
        </div>
      </div>
    </Card>
  )
}

/* ========== FOOTER ========== */

function FooterSignature({ lastUpdate }: { lastUpdate?: string }) {
  return (
    <div className="mt-8 pt-6 border-t border-border text-center stagger-4">
      <p className="text-[10px] text-subtle-foreground italic">
        « Ce que la file d'attente ignore, PokeAlert le sait. »
      </p>
      {lastUpdate && (
        <p className="mt-2 text-[9px] font-mono text-subtle-foreground tabular-nums">
          algo v5 · sync {formatRelativeShort(lastUpdate)}
        </p>
      )}
    </div>
  )
}

/* ========== SKELETON ========== */

function SkeletonStack() {
  return (
    <div className="space-y-6 pt-4">
      <div className="space-y-3">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-14 w-64" />
      </div>
      <Skeleton className="h-[440px] rounded-3xl" />
      <div className="grid grid-cols-2 gap-2.5">
        <Skeleton className="h-[120px]" />
        <Skeleton className="h-[120px]" />
      </div>
    </div>
  )
}

/* ========== HELPERS ========== */

function cleanName(name: string): string {
  return name
    .replace(/^(Carte|Cartes) à collectionner Pokémon\s*/i, '')
    .replace(/^Pokémon\s+/i, '')
    .replace(/Coffret Dresseur d'Élite/, 'Coffret Élite')
    .replace(/Bundle 6 boosters/, 'Bundle')
    .replace(/Pack 3 boosters/, 'Pack 3')
    .trim()
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function buildMockToday(): TodayData {
  return {
    generated_at: new Date().toISOString(),
    date_today: 'lundi 25 mai',
    paris_day: 'lundi',
    paris_hour: 11,
    is_weekend: false,
    predictions: [],
    top_3: [
      { eagid: '171', nom: 'FNAC La Défense-CNIT', short: 'CNIT', favori: true, score: 33, heure_optimale: '10h00', produit_cible: 'Reconnaissance générale', reasoning: ['Magasin favori'], ouverture: 10, en_rayon_count: 2 },
      { eagid: '17', nom: 'FNAC Paris Forum des Halles', short: 'Forum des Halles', favori: true, score: 31, heure_optimale: '10h00', produit_cible: 'Restock potentiel ETB', reasoning: ['Mardi = jour de livraison'], ouverture: 10, en_rayon_count: 0 },
      { eagid: '4', nom: 'FNAC Paris Montparnasse', short: 'Montparnasse', favori: true, score: 29, heure_optimale: '10h00', produit_cible: 'Veille générale', reasoning: ['Magasin favori'], ouverture: 10, en_rayon_count: 0 },
    ],
    has_urgent: false,
    top_confidence: 33,
    sortie_imminente: [],
    prochaine_critique: null,
    context_message: 'Veille active sur 3 mags.',
  }
}
