import { Sheet } from './Sheet'
import { Eyebrow, Badge, Button } from './ui'
import { Icon } from './Icons'
import { cn } from '../lib/cn'
import { haptic, openExternal } from '../lib/telegram'
import { formatRelativeLong, useLiveTime } from '../lib/useLiveTime'
import type { ProductWithStock, StockEntry } from '../lib/api'

interface Props {
  product: ProductWithStock | null
  onClose: () => void
}

export function ProductDetailSheet({ product, onClose }: Props) {
  useLiveTime(30_000)

  return (
    <Sheet open={!!product} onClose={onClose}>
      {product && <ProductDetailContent product={product} />}
    </Sheet>
  )
}

function ProductDetailContent({ product }: { product: ProductWithStock }) {
  const inStockStocks = product.stocks
  const favoris = inStockStocks.filter((s) => s.magasin_favori)
  const others = inStockStocks.filter((s) => !s.magasin_favori)

  const handleOpenFnac = () => {
    haptic('medium')
    openExternal(`https://www.fnac.com/a${product.prid}/w-4`)
  }

  const TypeIcon =
    product.type_produit === 'ETB' ? Icon.Box
      : product.type_produit === 'Bundle' ? Icon.Package
        : Icon.LayoutGrid

  return (
    <div className="px-5 pt-8 pb-8 space-y-6">
      {/* Hero image + meta */}
      <ProductHero product={product} />

      {/* Type + Série */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-muted text-primary">
            <TypeIcon className="h-3.5 w-3.5" />
          </div>
          <Eyebrow>{product.type_produit}</Eyebrow>
          <span className="text-subtle-foreground">·</span>
          <span className="text-[11px] font-medium text-muted-foreground">
            {cleanSerie(product.serie)}
          </span>
        </div>

        <h1
          className="font-display text-[1.875rem] leading-[1.1] tracking-tight text-foreground"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {cleanProductName(product.nom)}
        </h1>

        <ProductMetaRow product={product} />
      </div>

      {/* Stock breakdown */}
      <StockBreakdown
        title="Magasins prioritaires"
        eyebrow="Tes magasins"
        stocks={favoris}
      />

      <StockBreakdown
        title="Autres magasins"
        eyebrow="Périphérie"
        stocks={others}
        hidden={favoris.length === 0 && others.length === 0}
      />

      {/* Empty state si rien partout */}
      {inStockStocks.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-card-hover text-muted-foreground">
            <Icon.Clock className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-foreground">Pas en rayon actuellement</p>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Le bot te préviendra dès qu'un magasin met ce produit en rayon.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2 pt-2">
        <Button onClick={handleOpenFnac} variant="primary" size="lg" className="w-full">
          Voir sur FNAC
          <Icon.ArrowUpRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Info technique */}
      <ProductTechInfo product={product} />
    </div>
  )
}

function ProductHero({ product }: { product: ProductWithStock }) {
  // Image officielle FNAC : utilise leur CDN d'images standardisé via prid
  // Format: https://static.fnac-static.com/multimedia/Images/FR/NR/{prefix}/{prid}/standard.jpg
  // Fallback: image placeholder gradient si l'image n'existe pas

  const imgUrl = getFnacImageUrl(product.prid)
  const TypeIcon =
    product.type_produit === 'ETB' ? Icon.Box
      : product.type_produit === 'Bundle' ? Icon.Package
        : Icon.LayoutGrid

  return (
    <div className="relative aspect-[16/10] rounded-3xl border border-border bg-card overflow-hidden">
      {/* Aurora background */}
      <div className="absolute inset-0 aurora-primary opacity-60" />

      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
        backgroundSize: '24px 24px',
      }} />

      {/* Image ou icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={imgUrl}
          alt={product.nom}
          className="max-h-[80%] max-w-[80%] object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
          onError={(e) => {
            // Fallback gracieux : cache l'image
            ;(e.target as HTMLImageElement).style.display = 'none'
            ;(e.target as HTMLImageElement).parentElement?.classList.add('show-fallback')
          }}
        />
      </div>

      {/* Fallback icon (shown si image fail) */}
      <div className="show-fallback-target absolute inset-0 flex items-center justify-center text-primary opacity-40" style={{ display: 'none' }}>
        <TypeIcon className="h-20 w-20" strokeWidth={1} />
      </div>

      {/* Stock badge en haut */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5">
        {product.in_stock_count > 0 ? (
          <Badge variant="success">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-75" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            {product.in_stock_count} magasin{product.in_stock_count > 1 ? 's' : ''}
          </Badge>
        ) : (
          <Badge variant="default">
            <Icon.Clock className="h-2.5 w-2.5" />
            En attente
          </Badge>
        )}
        {product.in_stock_favoris > 0 && (
          <Badge variant="primary">
            <Icon.Flame className="h-2.5 w-2.5" />
            Prioritaire
          </Badge>
        )}
      </div>

      {/* Prix en bas */}
      <div className="absolute bottom-3 right-3">
        <div className="rounded-2xl border border-border bg-background/80 backdrop-blur-xl px-3.5 py-2 text-right">
          <p
            className="font-display text-2xl leading-none tabular-nums text-foreground"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {product.prix_fnac.toFixed(2)} €
          </p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            prix retail
          </p>
        </div>
      </div>
    </div>
  )
}

