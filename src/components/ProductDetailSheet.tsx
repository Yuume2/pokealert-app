import { useState } from 'react'
import { Sheet } from './Sheet'
import { Eyebrow, Badge, Button, Card, HeatScore } from './ui'
import { Icon } from './Icons'
import { cn } from '../lib/cn'
import { haptic, openExternal } from '../lib/telegram'
import { formatRelativeLong, useLiveTime } from '../lib/useLiveTime'
import type { ProductWithStock, StockEntry } from '../lib/api'
import { addPurchase, getPortfolio } from '../lib/preferences'
import { heatScore } from '../lib/search'
import { getStoreByEagid, formatDistance, haversineKm } from '../lib/stores'
import { AutoScanControls } from './AutoScanControls'

interface Props {
  product: ProductWithStock | null
  favoris: Set<string>
  userLat?: number
  userLng?: number
  autoScanCount: number
  onClose: () => void
  onPurchased?: () => void
  onAutoScanChange?: () => void
}

export function ProductDetailSheet({
  product,
  favoris,
  userLat,
  userLng,
  autoScanCount,
  onClose,
  onPurchased,
  onAutoScanChange,
}: Props) {
  useLiveTime(30_000)
  return (
    <Sheet open={!!product} onClose={onClose}>
      {product && (
        <Content
          product={product}
          favoris={favoris}
          userLat={userLat}
          userLng={userLng}
          autoScanCount={autoScanCount}
          onPurchased={() => {
            onPurchased?.()
          }}
          onAutoScanChange={() => onAutoScanChange?.()}
        />
      )}
    </Sheet>
  )
}

function Content({
  product,
  favoris,
  userLat,
  userLng,
  autoScanCount,
  onPurchased,
  onAutoScanChange,
}: {
  product: ProductWithStock
  favoris: Set<string>
  userLat?: number
  userLng?: number
  autoScanCount: number
  onPurchased: () => void
  onAutoScanChange: () => void
}) {
  const inStock = product.stocks.filter(
    (s) =>
      s.stock_label === 'En rayon' || s.stock_label === 'En rayon- Quantité limitée',
  )

  const sortedStocks = inStock
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

  const heat = heatScore(product, favoris)
  const portfolioCount = getPortfolio().filter((p) => p.prid === product.prid).length

  const TypeIcon =
    product.type_produit === 'ETB'
      ? Icon.Box
      : product.type_produit === 'Bundle'
        ? Icon.Package
        : Icon.LayoutGrid

  return (
    <div className="px-5 pt-8 pb-8 space-y-5">
      <HeroBlock product={product} heat={heat} />

      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="primary">
          <TypeIcon className="h-2.5 w-2.5" />
          {product.type_produit}
        </Badge>
        <Badge>{cleanSerie(product.serie)}</Badge>
        {portfolioCount > 0 && (
          <Badge variant="success">
            <Icon.Wallet className="h-2.5 w-2.5" />
            {portfolioCount} dans portfolio
          </Badge>
        )}
      </div>

      <h1 className="text-[1.5rem] leading-[1.15] font-bold text-foreground tracking-[-0.02em]">
        {cleanName(product.nom)}
      </h1>

      <PurchaseBlock
        product={product}
        inStock={inStock}
        onPurchased={onPurchased}
        firstStock={sortedStocks[0]}
      />

      <AutoScanControls
        product={product}
        autoScanCount={autoScanCount}
        onAutoScanChange={onAutoScanChange}
      />

      <MarginBlock product={product} />

      {sortedStocks.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <Eyebrow>Disponible dans</Eyebrow>
              <p className="text-[13px] font-semibold text-foreground mt-0.5">
                {sortedStocks.length} magasin{sortedStocks.length > 1 ? 's' : ''}
              </p>
            </div>
            {sortedStocks.length > 1 && (
              <button
                onClick={() => {
                  haptic('medium')
                  const url = buildMultiTripUrl(sortedStocks.slice(0, 4).map((s) => s.info!).filter(Boolean) as Array<{ lat: number; lng: number }>)
                  openExternal(url)
                }}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:text-primary-hover transition-colors"
              >
                <Icon.Route className="h-3.5 w-3.5" />
                Trajet RER
              </button>
            )}
          </div>

          <Card className="overflow-hidden">
            {sortedStocks.map((s, i) => (
              <StoreEntry
                key={s.stock.eagid}
                stock={s.stock}
                shortName={s.info?.short ?? s.stock.magasin_nom}
                distance={s.distance}
                isFavori={s.isFavori}
                mapsUrl={s.info?.mapsUrl ?? ''}
                isFirst={i === 0}
              />
            ))}
          </Card>
        </section>
      ) : (
        <Card className="p-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-card-hover text-muted-foreground">
            <Icon.Clock className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-foreground">Pas en rayon</p>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
            Le bot te préviendra dès qu'un magasin met ce produit en rayon.
          </p>
        </Card>
      )}

      <Button
        variant="secondary"
        className="w-full"
        size="md"
        onClick={() => {
          haptic('light')
          openExternal(`https://www.fnac.com/a${product.prid}/w-4`)
        }}
      >
        Voir la fiche FNAC
        <Icon.ArrowUpRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

function HeroBlock({ product, heat }: { product: ProductWithStock; heat: number }) {
  const imgUrl = product.image_url || ''

  return (
    <div className="relative aspect-[4/3] rounded-2xl border border-border bg-white overflow-hidden">

      {imgUrl ? (
        <img
          src={imgUrl}
          alt={product.nom}
          className="absolute inset-0 w-full h-full object-contain p-4"
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <Icon.Package className="h-12 w-12 opacity-20" />
        </div>
      )}

      <div className="absolute top-3 left-3">
        {heat > 0 && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/70 backdrop-blur-md border border-border">
            <HeatScore score={heat} size="sm" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground">
              Chaleur {heat}/5
            </span>
          </div>
        )}
      </div>

      <div className="absolute bottom-3 right-3">
        <div className="rounded-xl border border-border bg-background/80 backdrop-blur-xl px-3 py-1.5 text-right">
          <p className="text-xl leading-none tabular-nums text-foreground font-bold">
            {product.prix_fnac.toFixed(2)}€
          </p>
          <p className="mt-0.5 text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
            retail
          </p>
        </div>
      </div>
    </div>
  )
}

