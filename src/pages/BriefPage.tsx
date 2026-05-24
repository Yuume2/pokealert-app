import { useEffect, useState } from 'react'
import { Card, Eyebrow, EmptyState, Badge, Skeleton, Button } from '../components/ui'
import { Icon } from '../components/Icons'
import { api, type BriefData, type CalendrierEntry, type ProductWithStock } from '../lib/api'
import { isInTelegram, haptic, openExternal } from '../lib/telegram'
import { cn } from '../lib/cn'
import { useLiveTime, formatRelativeShort } from '../lib/useLiveTime'

interface Props {
  stock: ProductWithStock[]
  onProductClick: (p: ProductWithStock) => void
  refreshing: boolean
  onRefresh: () => void
}

const useMock = !isInTelegram() || import.meta.env.VITE_USE_MOCK === 'true'

export function BriefPage({ stock, onProductClick, refreshing, onRefresh }: Props) {
  useLiveTime(30_000)
  const [brief, setBrief] = useState<BriefData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        if (useMock) {
          await new Promise((r) => setTimeout(r, 250))
          if (cancelled) return
          setBrief(buildMockBrief())
        } else {
          const b = await api.brief()
          if (cancelled) return
          setBrief(b)
        }
        setError(null)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur brief')
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
  }, [])

  const inStockProducts = stock.filter((p) => p.in_stock_count > 0)
  const hasLiveDrops = inStockProducts.length > 0

  return (
    <div className="space-y-6">
      <Hero refreshing={refreshing} onRefresh={onRefresh} />

      {loading ? (
        <SkeletonStack />
      ) : error ? (
        <Card className="p-4 border-destructive/30 bg-destructive/5">
          <p className="text-sm text-destructive">Erreur brief : {error}</p>
        </Card>
      ) : !brief ? (
        <EmptyState
          title="Pas de brief disponible"
          description="Le premier brief sera généré demain matin à 7h."
          icon={Icon.Sparkles}
        />
      ) : (
        <>
          {/* Brief IA */}
          {brief.brief && (
            <BriefCard brief={brief.brief} />
          )}

          {/* Drops actifs maintenant */}
          {hasLiveDrops && (
            <LiveDropsSection
              products={inStockProducts}
              onProductClick={onProductClick}
            />
          )}

          {/* Sortie imminente */}
          {brief.calendrier.imminent.length > 0 && (
            <ImminentSection imminents={brief.calendrier.imminent} />
          )}

          {/* Sortie critique à venir */}
          {brief.brief?.next_critique && (
            <NextCritiqueSection entry={brief.brief.next_critique} />
          )}

          {/* Calendrier futur */}
          {brief.calendrier.future.length > 0 && (
            <FutureSection futures={brief.calendrier.future} />
          )}
        </>
      )}
    </div>
  )
}

function Hero({ refreshing, onRefresh }: { refreshing: boolean; onRefresh: () => void }) {
  return (
    <header className="pt-3 pb-1 relative">
      <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 h-[20rem] w-[20rem] rounded-full aurora-primary blur-[80px]" />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_16px_-4px_var(--color-primary-glow)]">
            <Icon.Sparkles className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Brief IA
            </span>
            <span className="text-[10px] text-subtle-foreground">PokeAlert · Predator</span>
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
        Aujourd'hui, <em className="not-italic text-primary text-glow">cible</em> ça.
      </h1>
      <p className="mt-2 text-[13px] text-muted-foreground">
        L'IA scanne le calendrier officiel, les signaux et les patterns. Voici ta journée.
      </p>
    </header>
  )
}

