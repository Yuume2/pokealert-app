import { useMemo } from 'react'
import { Card, Eyebrow, EmptyState, Skeleton, Badge, HeatScore } from '../components/ui'
import { Icon } from '../components/Icons'
import { StarToggle } from '../components/StarToggle'
import { haptic, openExternal } from '../lib/telegram'
import { useLiveTime, formatRelativeShort } from '../lib/useLiveTime'
import type { BotStatus, ProductWithStock, StockEntry } from '../lib/api'
import { cn } from '../lib/cn'
import { formatDistance, haversineKm, getStoreByEagid } from '../lib/stores'
import { heatScore } from '../lib/search'

interface Props {
  status: BotStatus | null
  stock: ProductWithStock[]
  loading: boolean
  refreshing: boolean
  lastFetch: number
  favoris: Set<string>
  onToggleFavori: (eagid: string) => void
  onProductClick: (p: ProductWithStock) => void
  onRefresh: () => void
  userLat?: number
  userLng?: number
}

interface StoreWithStock {
  eagid: string
  nom: string
  short: string
  isFavori: boolean
  distanceKm?: number
  products: Array<{ product: ProductWithStock; stock: StockEntry; heat: number }>
  totalProducts: number
  hasHotDrop: boolean
}

export function HomeV2Page({
  status,
  stock,
  loading,
  refreshing,
  lastFetch,
  favoris,
  onToggleFavori,
  onProductClick,
  onRefresh,
  userLat,
  userLng,
}: Props) {
  useLiveTime(15_000)

  /** Map magasins → produits en rayon. */
  const storesWithStock = useMemo<StoreWithStock[]>(() => {
    const map = new Map<string, StoreWithStock>()

    for (const product of stock) {
      for (const s of product.stocks) {
        if (!s.stock_label) continue
        const inStock =
          s.stock_label === 'En rayon' ||
          s.stock_label === 'En rayon- Quantité limitée'
        if (!inStock) continue

        let entry = map.get(s.eagid)
        if (!entry) {
          const info = getStoreByEagid(s.eagid)
          if (!info) continue
          entry = {
            eagid: s.eagid,
            nom: info.nom,
            short: info.short,
            isFavori: favoris.has(s.eagid),
            distanceKm:
              userLat != null && userLng != null
                ? haversineKm(userLat, userLng, info.lat, info.lng)
                : undefined,
            products: [],
            totalProducts: 0,
            hasHotDrop: false,
          }
          map.set(s.eagid, entry)
        }
        const score = heatScore(product, favoris)
        entry.products.push({ product, stock: s, heat: score })
        entry.totalProducts += 1
        if (score >= 4) entry.hasHotDrop = true
      }
    }

    return [...map.values()].sort((a, b) => {
      if (a.isFavori !== b.isFavori) return a.isFavori ? -1 : 1
      if (a.hasHotDrop !== b.hasHotDrop) return a.hasHotDrop ? -1 : 1
      if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm
      return b.totalProducts - a.totalProducts
    })
  }, [stock, favoris, userLat, userLng])

  const totalDispo = storesWithStock.reduce((s, st) => s + st.totalProducts, 0)
  const totalMagasins = storesWithStock.length
  const hotCount = storesWithStock.filter((s) => s.hasHotDrop).length

  return (
    <div className="space-y-6">
      <HeroHeader
        status={status}
        refreshing={refreshing}
        lastFetch={lastFetch}
        onRefresh={onRefresh}
        userLat={userLat}
      />

      {loading ? (
        <SkeletonStack />
      ) : (
        <>
          <PulseStats
            totalDispo={totalDispo}
            totalMagasins={totalMagasins}
            hotCount={hotCount}
          />

          {storesWithStock.length === 0 ? (
            <EmptyState
              title="Rien en rayon pour l'instant"
              description="Aucun produit surveillé n'est en rayon dans les magasins répertoriés. Le bot continue de scanner."
              icon={Icon.Target}
            />
          ) : (
            <StoresList
              stores={storesWithStock}
              onToggleFavori={onToggleFavori}
              onProductClick={onProductClick}
            />
          )}
        </>
      )}
    </div>
  )
}

/* ============ HERO ============ */