function PurchaseBlock({
  product,
  inStock,
  onPurchased,
  firstStock,
}: {
  product: ProductWithStock
  inStock: StockEntry[]
  onPurchased: () => void
  firstStock?: { stock: StockEntry; info?: { short: string } }
}) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  const handleClick = () => {
    haptic('medium')
    setShowConfirm(true)
  }

  const handleConfirm = (magasin: string) => {
    haptic('medium')
    addPurchase({
      prid: product.prid,
      produit_nom: cleanName(product.nom),
      type_produit: product.type_produit,
      prix_achat: product.prix_fnac,
      magasin,
      date: new Date().toISOString(),
    })
    setSavedAt(Date.now())
    setShowConfirm(false)
    onPurchased()
    setTimeout(() => setSavedAt(null), 3000)
  }

  if (savedAt) {
    return (
      <Card className="p-4 border-success/30 bg-success-muted flex items-center gap-3">
        <Icon.Check className="h-5 w-5 text-success shrink-0" />
        <div>
          <p className="text-[13px] font-semibold text-foreground">Ajouté au portfolio</p>
          <p className="text-[11px] text-muted-foreground">
            Tu peux noter le prix de revente plus tard depuis Portfolio
          </p>
        </div>
      </Card>
    )
  }

  if (showConfirm && inStock.length > 0) {
    return (
      <Card className="p-4 space-y-3 border-primary-border bg-primary-muted/50">
        <div className="flex items-center justify-between">
          <Eyebrow>Tu l'as pris où ?</Eyebrow>
          <button
            onClick={() => setShowConfirm(false)}
            className="text-[11px] text-muted-foreground hover:text-foreground"
          >
            Annuler
          </button>
        </div>
        <div className="space-y-2">
          {inStock.slice(0, 5).map((s) => {
            const info = getStoreByEagid(s.eagid)
            return (
              <button
                key={s.eagid}
                onClick={() => handleConfirm(info?.short ?? s.magasin_nom)}
                className="w-full flex items-center justify-between gap-2 p-2.5 rounded-xl bg-card hover:bg-card-hover border border-border text-left transition-all active:scale-[0.98]"
              >
                <span className="text-[13px] font-medium text-foreground">
                  {info?.short ?? s.magasin_nom}
                </span>
                <Icon.ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )
          })}
        </div>
      </Card>
    )
  }

  return (
    <Button
      variant="primary"
      size="lg"
      className="w-full"
      onClick={handleClick}
      disabled={inStock.length === 0}
    >
      <Icon.ShoppingBag className="h-4 w-4" />
      {inStock.length > 0
        ? `J'ai pris à ${firstStock?.info?.short ?? 'un magasin'}`
        : 'Pas en rayon actuellement'}
    </Button>
  )
}