function BriefCard({ brief }: { brief: BriefData['brief'] }) {
  const updatedAgo = formatRelativeShort(brief.date)
  return (
    <Card className="relative overflow-hidden p-5 border-primary-border bg-primary-muted/30">
      <div className="absolute inset-0 aurora-primary opacity-40 pointer-events-none" />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <Eyebrow>Brief du jour</Eyebrow>
          <Badge variant="primary">
            <Icon.Sparkles className="h-2.5 w-2.5" />
            {brief.score_confiance}% confiance
          </Badge>
        </div>
        <p className="text-[14px] leading-[1.55] text-foreground whitespace-pre-wrap">
          {brief.contenu}
        </p>
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {brief.titre}
          </span>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            mis à jour {updatedAgo}
          </span>
        </div>
      </div>
    </Card>
  )
}

function LiveDropsSection({
  products,
  onProductClick,
}: {
  products: ProductWithStock[]
  onProductClick: (p: ProductWithStock) => void
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div>
          <Eyebrow>En rayon maintenant</Eyebrow>
          <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-foreground">
            {products.length} drop{products.length > 1 ? 's' : ''} live
          </h2>
        </div>
        <Badge variant="success">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-75" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-success" />
          </span>
          Live
        </Badge>
      </div>

      <div className="space-y-2">
        {products.slice(0, 3).map((p) => (
          <LiveDropCard key={p.id} product={p} onClick={() => onProductClick(p)} />
        ))}
      </div>
    </section>
  )
}