function HeroHeader({
  status,
  refreshing,
  lastFetch,
  onRefresh,
  userLat,
}: {
  status: BotStatus | null
  refreshing: boolean
  lastFetch: number
  onRefresh: () => void
  userLat?: number
}) {
  return (
    <header className="pt-3 pb-1 relative">
      <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 h-[20rem] w-[20rem] rounded-full aurora-primary blur-[80px]" />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LogoMark />
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              PokeAlert
            </span>
            <span className="text-[10px] text-subtle-foreground">
              {userLat ? 'Géoloc active' : 'Paris · IDF'}
            </span>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={refreshing}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full',
            'bg-card border border-border text-muted-foreground',
            'hover:bg-card-hover hover:text-foreground transition-colors',
            'active:scale-90',
            refreshing && 'opacity-60 pointer-events-none',
          )}
          aria-label="Rafraîchir"
        >
          <Icon.RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
        </button>
      </div>

      <h1 className="mt-5 text-[2.25rem] font-bold tracking-[-0.03em] leading-[1.05] text-foreground">
        En rayon <em className="not-italic text-primary text-glow">maintenant</em>.
      </h1>
      <p className="mt-2 text-[13px] text-muted-foreground">
        Tes magasins en haut, le reste trié par distance.
      </p>

      {lastFetch > 0 && (
        <div className="mt-3 inline-flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="relative flex h-1.5 w-1.5">
            {refreshing ? (
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            ) : (
              <>
                <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-75" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-success" />
              </>
            )}
          </span>
          <span className="tabular-nums">
            {refreshing
              ? 'Synchronisation…'
              : `Mis à jour ${formatRelativeShort(new Date(lastFetch).toISOString())}`}
          </span>
          {status?.next_run && !refreshing && (
            <>
              <span className="text-subtle-foreground">·</span>
              <span>prochain check {formatNextRun(status.next_run)}</span>
            </>
          )}
        </div>
      )}
    </header>
  )
}

function LogoMark() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_16px_-4px_var(--color-primary-glow)]">
      <Icon.Flame className="h-4 w-4" fill="currentColor" strokeWidth={0} />
    </div>
  )
}

/* ============ PULSE STATS ============ */

function PulseStats({
  totalDispo,
  totalMagasins,
  hotCount,
}: {
  totalDispo: number
  totalMagasins: number
  hotCount: number
}) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      <PulseCell value={totalDispo} label="Produits en rayon" accent />
      <PulseCell value={totalMagasins} label="Magasins actifs" />
      <PulseCell value={hotCount} label="Drops chauds" hot={hotCount > 0} />
    </div>
  )
}

function PulseCell({
  value,
  label,
  accent,
  hot,
}: {
  value: number
  label: string
  accent?: boolean
  hot?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border bg-card px-4 py-3.5',
        hot ? 'border-[var(--color-hot)]/30 bg-[var(--color-hot-muted)]' : 'border-border',
      )}
    >
      <p
        className={cn(
          'text-[1.75rem] leading-none tracking-[-0.02em] tabular-nums font-bold',
          hot
            ? 'text-[var(--color-hot)]'
            : accent
              ? 'text-primary'
              : 'text-foreground',
        )}
      >
        {value}
      </p>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground leading-tight">
        {label}
      </p>
    </div>
  )
}

/* ============ STORES LIST ============ */

function StoresList({
  stores,
  onToggleFavori,
  onProductClick,
}: {
  stores: StoreWithStock[]
  onToggleFavori: (eagid: string) => void
  onProductClick: (p: ProductWithStock) => void
}) {
  const favoris = stores.filter((s) => s.isFavori)
  const others = stores.filter((s) => !s.isFavori)

  return (
    <div className="space-y-6">
      {favoris.length > 0 && (
        <Section eyebrow="Mes magasins" title={favoris.length === 1 ? '1 magasin favori' : `${favoris.length} magasins favoris`}>
          <div className="space-y-2.5">
            {favoris.map((s) => (
              <StoreCard
                key={s.eagid}
                store={s}
                onToggleFavori={onToggleFavori}
                onProductClick={onProductClick}
              />
            ))}
          </div>
        </Section>
      )}

      {others.length > 0 && (
        <Section
          eyebrow="Autres magasins"
          title={favoris.length === 0 ? 'Tous les magasins' : 'Périphérie'}
        >
          <div className="space-y-2.5">
            {others.slice(0, 8).map((s) => (
              <StoreCard
                key={s.eagid}
                store={s}
                onToggleFavori={onToggleFavori}
                onProductClick={onProductClick}
              />
            ))}
          </div>
          {others.length > 8 && (
            <p className="mt-3 text-center text-[11px] text-subtle-foreground">
              + {others.length - 8} autres avec stock
            </p>
          )}
        </Section>
      )}
    </div>
  )
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <div className="px-1 flex items-baseline justify-between gap-3">
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="text-lg font-semibold tracking-tight text-foreground mt-0.5">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  )
}

/* ============ STORE CARD ============ */

