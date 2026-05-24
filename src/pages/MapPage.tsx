import { useMemo, useRef } from 'react'
import { Card, Eyebrow, Badge } from '../components/ui'
import { Icon } from '../components/Icons'
import { ALL_STORES, formatDistance, haversineKm, type StoreInfo } from '../lib/stores'
import type { ProductWithStock } from '../lib/api'
import { cn } from '../lib/cn'
import { haptic, openExternal } from '../lib/telegram'

interface Props {
  stock: ProductWithStock[]
  favoris: Set<string>
  userLat?: number
  userLng?: number
  onRequestGeoloc: () => void
}

interface PinData {
  store: StoreInfo
  stockCount: number
  isFavori: boolean
  hasHot: boolean
  distance?: number
}

const VIEWPORT = {
  minLat: 48.55,
  maxLat: 49.1,
  minLng: 1.95,
  maxLng: 2.85,
}

export function MapPage({ stock, favoris, userLat, userLng, onRequestGeoloc }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  const pins = useMemo<PinData[]>(() => {
    const countByStore = new Map<string, number>()
    const hotByStore = new Map<string, boolean>()

    for (const p of stock) {
      for (const s of p.stocks) {
        const inStock =
          s.stock_label === 'En rayon' || s.stock_label === 'En rayon- Quantité limitée'
        if (!inStock) continue
        countByStore.set(s.eagid, (countByStore.get(s.eagid) ?? 0) + 1)
        if (p.type_produit === 'ETB') hotByStore.set(s.eagid, true)
      }
    }

    return ALL_STORES.map((store) => {
      const distance =
        userLat != null && userLng != null
          ? haversineKm(userLat, userLng, store.lat, store.lng)
          : undefined
      return {
        store,
        stockCount: countByStore.get(store.eagid) ?? 0,
        hasHot: hotByStore.get(store.eagid) ?? false,
        isFavori: favoris.has(store.eagid),
        distance,
      }
    }).sort((a, b) => {
      if (a.stockCount !== b.stockCount) return b.stockCount - a.stockCount
      return 0
    })
  }, [stock, favoris, userLat, userLng])

  const activePins = pins.filter((p) => p.stockCount > 0)
  const totalDispo = activePins.reduce((s, p) => s + p.stockCount, 0)

  const projectXY = (lat: number, lng: number) => {
    const x = ((lng - VIEWPORT.minLng) / (VIEWPORT.maxLng - VIEWPORT.minLng)) * 100
    const y = (1 - (lat - VIEWPORT.minLat) / (VIEWPORT.maxLat - VIEWPORT.minLat)) * 100
    return { x: Math.max(2, Math.min(98, x)), y: Math.max(2, Math.min(98, y)) }
  }

  return (
    <div className="space-y-5">
      <header className="pt-3 pb-1">
        <Eyebrow>Carte temps réel</Eyebrow>
        <h1 className="mt-1 text-[2rem] font-bold tracking-[-0.03em] leading-[1.1] text-foreground">
          Drops en <em className="not-italic text-primary">Île-de-France</em>.
        </h1>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Pins verts = en rayon. Plus c'est gros, plus il y a de produits.
        </p>
      </header>

      {/* Stats compact */}
      <div className="flex items-center gap-2">
        <Badge variant="success">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-75" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-success" />
          </span>
          {activePins.length} mag actifs
        </Badge>
        <Badge variant="primary">
          {totalDispo} produits
        </Badge>
        {userLat == null && (
          <button
            onClick={onRequestGeoloc}
            className="ml-auto text-[11px] font-medium text-primary hover:text-primary-hover transition-colors"
          >
            Activer géoloc →
          </button>
        )}
      </div>

      {/* La "carte" */}
      <Card className="relative overflow-hidden">
        <div
          ref={containerRef}
          className="relative aspect-[4/3] w-full bg-gradient-to-br from-card-elevated to-card"
        >
          {/* Grille décorative */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(139, 92, 246, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.4) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Aurora */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full aurora-primary blur-3xl pointer-events-none" />

          {/* Labels coins */}
          <div className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-subtle-foreground">
            Île-de-France
          </div>
          <div className="absolute bottom-3 right-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-subtle-foreground">
            {pins.length} mags
          </div>

          {/* User position */}
          {userLat != null && userLng != null && (() => {
            const { x, y } = projectXY(userLat, userLng)
            return (
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 z-30"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <div className="relative">
                  <div className="h-4 w-4 rounded-full bg-blue-500 border-2 border-white shadow-lg" />
                  <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-60" />
                </div>
              </div>
            )
          })()}

          {/* Pins */}
          {pins.map((pin) => {
            const { x, y } = projectXY(pin.store.lat, pin.store.lng)
            return (
              <MapPin
                key={pin.store.eagid}
                pin={pin}
                x={x}
                y={y}
              />
            )
          })}
        </div>
      </Card>

      {/* Légende */}
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground px-1">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-success" />
          En rayon
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-hot)]" />
          ETB chaud
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-subtle-foreground/40" />
          Vide
        </div>
      </div>

      {/* Liste pins actifs (clic pour itinéraire) */}
      <section className="space-y-2">
        <Eyebrow className="px-1">Magasins avec stock</Eyebrow>
        {activePins.length === 0 ? (
          <Card className="p-5 text-center">
            <p className="text-[13px] text-muted-foreground">Aucun magasin actif pour l'instant.</p>
          </Card>
        ) : (
          activePins.slice(0, 10).map((pin) => (
            <MapStoreRow key={pin.store.eagid} pin={pin} />
          ))
        )}
      </section>
    </div>
  )
}

