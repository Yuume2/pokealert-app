import { useMemo, useState } from 'react'
import type { ProductWithStock } from '../lib/api'
import { Badge, Card, Eyebrow, SearchInput } from '../components/ui'
import { Icon } from '../components/Icons'
import { cn } from '../lib/cn'
import { haptic } from '../lib/telegram'

type Filter = 'all' | 'tracked' | 'in_stock' | 'ETB' | 'Bundle' | 'Tripack'

interface Props {
  stock: ProductWithStock[]
  loading: boolean
  onProductClick: (p: ProductWithStock) => void
}

export function ProductsPage({ stock, loading, onProductClick }: Props) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const autoScanCount = stock.filter((p) => p.auto_scan === true).length

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return stock.filter((p) => {
      if (q && !`${p.nom} ${p.serie} ${p.type_produit}`.toLowerCase().includes(q)) return false
      if (filter === 'tracked') return p.auto_scan === true
      if (filter === 'in_stock') return p.in_stock_count > 0
      if (filter === 'ETB' || filter === 'Bundle' || filter === 'Tripack') return p.type_produit === filter
      return true
    })
  }, [stock, query, filter])

  return (
    <div className="space-y-5">
      <header className="space-y-1.5 pt-1">
        <Eyebrow>Catalogue</Eyebrow>
        <h1 className="text-[1.5rem] font-bold tracking-[-0.02em] text-foreground">Produits</h1>
        <p className="text-[12px] text-muted-foreground leading-snug">
          {stock.length} produits suivis · {autoScanCount} en scan automatique
        </p>
      </header>

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Chercher un produit, une série…"
      />

      <FilterBar value={filter} onChange={setFilter} stock={stock} />

      {loading && filtered.length === 0 ? (
        <SkeletonGrid />
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-[13px] font-semibold text-foreground">Aucun produit</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Aucun produit ne correspond à ces critères.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onClick={() => {
                haptic('medium')
                onProductClick(p)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FilterBar({
  value,
  onChange,
  stock,
}: {
  value: Filter
  onChange: (f: Filter) => void
  stock: ProductWithStock[]
}) {
  const inStockCount = stock.filter((p) => p.in_stock_count > 0).length
  const trackedCount = stock.filter((p) => p.auto_scan === true).length

  const options: Array<{ id: Filter; label: string; count?: number }> = [
    { id: 'all', label: 'Tout', count: stock.length },
    { id: 'tracked', label: 'Suivis', count: trackedCount },
    { id: 'in_stock', label: 'En rayon', count: inStockCount },
    { id: 'ETB', label: 'ETB' },
    { id: 'Bundle', label: 'Bundle' },
    { id: 'Tripack', label: 'Tripack' },
  ]

  return (
    <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 pb-1 no-scrollbar">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => {
            haptic('light')
            onChange(o.id)
          }}
          className={cn(
            'shrink-0 inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-[12px] font-semibold transition-all',
            value === o.id
              ? 'bg-foreground text-background shadow-sm'
              : 'bg-card border border-border text-muted-foreground hover:text-foreground',
          )}
        >
          <span>{o.label}</span>
          {o.count != null && (
            <span
              className={cn(
                'text-[10px] tabular-nums',
                value === o.id ? 'text-background/70' : 'text-subtle-foreground',
              )}
            >
              {o.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

function ProductCard({
  product,
  onClick,
}: {
  product: ProductWithStock
  onClick: () => void
}) {
  const inStock = product.in_stock_count > 0
  const inStockFavoris = product.in_stock_favoris > 0
  const isTracked = product.auto_scan === true

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden text-left',
        'transition-all duration-200 hover:border-border-strong hover:bg-card-hover active:scale-[0.98]',
      )}
    >
      <div className="relative aspect-square bg-card-elevated overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.nom}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <Icon.Package className="h-8 w-8 opacity-30" />
          </div>
        )}

        {isTracked && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-1.5 h-5 rounded-full bg-background/80 backdrop-blur-md border border-border text-[9px] font-bold uppercase tracking-[0.1em] text-primary">
            <Icon.Activity className="h-2.5 w-2.5" />
            Suivi
          </span>
        )}

        {inStock && (
          <span
            className={cn(
              'absolute top-2 right-2 inline-flex items-center gap-1 px-1.5 h-5 rounded-full backdrop-blur-md border text-[9px] font-bold uppercase tracking-[0.1em]',
              inStockFavoris
                ? 'bg-success-muted border-success/30 text-success'
                : 'bg-background/80 border-border text-foreground',
            )}
          >
            <span
              className="block h-1.5 w-1.5 rounded-full bg-success"
              style={{ boxShadow: '0 0 6px var(--color-success-glow)' }}
            />
            En rayon
          </span>
        )}
      </div>

      <div className="p-3 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Badge variant="default">{product.type_produit}</Badge>
          <span className="text-[10px] font-semibold text-muted-foreground truncate">
            {cleanSerie(product.serie)}
          </span>
        </div>
        <p className="text-[12px] font-semibold text-foreground leading-snug line-clamp-2 min-h-[2.6em]">
          {cleanName(product.nom)}
        </p>
        <div className="flex items-end justify-between pt-1">
          <p className="text-[15px] font-bold tabular-nums text-foreground">
            {Math.round(product.prix_fnac)}€
          </p>
          {inStock && (
            <p className="text-[10px] font-semibold tabular-nums text-muted-foreground">
              {product.in_stock_count} mag.
            </p>
          )}
        </div>
      </div>
    </button>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="aspect-square skeleton" />
          <div className="p-3 space-y-2">
            <div className="h-3 w-16 skeleton rounded" />
            <div className="h-3 w-full skeleton rounded" />
            <div className="h-4 w-12 skeleton rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

function cleanName(name: string): string {
  return name
    .replace(/^(Carte|Cartes) à collectionner Pokémon\s*/i, '')
    .replace(/^Pokémon\s+/i, '')
    .replace(/Coffret Dresseur d'Élite/i, 'Coffret Élite')
    .replace(/Bundle 6 boosters/i, 'Bundle 6 boosters')
    .replace(/Pack 3 boosters/i, 'Pack 3 boosters')
    .trim()
}

function cleanSerie(serie: string): string {
  return serie.replace(/^(ME\d+|EV\d+(?:\.\d+)?|Q\d+)\s*/, '').trim() || serie
}
