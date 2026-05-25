import { useEffect, useState } from 'react'
import { Card, Eyebrow, Skeleton, Badge, Button } from '../components/ui'
import { Icon } from '../components/Icons'
import { api, type TodayData, type TodayPrediction, type CalendrierEntry } from '../lib/api'
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

  return (
    <div className="space-y-6">
      <Hero
        refreshing={refreshing}
        onRefresh={onRefresh}
        dayLabel={data?.date_today}
        lastUpdate={data?.generated_at}
      />

      {loading ? (
        <SkeletonStack />
      ) : !data ? (
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Impossible de charger les prédictions.</p>
        </Card>
      ) : (
        <>
          {data.has_urgent ? (
            <UrgentBanner topConfidence={data.top_confidence} />
          ) : (
            <CalmBanner
              isWeekend={data.is_weekend}
              parisDay={data.paris_day}
              prochaineCritique={data.prochaine_critique}
            />
          )}

          <TopThreeSection top3={data.top_3} onStoreClick={onStoreClick} />

          {data.sortie_imminente && data.sortie_imminente.length > 0 && (
            <ImminentSection sorties={data.sortie_imminente} />
          )}
        </>
      )}
    </div>
  )
}

function Hero({
  refreshing,
  onRefresh,
  dayLabel,
  lastUpdate,
}: {
  refreshing: boolean
  onRefresh: () => void
  dayLabel?: string
  lastUpdate?: string
}) {
  return (
    <header className="pt-3 pb-1 relative">
      <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 h-[20rem] w-[20rem] rounded-full aurora-primary blur-[80px]" />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_16px_-4px_var(--color-primary-glow)]">
            <Icon.Target className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Aujourd'hui
            </span>
            <span className="text-[10px] text-subtle-foreground capitalize">
              {dayLabel || '...'}
            </span>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={refreshing}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-card-hover transition-colors active:scale-90',
            refreshing && 'opacity-60 pointer-events-none',
          )}
          aria-label="Rafraîchir"
        >
          <Icon.RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
        </button>
      </div>

      <h1 className="mt-5 text-[2.25rem] font-bold tracking-[-0.03em] leading-[1.05] text-foreground">
        Où aller <em className="not-italic text-primary text-glow">ce matin</em>.
      </h1>
      <p className="mt-2 text-[13px] text-muted-foreground">
        Top 3 magasins prédits par l'algo. Plus le score est haut, plus tu dois y aller.
      </p>

      {lastUpdate && (
        <p className="mt-3 text-[11px] text-subtle-foreground tabular-nums">
          Mis à jour {formatRelativeShort(lastUpdate)}
        </p>
      )}
    </header>
  )
}

function UrgentBanner({ topConfidence }: { topConfidence: number }) {
  return (
    <Card className="p-4 border-[var(--color-hot)]/30 bg-[var(--color-hot-muted)] relative overflow-hidden">
      <div className="absolute inset-0 aurora-hot opacity-50 pointer-events-none" />
      <div className="relative flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-hot)] text-white shrink-0">
          <Icon.Flame className="h-5 w-5" fill="currentColor" strokeWidth={0} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-foreground">Drop probable aujourd'hui</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Confiance algo {topConfidence}%. Va voir le magasin top dès l'ouverture.
          </p>
        </div>
      </div>
    </Card>
  )
}

