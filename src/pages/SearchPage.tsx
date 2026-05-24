import { useMemo, useState } from 'react'
import { Card, Eyebrow, EmptyState, SearchInput, Badge, HeatScore } from '../components/ui'
import { Icon } from '../components/Icons'
import { haptic, openExternal } from '../lib/telegram'
import type { ProductWithStock } from '../lib/api'
import { fuzzySearchProducts, heatScore } from '../lib/search'
import { cn } from '../lib/cn'
import { formatDistance, getStoreByEagid, haversineKm } from '../lib/stores'

interface Props {
  stock: ProductWithStock[]
  favoris: Set<string>
  onProductClick: (p: ProductWithStock) => void
  userLat?: number
  userLng?: number
}

const QUICK_FILTERS = [
  { id: 'all', label: 'Tout', icon: undefined },
  { id: 'ETB', label: 'ETB', icon: Icon.Box },
  { id: 'Bundle', label: 'Bundle', icon: Icon.Package },
  { id: 'Tripack', label: 'Tripack', icon: Icon.LayoutGrid },
  { id: 'instock', label: 'En rayon', icon: Icon.Zap },
]

export function SearchPage({ stock, favoris, onProductClick, userLat, userLng }: Props) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<string>('all')

  const results = useMemo(() => {
    let pool = stock
    if (filter === 'ETB' || filter === 'Bundle' || filter === 'Tripack') {
      pool = pool.filter((p) => p.type_produit === filter)
    } else if (filter === 'instock') {
      pool = pool.filter((p) => p.in_stock_count > 0)
    }
    return fuzzySearchProducts(pool, query)
  }, [stock, query, filter])

  const inStockCount = results.filter((p) => p.in_stock_count > 0).length

  return (
    <div className="space-y-5">
      <header className="pt-3 pb-1">
        <Eyebrow>Recherche</Eyebrow>
        <h1 className="mt-1 text-[2rem] font-bold tracking-[-0.03em] leading-[1.1] text-foreground">
          Trouve un produit.
        </h1>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Tape ce que tu cherches. ETB, série, magasin — je trouve.
        </p>
      </header>

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="ETB Chaos, Bundle Q126…"
        autoFocus
      />

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
        {QUICK_FILTERS.map((f) => {
          const isActive = filter === f.id
          return (
            <button
              key={f.id}
              onClick={() => {
                haptic('light')
                setFilter(f.id)
              }}
              className={cn(
                'shrink-0 inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full',
                'text-[12px] font-semibold tracking-tight transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-muted-foreground hover:bg-card-hover hover:text-foreground',
              )}
            >
              {f.icon && <f.icon className="h-3 w-3" />}
              {f.label}
            </button>
          )
        })}
      </div>

      {/* Compteur résultats */}
      {(query || filter !== 'all') && (
        <p className="text-[11px] text-muted-foreground px-1">
          <span className="font-bold text-foreground tabular-nums">{results.length}</span> résultat
          {results.length > 1 ? 's' : ''} ·{' '}
          <span className="font-bold text-success tabular-nums">{inStockCount}</span> en rayon
        </p>
      )}

      {results.length === 0 ? (
        <EmptyState
          title={query ? 'Aucun résultat' : 'Tape quelque chose'}
          description={
            query
              ? `Rien trouvé pour "${query}". Essaie un autre terme ou une autre extension.`
              : 'Cherche un coffret, un bundle ou une série Pokémon. Je trouve les magasins qui l\'ont en rayon.'
          }
          icon={Icon.Search}
        />
      ) : (
        <div className="space-y-2.5">
          {results.map((p) => (
            <SearchResultCard
              key={p.id}
              product={p}
              favoris={favoris}
              onClick={() => onProductClick(p)}
              userLat={userLat}
              userLng={userLng}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ============ RESULT CARD ============ */

function SearchResultCard({
  product,
  favoris,
  onClick,
  userLat,
  userLng,
}: {
  product: ProductWithStock
  favoris: Set<string>
  onClick: () => void
  userLat?: number
  userLng?: number
}) {
  const heat = heatScore(product, favoris)
  const TypeIcon =
    product.type_produit === 'ETB'
      ? Icon.Box
      : product.type_produit === 'Bundle'
        ? Icon.Package
        : Icon.LayoutGrid

  const inStockStores = product.stocks.filter(
    (s) =>
      s.stock_label === 'En rayon' || s.stock_label === 'En rayon- Quantité limitée',
  )

  const sortedStores = inStockStores
    .map((s) => {
      const info = getStoreByEagid(s.eagid)
      const distance =
        info && userLat != null && userLng != null
          ? haversineKm(userLat, userLng, info.lat, info.lng)
          : undefined
      return { stock: s, info, distance, isFavori: favoris.has(s.eagid) }
    })
    .sort((a, b) => {
      if (a.isFavori !== b.isFavori) return a.isFavori ? -1 : 1
      if (a.distance != null && b.distance != null) return a.distance - b.distance
      return 0
    })

  return (
    <Card interactive onClick={onClick} className="overflow-hidden">
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl shrink-0',
                inStockStores.length > 0
                  ? 'bg-primary-muted text-primary'
                  : 'bg-card text-muted-foreground border border-border',
              )}
            >
              <TypeIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {product.type_produit}
                </span>
                <span className="text-subtle-foreground">·</span>
                <span className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                  {cleanSerie(product.serie)}
                </span>
              </div>
              <p className="text-[14px] font-semibold text-foreground mt-0.5 truncate">
                {cleanName(product.nom)}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-base font-bold text-foreground tabular-nums">
              {Math.round(product.prix_fnac)}€
            </p>
            <HeatScore score={heat} size="sm" />
          </div>
        </div>
      </div>

      {/* Liste magasins */}
      {sortedStores.length > 0 ? (
        <div className="border-t border-border bg-background/30">
          <div className="px-4 py-2.5 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Disponible dans
            </span>
            <Badge variant="success">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-75" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-success" />
              </span>
              {inStockStores.length}
            </Badge>
          </div>
          <div className="border-t border-border">
            {sortedStores.slice(0, 3).map((entry) => (
              <StoreRow
                key={entry.stock.eagid}
                shortName={entry.info?.short ?? entry.stock.magasin_nom}
                distance={entry.distance}
                isFavori={entry.isFavori}
                isLimited={entry.stock.stock_label?.includes('limitée') ?? false}
                mapsUrl={entry.info?.mapsUrl ?? ''}
              />
            ))}
            {sortedStores.length > 3 && (
              <div className="border-t border-border px-4 py-2 text-center">
                <span className="text-[11px] text-muted-foreground">
                  + {sortedStores.length - 3} autre{sortedStores.length - 3 > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="border-t border-border px-4 py-2.5 flex items-center gap-2">
          <Icon.Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">Pas en rayon actuellement</span>
        </div>
      )}
    </Card>
  )
}

function StoreRow({
  shortName,
  distance,
  isFavori,
  isLimited,
  mapsUrl,
}: {
  shortName: string
  distance?: number
  isFavori: boolean
  isLimited: boolean
  mapsUrl: string
}) {
  const handleMaps = (e: React.MouseEvent) => {
    e.stopPropagation()
    haptic('light')
    if (mapsUrl) openExternal(mapsUrl)
  }

  return (
    <div className="flex items-center justify-between gap-2 px-4 py-2 border-t border-border first:border-t-0">
      <div className="flex items-center gap-2 min-w-0">
        {isFavori ? (
          <Icon.Star className="h-3 w-3 text-primary shrink-0" fill="currentColor" strokeWidth={0} />
        ) : (
          <Icon.MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
        )}
        <span className="text-[13px] font-medium text-foreground truncate">{shortName}</span>
        {isLimited && (
          <span className="text-[9px] uppercase font-bold tracking-[0.12em] text-warning shrink-0">
            Limité
          </span>
        )}
        {distance != null && (
          <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
            {formatDistance(distance)}
          </span>
        )}
      </div>
      {mapsUrl && (
        <button
          onClick={handleMaps}
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-card transition-colors active:scale-90"
          aria-label="Itinéraire"
        >
          <Icon.Navigation className="h-3 w-3" />
        </button>
      )}
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

function cleanSerie(serie: string): string {
  return serie.replace(/^(ME\d+|EV\d+(?:\.\d+)?|Q\d+)\s*/, '').trim() || serie
}