function MarginBlock({ product }: { product: ProductWithStock }) {
  const estimations = estimateMargin(product)
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <Eyebrow>Marge revente estimée</Eyebrow>
        <Badge variant="warning">Beta</Badge>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <MarginCell label="Vinted" price={estimations.vinted} margin={estimations.vinted - product.prix_fnac} />
        <MarginCell label="Marketplace" price={estimations.marketplace} margin={estimations.marketplace - product.prix_fnac} />
        <MarginCell label="eBay" price={estimations.ebay} margin={estimations.ebay - product.prix_fnac} />
      </div>
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
        <div>
          <Eyebrow>Moyenne marge</Eyebrow>
          <p className="text-[1.25rem] font-bold tabular-nums text-success mt-0.5">
            +{Math.round(estimations.avgMargin)}€
          </p>
        </div>
        <Badge variant="success">
          {((estimations.avgMargin / product.prix_fnac) * 100).toFixed(0)}% ROI
        </Badge>
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">
        Estimations indicatives basées sur ratios marché. Connexion live Vinted/eBay à venir.
      </p>
    </Card>
  )
}

function MarginCell({ label, price, margin }: { label: string; price: number; margin: number }) {
  return (
    <div>
      <Eyebrow>{label}</Eyebrow>
      <p className="text-base font-bold tabular-nums text-foreground mt-0.5">
        {Math.round(price)}€
      </p>
      <p
        className={cn(
          'text-[10px] font-semibold tabular-nums mt-0.5',
          margin > 0 ? 'text-success' : 'text-destructive',
        )}
      >
        {margin >= 0 ? '+' : ''}
        {Math.round(margin)}€
      </p>
    </div>
  )
}

function StoreEntry({
  stock,
  shortName,
  distance,
  isFavori,
  mapsUrl,
  isFirst,
}: {
  stock: StockEntry
  shortName: string
  distance?: number
  isFavori: boolean
  mapsUrl: string
  isFirst: boolean
}) {
  const isLimited = stock.stock_label?.includes('limitée') ?? false

  const handleClick = () => {
    haptic('light')
    if (mapsUrl) openExternal(mapsUrl)
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'group w-full flex items-center justify-between gap-3 px-4 py-3 text-left pressable',
        'hover:bg-card-hover',
        !isFirst && 'border-t border-border',
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-xl shrink-0',
            isFavori
              ? 'bg-primary-muted text-primary'
              : 'bg-card text-muted-foreground border border-border',
          )}
        >
          {isFavori ? (
            <Icon.Star className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
          ) : (
            <Icon.MapPin className="h-3.5 w-3.5" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-foreground truncate">{shortName}</p>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  isLimited ? 'bg-warning' : 'bg-success',
                )}
              />
              {isLimited ? 'Limité' : 'En rayon'}
            </span>
            {distance != null && (
              <>
                <span className="text-subtle-foreground">·</span>
                <span className="tabular-nums">{formatDistance(distance)}</span>
              </>
            )}
            <span className="text-subtle-foreground">·</span>
            <span>{formatRelativeLong(stock.last_check)}</span>
          </div>
        </div>
      </div>
      <Icon.Navigation className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
    </button>
  )
}

function estimateMargin(product: ProductWithStock) {
  const base = product.prix_fnac
  let vintedMult = 1.4
  let marketMult = 1.5
  let ebayMult = 1.55

  if (product.type_produit === 'ETB') {
    if (product.serie.includes('Chaos')) {
      vintedMult = 1.45
      marketMult = 1.7
      ebayMult = 1.6
    } else if (product.serie.includes('Heros') || product.serie.includes('Transcendants')) {
      vintedMult = 1.35
      marketMult = 1.55
      ebayMult = 1.5
    } else {
      vintedMult = 1.5
      marketMult = 1.8
      ebayMult = 1.7
    }
  } else if (product.type_produit === 'Bundle') {
    vintedMult = 1.25
    marketMult = 1.35
    ebayMult = 1.4
  } else {
    vintedMult = 1.2
    marketMult = 1.3
    ebayMult = 1.3
  }

  const vinted = base * vintedMult
  const marketplace = base * marketMult
  const ebay = base * ebayMult
  const avg = (vinted + marketplace + ebay) / 3
  const avgMargin = avg - base

  return { vinted, marketplace, ebay, avg, avgMargin }
}

function buildMultiTripUrl(stores: Array<{ lat: number; lng: number }>): string {
  if (stores.length === 0) return 'https://www.google.com/maps'
  if (stores.length === 1)
    return `https://www.google.com/maps/dir/?api=1&destination=${stores[0].lat},${stores[0].lng}&travelmode=transit`
  const origin = `${stores[0].lat},${stores[0].lng}`
  const dest = `${stores[stores.length - 1].lat},${stores[stores.length - 1].lng}`
  const waypoints = stores
    .slice(1, -1)
    .map((s) => `${s.lat},${s.lng}`)
    .join('|')
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=transit`
}

function cleanName(name: string): string {
  return name
    .replace(/^(Carte|Cartes) à collectionner Pokémon\s*/i, '')
    .replace(/^Pokémon\s+/i, '')
    .trim()
}

function cleanSerie(serie: string): string {
  return serie.replace(/^(ME\d+|EV\d+(?:\.\d+)?|Q\d+)\s*/, '').trim() || serie
}