function CalmBanner({
  isWeekend,
  parisDay,
  prochaineCritique,
}: {
  isWeekend: boolean
  parisDay: string
  prochaineCritique: CalendrierEntry | null
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card-hover text-muted-foreground border border-border shrink-0">
          <Icon.Compass className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-foreground capitalize">
            {isWeekend ? 'Pas de livraison FNAC le dimanche' : `Veille active · ${parisDay}`}
          </p>
          {prochaineCritique && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Prochain drop critique : {cleanName(prochaineCritique.produit_nom)} · J-{prochaineCritique.j_minus_today ?? prochaineCritique.j_minus}
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}

function TopThreeSection({
  top3,
  onStoreClick,
}: {
  top3: TodayPrediction[]
  onStoreClick: (eagid: string) => void
}) {
  return (
    <section className="space-y-3">
      <div className="px-1">
        <Eyebrow>Top 3 magasins</Eyebrow>
        <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-foreground">
          Tape pour ouvrir la fiche
        </h2>
      </div>
      <div className="space-y-2.5">
        {top3.map((mag, i) => (
          <StoreCard
            key={mag.eagid}
            prediction={mag}
            rank={i + 1}
            onClick={() => onStoreClick(mag.eagid)}
          />
        ))}
      </div>
    </section>
  )
}

function StoreCard({
  prediction,
  rank,
  onClick,
}: {
  prediction: TodayPrediction
  rank: number
  onClick: () => void
}) {
  const isTopTier = prediction.score >= 60

  const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'

  const handleMaps = (e: React.MouseEvent) => {
    e.stopPropagation()
    haptic('light')
    const info = getStoreByEagid(prediction.eagid)
    if (info) openExternal(info.mapsUrl)
  }

  return (
    <Card interactive onClick={onClick} className={cn(
      'overflow-hidden',
      isTopTier && 'border-[var(--color-hot)]/30 bg-[var(--color-hot-muted)]/30',
    )}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-base">{rankIcon}</span>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground tabular-nums">
                {prediction.heure_optimale}
              </p>
              {prediction.favori && (
                <Icon.Star className="h-3 w-3 text-primary shrink-0" fill="currentColor" strokeWidth={0} />
              )}
            </div>
            <h3 className="mt-1 text-[1.5rem] font-bold leading-[1.05] tracking-[-0.02em] text-foreground">
              {prediction.short}
            </h3>
            <p className="mt-1 text-[13px] text-muted-foreground">
              <span className="font-semibold text-foreground">{prediction.produit_cible}</span>
            </p>
          </div>
          <ConfidenceCircle score={prediction.score} highlight={isTopTier} />
        </div>

        {prediction.reasoning && prediction.reasoning.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border space-y-1">
            {prediction.reasoning.slice(0, 3).map((r, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <span className="text-subtle-foreground mt-0.5">·</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={onClick}
          >
            Voir la fiche
            <Icon.ChevronRight className="h-3 w-3" />
          </Button>
          <button
            onClick={handleMaps}
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-card-hover active:scale-90 transition-all"
            aria-label="Itinéraire"
          >
            <Icon.Navigation className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Card>
  )
}

function ConfidenceCircle({ score, highlight }: { score: number; highlight?: boolean }) {
  const r = 22
  const c = 2 * Math.PI * r
  const offset = c - (score / 100) * c
  const color = highlight
    ? 'var(--color-hot)'
    : score >= 50
      ? 'var(--color-primary)'
      : score >= 30
        ? 'var(--color-warning)'
        : 'var(--color-subtle-foreground)'

  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg className="absolute inset-0" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} stroke="var(--color-border)" strokeWidth="3" fill="none" />
        <circle
          cx="28"
          cy="28"
          r={r}
          stroke={color}
          strokeWidth="3"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
          style={{ transition: 'stroke-dashoffset 600ms ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-base font-bold tabular-nums text-foreground">
          {score}
        </span>
      </div>
    </div>
  )
}

function ImminentSection({ sorties }: { sorties: CalendrierEntry[] }) {
  return (
    <section className="space-y-3">
      <div className="px-1">
        <Eyebrow>Imminent</Eyebrow>
        <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-foreground">
          Sorties dans les 14 prochains jours
        </h2>
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
    <Card interactive onClick={handleClick} className={cn(
      'p-3.5',
      isCritique && 'border-[var(--color-hot)]/30',
    )}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {entry.type_produit}
            </span>
            {isCritique && (
              <Badge variant="hot">Critique</Badge>
            )}
          </div>
          <p className="mt-0.5 text-[13px] font-semibold text-foreground truncate">
            {cleanName(entry.produit_nom)}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
            {formatDate(entry.date_sortie)} · {Math.round(entry.prix_estime)}€
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className={cn(
            'text-base font-bold tabular-nums',
            j <= 7 ? 'text-[var(--color-hot)]' : j <= 14 ? 'text-primary' : 'text-foreground',
          )}>
            J-{j}
          </p>
        </div>
      </div>
    </Card>
  )
}

function SkeletonStack() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-[80px]" />
      <Skeleton className="h-[160px]" />
      <Skeleton className="h-[160px]" />
      <Skeleton className="h-[160px]" />
    </div>
  )
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
      { eagid: '171', nom: 'FNAC La Défense-CNIT', short: 'CNIT', favori: true, score: 33, heure_optimale: '10h00', produit_cible: 'Reconnaissance générale', reasoning: ['Magasin favori'], ouverture: 10, en_rayon_count: 0 },
      { eagid: '17', nom: 'FNAC Paris Forum des Halles', short: 'Forum des Halles', favori: true, score: 31, heure_optimale: '10h00', produit_cible: 'Reconnaissance générale', reasoning: ['Magasin favori'], ouverture: 10, en_rayon_count: 0 },
      { eagid: '4', nom: 'FNAC Paris Montparnasse', short: 'Montparnasse', favori: true, score: 29, heure_optimale: '10h00', produit_cible: 'Reconnaissance générale', reasoning: ['Magasin favori'], ouverture: 10, en_rayon_count: 0 },
    ],
    has_urgent: false,
    top_confidence: 33,
    sortie_imminente: [],
    prochaine_critique: null,
    context_message: 'Veille active sur 3 mags.',
  }
}