function StoreCard({
  store,
  onToggleFavori,
  onProductClick,
}: {
  store: StoreWithStock
  onToggleFavori: (eagid: string) => void
  onProductClick: (p: ProductWithStock) => void
}) {
  const handleMaps = (e: React.MouseEvent) => {
    e.stopPropagation()
    haptic('light')
    const info = getStoreByEagid(store.eagid)
    if (info) openExternal(info.mapsUrl)
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
              {store.short}
            </h3>
            {store.hasHotDrop && (
              <Badge variant="hot">
                <Icon.Flame className="h-2.5 w-2.5" fill="currentColor" strokeWidth={0} />
                Hot
              </Badge>
            )}
            {store.distanceKm != null && (
              <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                {formatDistance(store.distanceKm)}
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            <span className="font-semibold tabular-nums text-foreground">{store.totalProducts}</span>{' '}
            produit{store.totalProducts > 1 ? 's' : ''} en rayon
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleMaps}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-card-hover active:scale-90 transition-all"
            aria-label="Itinéraire"
          >
            <Icon.Navigation className="h-3.5 w-3.5" />
          </button>
          <StarToggle
            active={store.isFavori}
            onToggle={() => onToggleFavori(store.eagid)}
          />
        </div>
      </div>

      {/* Produits */}
      <div className="border-t border-border bg-background/40">
        {store.products
          .sort((a, b) => b.heat - a.heat)
          .slice(0, 4)
          .map((item, i) => (
            <ProductLine
              key={item.product.id + item.stock.eagid}
              product={item.product}
              stock={item.stock}
              heat={item.heat}
              isFirst={i === 0}
              onClick={() => onProductClick(item.product)}
            />
          ))}
        {store.products.length > 4 && (
          <div className="border-t border-border px-4 py-2.5 text-center">
            <span className="text-[11px] font-medium text-muted-foreground">
              + {store.products.length - 4} autre{store.products.length - 4 > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </Card>
  )
}

function ProductLine({
  product,
  stock,
  heat,
  isFirst,
  onClick,
}: {
  product: ProductWithStock
  stock: StockEntry
  heat: number
  isFirst: boolean
  onClick: () => void
}) {
  const TypeIcon =
    product.type_produit === 'ETB'
      ? Icon.Box
      : product.type_produit === 'Bundle'
        ? Icon.Package
        : Icon.LayoutGrid

  const isLimited = stock.stock_label?.includes('limitée') ?? false

  return (
    <button
      onClick={onClick}
      className={cn(
        'group w-full flex items-center justify-between gap-3 px-4 py-3 text-left pressable',
        'hover:bg-card-hover transition-colors',
        !isFirst && 'border-t border-border',
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-xl shrink-0',
            heat >= 4
              ? 'bg-[var(--color-hot-muted)] text-[var(--color-hot)]'
              : 'bg-primary-muted text-primary',
          )}
        >
          <TypeIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {product.type_produit}
            </span>
            <span className="text-subtle-foreground">·</span>
            <span className="text-[11px] text-muted-foreground truncate">
              {cleanSerieName(product.serie)}
            </span>
            {isLimited && (
              <>
                <span className="text-subtle-foreground">·</span>
                <span className="text-[10px] uppercase font-semibold tracking-[0.12em] text-warning">
                  Limité
                </span>
              </>
            )}
          </div>
          <p className="text-[13px] font-semibold text-foreground truncate mt-0.5">
            {cleanProductName(product.nom)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <HeatScore score={heat} size="sm" />
        <span className="text-[13px] font-bold text-foreground tabular-nums">
          {Math.round(product.prix_fnac)}€
        </span>
        <Icon.ChevronRight className="h-3.5 w-3.5 text-subtle-foreground group-hover:text-foreground transition-colors" />
      </div>
    </button>
  )
}

/* ============ HELPERS ============ */

function cleanProductName(name: string): string {
  return name
    .replace(/^(Carte|Cartes) à collectionner Pokémon\s*/i, '')
    .replace(/^Pokémon\s+/i, '')
    .replace(/Coffret Dresseur d'Élite/, "Coffret Élite")
    .replace(/Bundle 6 boosters/, 'Bundle')
    .replace(/Pack 3 boosters/, 'Pack 3')
    .trim()
}

function cleanSerieName(serie: string): string {
  return serie.replace(/^(ME\d+|EV\d+(?:\.\d+)?|Q\d+)\s*/, '').trim() || serie
}

function formatNextRun(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now()
  const min = Math.max(0, Math.round(diff / 60000))
  if (min === 0) return 'imminent'
  if (min < 60) return `dans ${min}min`
  return `dans ${Math.round(min / 60)}h`
}

function SkeletonStack() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-[88px]" />
      <Skeleton className="h-[140px]" />
      <Skeleton className="h-[140px]" />
    </div>
  )
}

