import { useMemo, useState } from 'react'
import type { ProductWithStock } from '../lib/api'
import { Card, Eyebrow, Badge, Button, SearchInput } from '../components/ui'
import { Icon } from '../components/Icons'
import { cn } from '../lib/cn'
import { haptic } from '../lib/telegram'

type View = 'tracked' | 'all'

interface Props {
  stock: ProductWithStock[]
  loading: boolean
  onProductClick: (p: ProductWithStock) => void
  onRefresh: () => void
  onOpenPortfolio: () => void
}

export function TrackPage({ stock, loading, onProductClick, onRefresh, onOpenPortfolio }: Props) {
  const [view, setView] = useState<View>('tracked')
  const [query, setQuery] = useState('')

  const tracked = stock.filter((p) => p.auto_scan === true)
  const inStockCount = stock.filter((p) => p.in_stock_count > 0).length

  const list = useMemo(() => {
    const base = view === 'tracked' ? tracked : stock
    if (!query.trim()) return base
    const q = query.trim().toLowerCase()
    return base.filter((p) =>
      `${p.nom} ${p.serie} ${p.type_produit}`.toLowerCase().includes(q),
    )
  }, [view, stock, tracked, query])

  return (
    <div className="space-y-5">
      <header className="space-y-1 pt-1 flex items-end justify-between">
        <div>
          <Eyebrow>Watchlist</Eyebrow>
          <h1 className="mt-0.5 text-[1.75rem] font-bold tracking-[-0.02em] text-foreground">
            Mes produits
          </h1>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {tracked.length} suivis · {inStockCount} en rayon
          </p>
        </div>
        <button
          onClick={() => {
            haptic('light')
            onRefresh()
          }}
          className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground"
          aria-label="Rafraîchir"
        >
          <Icon.RefreshCw className="h-3.5 w-3.5" />
        </button>
      </header>

      <SegmentedToggle
        value={view}
        onChange={setView}
        options={[
          { id: 'tracked', label: 'Suivis', count: tracked.length },
          { id: 'all', label: 'Tous', count: stock.length },
        ]}
      />

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Chercher dans la liste…"
      />

      {loading && list.length === 0 ? (
        <Grid>
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </Grid>
      ) : list.length === 0 ? (
        <EmptyState view={view} onSwitch={() => setView('all')} />
      ) : (
        <>
        <Grid>
          {list.map((p) => (
            <ProductTile
              key={p.id}
              product={p}
              onClick={() => {
                haptic('medium')
                onProductClick(p)
              }}
            />
          ))}
        </Grid>
        </>
      )}

      <button
        onClick={() => {
          haptic('light')
          onOpenPortfolio()
        }}
        className="w-full flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5 text-left hover:bg-card-hover active:scale-[0.98] transition-all mt-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-muted text-primary shrink-0">
            <Icon.Wallet className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-foreground">Mon portfolio</p>
            <p className="text-[11px] text-muted-foreground">Achats, marge réalisée, ROI</p>
          </div>
        </div>
        <Icon.ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </button>
    </div>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>
}

function ProductTile({
  product,
  onClick,
}: {
  product: ProductWithStock
  onClick: () => void
}) {
  const inStockTotal = product.in_stock_count
  const inStockFav = product.in_stock_favoris
  const live = inStockTotal > 0
  const liveFav = inStockFav > 0
  const isTracked = product.auto_scan === true

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex flex-col text-left rounded-2xl border bg-card overflow-hidden',
        'transition-all duration-200 active:scale-[0.98]',
        liveFav
          ? 'border-success/40 shadow-[0_0_0_1px_var(--color-success)/15%]'
          : live
            ? 'border-border-strong'
            : 'border-border hover:border-border-strong',
      )}
    >
      <div className="relative aspect-square bg-white overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.nom}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <Icon.Package className="h-8 w-8 opacity-30" />
          </div>
        )}

        <div className="absolute top-1.5 left-1.5 right-1.5 flex items-start justify-between gap-1 pointer-events-none">
          {isTracked ? (
            <span className="inline-flex items-center gap-1 h-5 px-1.5 rounded-full bg-background/85 backdrop-blur-md border border-border text-[9px] font-bold uppercase tracking-[0.1em] text-primary">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-60" />
                <span className="relative rounded-full bg-primary h-1.5 w-1.5" />
              </span>
              Suivi
            </span>
          ) : <span />}

          {live && (
            <span
              className={cn(
                'inline-flex items-center gap-1 h-5 px-1.5 rounded-full backdrop-blur-md border text-[9px] font-bold uppercase tracking-[0.1em]',
                liveFav
                  ? 'bg-success-muted border-success/30 text-success'
                  : 'bg-background/85 border-border text-foreground',
              )}
            >
              <span
                className="block h-1.5 w-1.5 rounded-full"
                style={{
                  background: liveFav ? 'var(--color-success)' : 'var(--color-foreground)',
                  boxShadow: liveFav ? '0 0 6px var(--color-success-glow)' : 'none',
                }}
              />
              {liveFav ? `${inStockFav} fav` : inStockTotal}
            </span>
          )}
        </div>
      </div>

      <div className="p-3 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Badge variant="default">{product.type_produit}</Badge>
          <span className="text-[10px] font-semibold text-muted-foreground truncate flex-1">
            {cleanSerie(product.serie)}
          </span>
        </div>
        <p className="text-[12px] font-semibold text-foreground leading-snug line-clamp-2 min-h-[2.6em]">
          {cleanName(product.nom)}
        </p>
        <p className="text-[15px] font-bold tabular-nums text-foreground">
          {Math.round(product.prix_fnac)}€
        </p>
      </div>
    </button>
  )
}

function SegmentedToggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: Array<{ id: T; label: string; count?: number }>
}) {
  return (
    <div className="inline-flex bg-card border border-border rounded-2xl p-1 w-full">
      {options.map((o) => {
        const active = o.id === value
        return (
          <button
            key={o.id}
            onClick={() => {
              haptic('light')
              onChange(o.id)
            }}
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-2 h-9 rounded-xl text-[12px] font-semibold transition-all',
              active
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <span>{o.label}</span>
            {o.count != null && (
              <span
                className={cn(
                  'text-[10px] tabular-nums',
                  active ? 'text-background/70' : 'text-subtle-foreground',
                )}
              >
                {o.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function EmptyState({ view, onSwitch }: { view: View; onSwitch: () => void }) {
  if (view === 'tracked') {
    return (
      <Card className="p-6 text-center space-y-4">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-primary-muted text-primary flex items-center justify-center">
          <Icon.Bookmark className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-foreground">Aucun produit suivi</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Active le scan auto sur les produits que tu veux surveiller.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={onSwitch}>
          Voir tout le catalogue
        </Button>
      </Card>
    )
  }
  return (
    <Card className="p-6 text-center">
      <p className="text-[13px] font-semibold text-foreground">Aucun résultat</p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Modifie ta recherche.
      </p>
    </Card>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="aspect-square skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-16 skeleton rounded" />
        <div className="h-3 w-full skeleton rounded" />
        <div className="h-4 w-12 skeleton rounded" />
      </div>
    </div>
  )
}

function cleanName(name: string): string {
  return name
    .replace(/^(Carte|Cartes) à collectionner Pokémon\s*/i, '')
    .replace(/^Pokémon\s+/i, '')
    .replace(/Coffret Dresseur d'Élite/i, 'Coffret Élite')
    .trim()
}

function cleanSerie(serie: string): string {
  return serie.replace(/^(ME\d+|EV\d+(?:\.\d+)?|Q\d+)\s*/, '').trim() || serie
}