function MapPin({ pin, x, y }: { pin: PinData; x: number; y: number }) {
  const hasStock = pin.stockCount > 0
  const size = !hasStock ? 8 : Math.min(28, 10 + pin.stockCount * 3)
  const handleClick = () => {
    haptic('medium')
    openExternal(pin.store.mapsUrl)
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all active:scale-90',
        hasStock ? 'cursor-pointer hover:scale-125 z-20' : 'pointer-events-none z-10 opacity-40',
        pin.hasHot && 'animate-pulse-hot',
      )}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${size}px`,
        height: `${size}px`,
        background: pin.hasHot
          ? 'var(--color-hot)'
          : hasStock
            ? 'var(--color-success)'
            : 'var(--color-subtle-foreground)',
        border: pin.isFavori ? '2px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.3)',
        boxShadow: hasStock
          ? `0 0 ${size}px -2px ${pin.hasHot ? 'rgba(255,91,91,0.6)' : 'rgba(16,217,122,0.6)'}`
          : 'none',
      }}
      aria-label={`${pin.store.short} - ${pin.stockCount} produits`}
    >
      {hasStock && pin.stockCount > 0 && (
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white tabular-nums">
          {pin.stockCount}
        </span>
      )}
    </button>
  )
}

function MapStoreRow({ pin }: { pin: PinData }) {
  const handleClick = () => {
    haptic('light')
    openExternal(pin.store.mapsUrl)
  }

  return (
    <Card interactive onClick={handleClick} className="p-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span
            className={cn(
              'h-3 w-3 rounded-full shrink-0',
              pin.hasHot ? 'bg-[var(--color-hot)]' : 'bg-success',
            )}
            style={{
              boxShadow: pin.hasHot
                ? '0 0 12px -2px rgba(255,91,91,0.6)'
                : '0 0 12px -2px rgba(16,217,122,0.6)',
            }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[14px] font-semibold text-foreground truncate">
                {pin.store.short}
              </p>
              {pin.isFavori && (
                <Icon.Star className="h-3 w-3 text-primary shrink-0" fill="currentColor" strokeWidth={0} />
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              <span className="font-bold tabular-nums text-foreground">{pin.stockCount}</span>{' '}
              produit{pin.stockCount > 1 ? 's' : ''}
              {pin.distance != null && ` · ${formatDistance(pin.distance)}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {pin.hasHot && <Badge variant="hot">ETB</Badge>}
          <Icon.Navigation className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </Card>
  )
}
