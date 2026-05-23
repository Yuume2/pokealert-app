import { useState, useMemo } from 'react'
import { Eyebrow, Card, Badge, Skeleton, EmptyState, Stat } from '../components/ui'
import { Icon } from '../components/Icons'
import { cn } from '../lib/cn'
import { haptic, openExternal } from '../lib/telegram'
import type { ProductWithStock } from '../lib/api'

type Filter = 'all' | 'in_stock' | 'favoris'
type TypeFilter = 'all' | 'ETB' | 'Bundle' | 'Tripack'
type SortBy = 'priority' | 'name' | 'price' | 'availability'

interface Props {
  stock: ProductWithStock[]
  loading: boolean
}

export function StockPage({ stock, loading }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [sortBy] = useState<SortBy>('priority')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const r = stock.filter((p) => {
      if (filter === 'in_stock' && p.in_stock_count === 0) return false
      if (filter === 'favoris' && p.in_stock_favoris === 0) return false
      if (typeFilter !== 'all' && p.type_produit !== typeFilter) return false
      if (query) {
        const q = query.toLowerCase()
        if (!p.nom.toLowerCase().includes(q) && !p.serie.toLowerCase().includes(q)) {
          return false
        }
      }
      return true
    })

    return r.sort((a, b) => {
      if (sortBy === 'priority') {
        if (b.in_stock_favoris !== a.in_stock_favoris) return b.in_stock_favoris - a.in_stock_favoris
        if (b.in_stock_count !== a.in_stock_count) return b.in_stock_count - a.in_stock_count
        return a.nom.localeCompare(b.nom)
      }
      if (sortBy === 'name') return a.nom.localeCompare(b.nom)
      if (sortBy === 'price') return b.prix_fnac - a.prix_fnac
      return b.in_stock_count - a.in_stock_count
    })
  }, [stock, filter, typeFilter, sortBy, query])

  // Stats globales pour le header
  const totalInStock = stock.reduce((s, p) => s + p.in_stock_count, 0)
  const totalFavorisStock = stock.reduce((s, p) => s + p.in_stock_favoris, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventaire"
        title="Stock complet"
        description="Tous les produits surveillés, leur disponibilité, leurs magasins."
      />

      {!loading && (
        <div className="grid grid-cols-3 gap-2">
          <Stat value={stock.length} label="Produits" />
          <Stat value={totalInStock} label="En rayon" accent />
          <Stat value={totalFavorisStock} label="Prioritaires" />
        </div>
      )}

      <SearchInput value={query} onChange={setQuery} />

      <div className="space-y-2.5">
        <FilterRow filter={filter} onChange={setFilter} stock={stock} />
        <TypeFilterRow filter={typeFilter} onChange={setTypeFilter} />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[96px]" />)}
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

function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <header className="space-y-2">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1
        className="font-display text-[2rem] leading-[1.1] tracking-tight text-foreground"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h1>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-[34ch]">
        {description}
      </p>
    </header>
  )
}

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Icon.Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Rechercher…"
        className={cn(
          'w-full h-11 pl-11 pr-10 rounded-full',
          'bg-card border border-border',
          'text-sm text-foreground placeholder:text-muted-foreground',
          'focus:outline-none focus:border-border-strong focus:bg-card-hover',
          'transition-colors',
        )}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-card-hover flex items-center justify-center hover:bg-border transition-colors"
        >
          <Icon.X className="h-3 w-3 text-muted-foreground" />
        </button>
      )}
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
    { id: 'favoris', label: 'Prioritaires' },
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
            'shrink-0 inline-flex items-center gap-1.5 px-3.5 h-8 rounded-full text-[12px] font-medium',
            'transition-all duration-150 active:scale-[0.97]',
            filter === f.id
              ? 'bg-foreground text-background'
              : 'border border-border bg-card text-muted-foreground hover:text-foreground',
          )}
        >
          {f.label}
          <span className={cn(
            'tabular-nums text-[10px] font-semibold',
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
    { id: 'all', label: 'Tous' },
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
            'transition-all duration-150 active:scale-[0.97]',
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
            'flex h-11 w-11 items-center justify-center rounded-xl shrink-0',
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
                <Badge variant="primary" className="!py-0 !text-[9px] !px-1.5">
                  <Icon.Flame className="h-2 w-2" />
                  Prioritaire
                </Badge>
              )}
            </div>
            <h3 className="mt-1 text-[14px] font-semibold text-foreground truncate">
              {cleanProductName(product.nom)}
            </h3>
            <p className="text-[11px] text-muted-foreground truncate">{cleanSerie(product.serie)}</p>
          </div>

          <div className="text-right shrink-0">
            <p
              className="font-display text-lg leading-none tabular-nums text-foreground"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {product.prix_fnac.toFixed(0)} €
            </p>
            {hasStock ? (
              <div className="mt-1.5 inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                <span className="text-[10px] uppercase tracking-[0.12em] font-medium text-success">
                  {product.in_stock_count} dispo
                </span>
              </div>
            ) : (
              <div className="mt-1.5 inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-subtle-foreground" />
                <span className="text-[10px] uppercase tracking-[0.12em] text-subtle-foreground">
                  Rupture
                </span>
              </div>
            )}
          </div>
        </div>

        {hasStock && (
          <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-1.5">
            {product.stocks.slice(0, 6).map((s) => (
              <StoreChip
                key={s.eagid}
                storeName={s.magasin_nom}
                favori={s.magasin_favori}
                coord={s.store_coord}
                url={s.store_url}
              />
            ))}
            {product.stocks.length > 6 && (
              <span className="inline-flex items-center px-2.5 h-7 text-[11px] font-medium text-muted-foreground border border-border rounded-full bg-card">
                +{product.stocks.length - 6}
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
        'transition-all duration-150 active:scale-[0.95]',
        favori
          ? 'bg-primary-muted text-primary border border-primary-border hover:bg-primary/15'
          : 'border border-border bg-card text-muted-foreground hover:text-foreground hover:border-border-strong',
      )}
    >
      {favori && <Icon.Flame className="h-2.5 w-2.5" />}
      {cleanStoreName(storeName)}
    </button>
  )
}

function cleanProductName(name: string): string {
  return name
    .replace(/^(Carte|Cartes) à collectionner Pokémon\s*/i, '')
    .replace(/^Pokémon\s+/i, '')
    .trim()
}

function cleanSerie(serie: string): string {
  return serie.replace(/^(ME\d+|EV\d+(?:\.\d+)?|Q\d+)\s*/, '').trim() || serie
}

function cleanStoreName(name: string): string {
  return name
    .replace(/^FNAC\s+/, '')
    .replace(/^Paris\s+-?\s*/, '')
    .replace(/\s*\(rue de Rennes\)$/, '')
    .replace(/-CNIT$/, '·CNIT')
}