function LiveDropCard({
  product,
  onClick,
}: {
  product: ProductWithStock
  onClick: () => void
}) {
  const TypeIcon =
    product.type_produit === 'ETB'
      ? Icon.Box
      : product.type_produit === 'Bundle'
        ? Icon.Package
        : Icon.LayoutGrid

  return (
    <Card interactive onClick={onClick} className="p-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-muted text-success shrink-0">
            <TypeIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {product.type_produit}
              </span>
              <span className="text-subtle-foreground">·</span>
              <span className="text-[11px] text-muted-foreground truncate">
                {cleanSerie(product.serie)}
              </span>
            </div>
            <p className="text-[13px] font-semibold text-foreground truncate mt-0.5">
              {cleanName(product.nom)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {product.in_stock_count} magasin{product.in_stock_count > 1 ? 's' : ''} ·{' '}
              <span className="font-bold text-foreground">{Math.round(product.prix_fnac)}€</span>
            </p>
          </div>
        </div>
        <Icon.ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </Card>
  )
}

function ImminentSection({ imminents }: { imminents: CalendrierEntry[] }) {
  return (
    <section className="space-y-3">
      <div className="px-1">
        <Eyebrow>Sorties imminentes</Eyebrow>
        <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-foreground">
          Dans les 14 prochains jours
        </h2>
      </div>
      <div className="space-y-2">
        {imminents.map((e, i) => (
          <CalendrierCard key={e.produit_nom + i} entry={e} highlight={e.priorite === 'critique'} />
        ))}
      </div>
    </section>
  )
}

function NextCritiqueSection({ entry }: { entry: CalendrierEntry }) {
  return (
    <section className="space-y-3">
      <div className="px-1">
        <Eyebrow>Prochaine sortie critique</Eyebrow>
        <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-foreground">
          Le drop à ne pas rater
        </h2>
      </div>
      <Card className="p-5 border-[var(--color-hot)]/30 bg-[var(--color-hot-muted)] relative overflow-hidden">
        <div className="absolute inset-0 aurora-hot opacity-50 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="hot">
              <Icon.Flame className="h-2.5 w-2.5" fill="currentColor" strokeWidth={0} />
              Critique
            </Badge>
            <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-[var(--color-hot)] tabular-nums">
              J-{entry.j_minus_today} jours
            </span>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {entry.type_produit} · {entry.serie}
          </p>
          <h3 className="mt-1 text-xl font-bold text-foreground tracking-[-0.02em]">
            {entry.produit_nom}
          </h3>
          <div className="mt-3 flex items-center gap-4 text-[12px]">
            <div>
              <span className="text-muted-foreground">Sortie</span>
              <p className="text-foreground font-semibold mt-0.5">{formatDate(entry.date_sortie)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Prix retail</span>
              <p className="text-foreground font-bold tabular-nums mt-0.5">{entry.prix_estime.toFixed(2)}€</p>
            </div>
          </div>
          {entry.notes && (
            <p className="mt-3 pt-3 border-t border-border/40 text-[12px] text-muted-foreground leading-relaxed">
              {entry.notes}
            </p>
          )}
          {entry.source_url && (
            <Button
              variant="secondary"
              size="sm"
              className="mt-3 w-full"
              onClick={() => {
                haptic('light')
                openExternal(entry.source_url)
              }}
            >
              Voir la fiche
              <Icon.ArrowUpRight className="h-3 w-3" />
            </Button>
          )}
        </div>
      </Card>
    </section>
  )
}

function FutureSection({ futures }: { futures: CalendrierEntry[] }) {
  return (
    <section className="space-y-3">
      <div className="px-1">
        <Eyebrow>À venir</Eyebrow>
        <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-foreground">
          Calendrier complet
        </h2>
      </div>
      <div className="space-y-2">
        {futures.slice(0, 6).map((e, i) => (
          <CalendrierCard key={e.produit_nom + i} entry={e} />
        ))}
      </div>
    </section>
  )
}

function CalendrierCard({ entry, highlight }: { entry: CalendrierEntry; highlight?: boolean }) {
  const TypeIcon =
    entry.type_produit === 'ETB'
      ? Icon.Box
      : entry.type_produit === 'Bundle'
        ? Icon.Package
        : entry.type_produit === 'Tripack'
          ? Icon.LayoutGrid
          : Icon.Sparkles

  const handleClick = () => {
    haptic('light')
    if (entry.source_url) openExternal(entry.source_url)
  }

  return (
    <Card interactive onClick={handleClick} className={cn(
      'p-3.5',
      highlight && 'border-[var(--color-hot)]/30 bg-[var(--color-hot-muted)]'
    )}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl shrink-0',
              highlight
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
              <span className="text-[11px] text-muted-foreground truncate">
                {entry.serie}
              </span>
              {entry.priorite === 'critique' && (
                <Badge variant="hot" className="ml-auto shrink-0">
                  Critique
                </Badge>
              )}
            </div>
            <p className="text-[13px] font-semibold text-foreground truncate mt-0.5">
              {entry.produit_nom}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
              {formatDate(entry.date_sortie)} · J-{entry.j_minus_today} ·{' '}
              <span className="font-bold text-foreground">{Math.round(entry.prix_estime)}€</span>
            </p>
          </div>
        </div>
        <Icon.ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    </Card>
  )
}

function SkeletonStack() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-[120px]" />
      <Skeleton className="h-[80px]" />
      <Skeleton className="h-[160px]" />
    </div>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
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

function cleanSerie(serie: string): string {
  return serie.replace(/^(ME\d+|EV\d+(?:\.\d+)?|Q\d+)\s*/, '').trim() || serie
}

function buildMockBrief(): BriefData {
  return {
    generated_at: new Date().toISOString(),
    brief: {
      titre: 'Brief mock dev',
      contenu:
        "HEADLINE : ME05 Nuit Noire arrive le 17 juillet (J-53), Méga-Darkrai ex au programme.\n\nACTION PRINCIPALE : Surveille FNAC CNIT mardi-mercredi 14-15 juillet, restock probable matin 9h-11h avant ouverture.\n\nTOP 3 :\n1. ETB Nuit Noire (55,99€ retail, marge revente 75-90€)\n2. Bundle Nuit Noire (35,99€)\n3. Display 36 boosters (199€, rare en FNAC)\n\nSCORE CONFIANCE : 85%",
      date: new Date().toISOString(),
      score_confiance: 85,
      next_critique: null,
    },
    calendrier: {
      imminent: [],
      future: [],
      total: 12,
    },
  }
}
