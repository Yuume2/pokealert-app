import { useState, useMemo } from 'react'
import { Eyebrow, Card, Badge, Skeleton, EmptyState } from '../components/ui'
import { Icon } from '../components/Icons'
import { cn } from '../lib/cn'
import { haptic, openExternal } from '../lib/telegram'
import type { ProductWithStock } from '../lib/api'

type Filter = 'all' | 'in_stock' | 'favoris'
type TypeFilter = 'all' | 'ETB' | 'Bundle' | 'Tripack'

interface Props {
  stock: ProductWithStock[]
  loading: boolean
}

export function StockPage({ stock, loading }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    return stock.filter((p) => {
      if (filter === 'in_stock' && p.in_stock_count === 0) return false
      if (filter === 'favoris' && p.in_stock_favoris === 0) return false
      if (typeFilter !== 'all' && p.type_produit !== typeFilter) return false
      if (query && !p.nom.toLowerCase().includes(query.toLowerCase()) && !p.serie.toLowerCase().includes(query.toLowerCase())) return false
      return true
    })
  }, [stock, filter, typeFilter, query])

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <Eyebrow>Inventaire</Eyebrow>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Stock complet</h1>
        <p className="text-sm text-muted-foreground">
          Tous les produits surveillés et leur disponibilité actuelle.
        </p>
      </header>

      <SearchInput value={query} onChange={setQuery} />

      <div className="space-y-3">
        <FilterRow filter={filter} onChange={setFilter} stock={stock} />
        <TypeFilterRow filter={typeFilter} onChange={setTypeFilter} />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[88px]" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Aucun résultat"
          description="Essaie d'élargir tes filtres ou ta recherche."
          icon={Icon.Search}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => <StockRow key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Icon.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Rechercher un produit, une série…"
        className={cn(
          'w-full h-11 pl-10 pr-4 rounded-full',
          'bg-card border border-border',
          'text-sm text-foreground placeholder:text-muted-foreground',
          'focus:outline-none focus:border-border-strong focus:bg-card-hover',
          'transition-colors',
        )}
      />
    </div>
  )
}

function FilterRow({
  filter,
  onChange,
  stock,
}: {
  filter: Filter
  onChange: (f: Filter) => void
  stock: ProductWithStock[]
}) {
  const counts = {
    all: stock.length,
    in_stock: stock.filter((p) => p.in_stock_count > 0).length,
    favoris: stock.filter((p) => p.in_stock_favoris > 0).length,
  }

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Tout' },
    { id: 'in_stock', label: 'En rayon' },
    { id: 'favoris', label: 'Mes magasins' },
  ]

  return (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4">
      {filters.map((f) => (
        <button
          key={f.id}
          onClick={() => {
            haptic('light')
            onChange(f.id)
          }}
          className={cn(
            'shrink-0 inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-medium',
            'transition-colors duration-150',
            filter === f.id
              ? 'bg-foreground text-background'
              : 'border border-border bg-card text-muted-foreground hover:text-foreground',
          )}
        >
          {f.label}
          <span className={cn(
            'tabular-nums text-[10px]',
            filter === f.id ? 'text-background/60' : 'text-subtle-foreground',
          )}>
            {counts[f.id]}
          </span>
        </button>
      ))}
    </div>
  )
}

function TypeFilterRow({
  filter,
  onChange,
}: {
  filter: TypeFilter
  onChange: (f: TypeFilter) => void
}) {
  const types: { id: TypeFilter; label: string }[] = [
    { id: 'all', label: 'Tous types' },
    { id: 'ETB', label: 'ETB' },
    { id: 'Bundle', label: 'Bundle' },
    { id: 'Tripack', label: 'Tripack' },
  ]

  return (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4">
      {types.map((t) => (
        <button
          key={t.id}
          onClick={() => {
            haptic('light')
            onChange(t.id)
          }}
          className={cn(
            'shrink-0 px-3 h-7 rounded-full text-[11px] font-medium',
            'transition-colors duration-150',
            filter === t.id
              ? 'bg-primary-muted text-primary border border-primary-border'
              : 'border border-border bg-card text-muted-foreground hover:text-foreground',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

function StockRow({ product }: { product: ProductWithStock }) {
  const TypeIcon =
    product.type_produit === 'ETB' ? Icon.Box
      : product.type_produit === 'Bundle' ? Icon.Package
        : Icon.LayoutGrid

  const hasStock = product.in_stock_count > 0
  const inFavoris = product.in_stock_favoris > 0

  return (
    <Card>
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl shrink-0',
            inFavoris ? 'bg-primary-muted text-primary'
              : hasStock ? 'bg-success-muted text-success'
                : 'bg-card-hover text-muted-foreground border border-border',
          )}>
            <TypeIcon className="h-4 w-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Eyebrow>{product.type_produit}</Eyebrow>
              {inFavoris && (
                <Badge variant="primary" className="!py-0 !text-[9px]">
                  <Icon.Flame className="h-2 w-2" />
                  Prioritaire
                </Badge>
              )}
            </div>
            <h3 className="mt-1 text-sm font-semibold text-foreground truncate">
              {cleanProductName(product.nom)}
            </h3>
            <p className="text-[11px] text-muted-foreground truncate">{product.serie}</p>
          </div>

          <div className="text-right shrink-0">
            <p className="text-sm font-semibold tabular-nums text-foreground">
              {product.prix_fnac.toFixed(0)} €
            </p>
            {hasStock ? (
              <p className="text-[10px] uppercase tracking-[0.12em] font-medium text-success mt-1">
                {product.in_stock_count} {product.in_stock_count > 1 ? 'magasins' : 'magasin'}
              </p>
            ) : (
              <p className="text-[10px] uppercase tracking-[0.12em] text-subtle-foreground mt-1">
                Rupture
              </p>
            )}
          </div>
        </div>

        {hasStock && (
          <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-1.5">
            {product.stocks.slice(0, 5).map((s) => (
              <StoreChip key={s.eagid} storeName={s.magasin_nom} favori={s.magasin_favori} coord={s.store_coord} url={s.store_url} />
            ))}
            {product.stocks.length > 5 && (
              <span className="inline-flex items-center px-2 h-6 text-[10px] text-muted-foreground">
                +{product.stocks.length - 5}
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

function StoreChip({
  storeName,
  favori,
  coord,
  url,
}: {
  storeName: string
  favori: boolean
  coord?: string | null
  url?: string
}) {
  const onClick = () => {
    haptic('light')
    const cleanCoord = coord?.replace(/[()]/g, '')
    const finalUrl = cleanCoord
      ? `https://www.google.com/maps/search/?api=1&query=${cleanCoord}`
      : url ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeName)}`
    openExternal(finalUrl)
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full text-[11px] font-medium',
        'transition-colors duration-150 active:scale-[0.96]',
        favori
          ? 'bg-primary-muted text-primary border border-primary-border'
          : 'border border-border bg-card text-muted-foreground hover:text-foreground',
      )}
    >
      {favori && <Icon.Flame className="h-2.5 w-2.5" />}
      {cleanStoreName(storeName)}
    </button>
  )
}

function cleanProductName(name: string): string {
  return name.replace(/^(Carte|Cartes) à collectionner Pokémon\s*/i, '').trim()
}

function cleanStoreName(name: string): string {
  return name.replace(/^FNAC\s+(Paris\s+)?/, '').replace(/\s+\(rue de Rennes\)$/, '')
}