function ProductMetaRow({ product }: { product: ProductWithStock }) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
      <span className="inline-flex items-center gap-1">
        <Icon.Box className="h-2.5 w-2.5" />
        Réf. {product.prid}
      </span>
      <span className="text-subtle-foreground">·</span>
      <span className="inline-flex items-center gap-1">
        <Icon.Activity className="h-2.5 w-2.5" />
        {product.actif ? 'Surveillé' : 'Désactivé'}
      </span>
    </div>
  )
}

function StockBreakdown({
  title,
  eyebrow,
  stocks,
  hidden,
}: {
  title: string
  eyebrow: string
  stocks: StockEntry[]
  hidden?: boolean
}) {
  if (hidden) return null
  if (stocks.length === 0) return null

  return (
    <section className="space-y-3">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h3 className="mt-1 text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {stocks.map((s, i) => (
          <StoreDetailRow key={s.eagid} stock={s} isFirst={i === 0} />
        ))}
      </div>
    </section>
  )
}

function StoreDetailRow({ stock, isFirst }: { stock: StockEntry; isFirst: boolean }) {
  const isLimited = stock.stock_label?.includes('limitée') ?? false

  const handleClick = () => {
    haptic('light')
    const cleanCoord = stock.store_coord?.replace(/[()]/g, '')
    const url = cleanCoord
      ? `https://www.google.com/maps/search/?api=1&query=${cleanCoord}`
      : stock.store_url ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stock.magasin_nom)}`
    openExternal(url)
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'group w-full flex items-center justify-between gap-3 px-4 py-3 text-left',
        'hover:bg-card-hover active:bg-card-hover transition-colors',
        !isFirst && 'border-t border-border',
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-xl shrink-0',
            stock.magasin_favori
              ? 'bg-primary-muted text-primary'
              : 'bg-card-hover text-muted-foreground border border-border',
          )}
        >
          {stock.magasin_favori
            ? <Icon.Flame className="h-4 w-4" />
            : <Icon.MapPin className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-foreground truncate">
            {cleanStoreName(stock.magasin_nom)}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className={cn(
                'h-1.5 w-1.5 rounded-full',
                isLimited ? 'bg-warning' : 'bg-success',
              )} />
              {isLimited ? 'Quantité limitée' : 'En rayon'}
            </span>
            <span className="text-subtle-foreground">·</span>
            <span>{formatRelativeLong(stock.last_check)}</span>
          </div>
        </div>
      </div>
      <Icon.ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
    </button>
  )
}

function ProductTechInfo({ product }: { product: ProductWithStock }) {
  const lastUpdate = product.stocks[0]?.last_check
  return (
    <div className="rounded-2xl border border-border bg-card/50 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Icon.Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
        <Eyebrow>Détails techniques</Eyebrow>
      </div>
      <dl className="space-y-1.5 text-[11px]">
        <InfoRow label="Référence FNAC" value={`a${product.prid}`} mono />
        <InfoRow label="Série complète" value={product.serie} />
        <InfoRow label="Format" value={typeLabel(product.type_produit)} />
        <InfoRow label="Statut monitoring" value={product.actif ? 'Actif' : 'Désactivé'} />
        {lastUpdate && (
          <InfoRow label="Dernière vérification" value={formatRelativeLong(lastUpdate)} />
        )}
      </dl>
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn(
        'text-foreground font-medium text-right',
        mono && 'font-mono text-[10px]',
      )}>
        {value}
      </dd>
    </div>
  )
}

function typeLabel(type: string): string {
  if (type === 'ETB') return "Coffret Dresseur d'Élite (9 boosters)"
  if (type === 'Bundle') return 'Bundle 6 boosters'
  if (type === 'Tripack') return 'Pack 3 boosters'
  return type
}

function getFnacImageUrl(prid: string): string {
  // Format CDN FNAC : décomposer prid en sous-dossiers
  // ex: prid=22390738 → /multimedia/Images/FR/NR/22/39/07/22390738/standard.jpg
  if (!prid || prid.length < 8) return ''
  const path = prid.match(/.{1,2}/g)?.slice(0, 3).join('/') ?? ''
  return `https://static.fnac-static.com/multimedia/Images/FR/NR/${path}/${prid}/standard.jpg`
}

function cleanProductName(name: string): string {
  return name
    .replace(/^(Carte|Cartes) à collectionner Pokémon\s*/i, '')
    .replace(/^Pokémon\s+/i, '')
    .trim()
}

function cleanSerie(serie: string): string {
  return serie || '—'
}

function cleanStoreName(name: string): string {
  return name
    .replace(/^FNAC\s+/, '')
    .replace(/^Paris\s+-?\s*/, '')
    .replace(/\s*\(rue de Rennes\)$/, '')
    .replace(/-CNIT$/, ' · CNIT')
}
