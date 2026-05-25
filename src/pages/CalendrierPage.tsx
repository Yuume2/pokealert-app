import { useEffect, useState } from 'react'
import { Card, Eyebrow, Skeleton, Badge, EmptyState } from '../components/ui'
import { Icon } from '../components/Icons'
import { api, type BriefData, type CalendrierEntry } from '../lib/api'
import { isInTelegram, haptic, openExternal } from '../lib/telegram'
import { cn } from '../lib/cn'

const useMock = !isInTelegram() || import.meta.env.VITE_USE_MOCK === 'true'

export function CalendrierPage() {
  const [data, setData] = useState<BriefData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        if (useMock) {
          await new Promise((r) => setTimeout(r, 200))
          if (cancelled) return
          setData(buildMock())
        } else {
          const d = await api.brief()
          if (cancelled) return
          setData(d)
        }
      } catch {
        if (!cancelled) setData(buildMock())
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-5">
      <header className="pt-3 pb-1">
        <Eyebrow>Calendrier</Eyebrow>
        <h1 className="mt-1 text-[2rem] font-bold tracking-[-0.03em] leading-[1.1] text-foreground">
          Sorties officielles
        </h1>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Calendrier Pokemon TCG 2026. Filtre par défaut : sorties à venir dans les 14 prochains jours.
        </p>
      </header>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-[100px]" />
          <Skeleton className="h-[100px]" />
        </div>
      ) : !data ? null : (
        <>
          <NextCritique entry={data.brief.next_critique} />
          <Filters showAll={showAll} onToggle={() => setShowAll(!showAll)} />
          <Sections data={data} showAll={showAll} />
        </>
      )}
    </div>
  )
}

function NextCritique({ entry }: { entry: CalendrierEntry | null }) {
  if (!entry) return null

  const handleClick = () => {
    haptic('light')
    if (entry.source_url) openExternal(entry.source_url)
  }

  return (
    <Card
      interactive
      onClick={handleClick}
      className="p-4 border-[var(--color-hot)]/30 bg-[var(--color-hot-muted)] relative overflow-hidden"
    >
      <div className="absolute inset-0 aurora-hot opacity-40 pointer-events-none" />
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="hot">
            <Icon.Flame className="h-2.5 w-2.5" fill="currentColor" strokeWidth={0} />
            Drop majeur
          </Badge>
          <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-[var(--color-hot)] tabular-nums">
            J-{entry.j_minus_today ?? entry.j_minus}
          </span>
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {entry.type_produit} · {entry.serie}
        </p>
        <h2 className="mt-1 text-xl font-bold text-foreground tracking-[-0.02em]">
          {cleanName(entry.produit_nom)}
        </h2>
        <p className="mt-2 text-[12px] text-muted-foreground">
          Sortie {formatDate(entry.date_sortie)} · {Math.round(entry.prix_estime)}€ retail
        </p>
      </div>
    </Card>
  )
}

function Filters({ showAll, onToggle }: { showAll: boolean; onToggle: () => void }) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => {
          haptic('light')
          if (showAll) onToggle()
        }}
        className={cn(
          'flex-1 h-10 rounded-2xl text-[12px] font-semibold transition-colors',
          !showAll
            ? 'bg-primary text-primary-foreground'
            : 'bg-card border border-border text-muted-foreground hover:text-foreground',
        )}
      >
        14 prochains jours
      </button>
      <button
        onClick={() => {
          haptic('light')
          if (!showAll) onToggle()
        }}
        className={cn(
          'flex-1 h-10 rounded-2xl text-[12px] font-semibold transition-colors',
          showAll
            ? 'bg-primary text-primary-foreground'
            : 'bg-card border border-border text-muted-foreground hover:text-foreground',
        )}
      >
        Tout voir
      </button>
    </div>
  )
}

function Sections({ data, showAll }: { data: BriefData; showAll: boolean }) {
  const imminent = data.calendrier.imminent
  const future = data.calendrier.future
  const past = data.calendrier.past_recent ?? []

  if (showAll) {
    return (
      <>
        {imminent.length > 0 && (
          <CalSection title="Imminent (J-2 → J+14)" items={imminent} highlight />
        )}
        {future.length > 0 && (
          <CalSection title="À venir (J+14 → J+90)" items={future} />
        )}
        {past.length > 0 && (
          <CalSection title="Passé (30 derniers jours)" items={past} faded />
        )}
      </>
    )
  }

  if (imminent.length === 0) {
    return (
      <EmptyState
        title="Pas de sortie dans les 14 prochains jours"
        description="Active le filtre 'Tout voir' pour consulter les sorties à venir au-delà."
        icon={Icon.Clock}
      />
    )
  }

  return <CalSection title="Imminent (J-2 → J+14)" items={imminent} highlight />
}

function CalSection({
  title,
  items,
  highlight,
  faded,
}: {
  title: string
  items: CalendrierEntry[]
  highlight?: boolean
  faded?: boolean
}) {
  return (
    <section className="space-y-3">
      <div className="px-1">
        <Eyebrow>{title}</Eyebrow>
        <h2 className="mt-0.5 text-base font-semibold text-foreground">
          {items.length} produit{items.length > 1 ? 's' : ''}
        </h2>
      </div>
      <div className="space-y-2">
        {items.map((e, i) => (
          <CalCard key={e.produit_nom + i} entry={e} highlight={highlight} faded={faded} />
        ))}
      </div>
    </section>
  )
}

function CalCard({
  entry,
  highlight,
  faded,
}: {
  entry: CalendrierEntry
  highlight?: boolean
  faded?: boolean
}) {
  const TypeIcon =
    entry.type_produit === 'ETB'
      ? Icon.Box
      : entry.type_produit === 'Bundle'
        ? Icon.Package
        : Icon.LayoutGrid

  const j = entry.j_minus_today ?? entry.j_minus
  const isCritique = entry.priorite === 'critique'

  const handleClick = () => {
    haptic('light')
    if (entry.source_url) openExternal(entry.source_url)
  }

  return (
    <Card
      interactive
      onClick={handleClick}
      className={cn(
        'p-3.5',
        isCritique && highlight && 'border-[var(--color-hot)]/30',
        faded && 'opacity-60',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl shrink-0',
              isCritique
                ? 'bg-[var(--color-hot)] text-white'
                : entry.priorite === 'haute'
                  ? 'bg-primary-muted text-primary'
                  : 'bg-card-hover text-muted-foreground border border-border',
            )}
          >
            <TypeIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {entry.type_produit}
              </span>
              <span className="text-subtle-foreground">·</span>
              <span className="text-[11px] text-muted-foreground truncate">{entry.serie}</span>
              {isCritique && <Badge variant="hot">Critique</Badge>}
            </div>
            <p className="mt-0.5 text-[13px] font-semibold text-foreground truncate">
              {cleanName(entry.produit_nom)}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
              {formatDate(entry.date_sortie)} · {Math.round(entry.prix_estime)}€
            </p>
          </div>
        </div>
        <p
          className={cn(
            'text-base font-bold tabular-nums shrink-0',
            j <= 7 ? 'text-[var(--color-hot)]' : j <= 14 ? 'text-primary' : 'text-foreground',
          )}
        >
          J{j >= 0 ? '-' : '+'}
          {Math.abs(j)}
        </p>
      </div>
    </Card>
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

function buildMock(): BriefData {
  return {
    generated_at: new Date().toISOString(),
    brief: {
      titre: 'Brief mock',
      contenu: '',
      date: new Date().toISOString(),
      score_confiance: 50,
      next_critique: null,
    },
    calendrier: { imminent: [], future: [], total: 0 },
  }
}
