import { Card, DisplayHeading, Eyebrow, SectionHeading, Stat, Skeleton, EmptyState, Badge } from '../components/ui'
import { Icon } from '../components/Icons'
import { haptic, openExternal } from '../lib/telegram'
import type { BotStatus, ProductWithStock } from '../lib/api'
import { cn } from '../lib/cn'

interface Props {
  status: BotStatus | null
  stock: ProductWithStock[]
  loading: boolean
}

export function HomePage({ status, stock, loading }: Props) {
  const dropsFavoris = stock.filter((p) => p.in_stock_favoris > 0)
  const dropsOthers = stock.filter((p) => p.in_stock_count > 0 && p.in_stock_favoris === 0)
  const totalDispo = stock.reduce((sum, p) => sum + p.in_stock_count, 0)

  return (
    <div className="space-y-8">
      <Hero status={status} loading={loading} />
      <KpiRow status={status} totalDispo={totalDispo} loading={loading} />

      <section className="space-y-3">
        <SectionHeader
          eyebrow="Drops en cours"
          title="Magasins prioritaires"
          hint={`${dropsFavoris.length} produit${dropsFavoris.length > 1 ? 's' : ''}`}
        />

        {loading ? (
          <SkeletonList count={2} />
        ) : dropsFavoris.length === 0 ? (
          <EmptyState
            title="Pas de drop actif"
            description="Aucun produit en rayon dans tes magasins prioritaires. Le bot continue de surveiller."
            icon={Icon.Sparkles}
          />
        ) : (
          <ProductList products={dropsFavoris} priority />
        )}
      </section>

      {dropsOthers.length > 0 && !loading && (
        <section className="space-y-3">
          <SectionHeader
            eyebrow="Autres magasins"
            title="Disponibilités secondaires"
            hint={`${dropsOthers.length} produit${dropsOthers.length > 1 ? 's' : ''}`}
          />
          <ProductList products={dropsOthers} />
        </section>
      )}
    </div>
  )
}

function Hero({ status, loading }: { status: BotStatus | null; loading: boolean }) {
  return (
    <header className="relative pt-2 pb-6">
      <div className="pointer-events-none absolute -top-12 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full aurora-primary blur-3xl" />
      <div className="relative">
        <Eyebrow>Stock FNAC · Paris</Eyebrow>
        <DisplayHeading className="mt-2">
          Sois là <span className="text-primary italic">avant</span> les autres.
        </DisplayHeading>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-[28ch]">
          Surveillance temps réel des coffrets Pokémon TCG dans 9 magasins FNAC. Alerte dès qu'un produit passe en rayon.
        </p>

        <div className="mt-5 flex items-center gap-2">
          {loading ? (
            <Skeleton className="h-7 w-32" />
          ) : (
            <StatusPill status={status} />
          )}
        </div>
      </div>
    </header>
  )
}

function StatusPill({ status }: { status: BotStatus | null }) {
  if (!status) return null
  const isPaused = status.paused
  const isActiveHour = status.in_active_hours
  const isLive = status.active && isActiveHour && !isPaused

  if (isLive) {
    return (
      <Badge variant="success">
        <span className="relative flex h-2 w-2">
          <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-75" />
          <span className="relative h-2 w-2 rounded-full bg-success" />
        </span>
        Surveillance active
      </Badge>
    )
  }

  if (isPaused) {
    return (
      <Badge variant="warning">
        <Icon.Pause className="h-3 w-3" />
        En pause
      </Badge>
    )
  }

  if (!isActiveHour) {
    return (
      <Badge variant="default">
        <Icon.Clock className="h-3 w-3" />
        Hors plage (7h–22h)
      </Badge>
    )
  }

  return (
    <Badge variant="destructive">
      <Icon.WifiOff className="h-3 w-3" />
      Inactif
    </Badge>
  )
}

function KpiRow({
  status,
  totalDispo,
  loading,
}: {
  status: BotStatus | null
  totalDispo: number
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[72px]" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      <Stat value={status?.products_count ?? 0} label="Produits suivis" />
      <Stat value={totalDispo} label="En rayon" accent />
      <Stat value={formatTimeAgo(status?.last_run)} label="Dernier check" />
    </div>
  )
}

function SectionHeader({
  eyebrow,
  title,
  hint,
}: {
  eyebrow: string
  title: string
  hint?: string
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <SectionHeading className="mt-1">{title}</SectionHeading>
      </div>
      {hint && (
        <span className="text-xs font-medium text-muted-foreground tabular-nums">{hint}</span>
      )}
    </div>
  )
}

function SkeletonList({ count }: { count: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-[140px]" />
      ))}
    </div>
  )
}

function ProductList({
  products,
  priority,
}: {
  products: ProductWithStock[]
  priority?: boolean
}) {
  return (
    <div className="space-y-2">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} priority={priority} />
      ))}
    </div>
  )
}

function ProductCard({
  product,
  priority,
}: {
  product: ProductWithStock
  priority?: boolean
}) {
  const TypeIcon =
    product.type_produit === 'ETB' ? Icon.Box
      : product.type_produit === 'Bundle' ? Icon.Package
        : Icon.LayoutGrid

  const favoris = product.stocks.filter((s) => s.magasin_favori)
  const others = product.stocks.filter((s) => !s.magasin_favori)
  const visible = [...favoris, ...others].slice(0, 3)
  const remaining = product.stocks.length - visible.length

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-lg',
                  priority
                    ? 'bg-primary-muted text-primary'
                    : 'bg-card-hover text-muted-foreground border border-border',
                )}
              >
                <TypeIcon className="h-3.5 w-3.5" />
              </div>
              <Eyebrow>{product.type_produit}</Eyebrow>
              {priority && (
                <>
                  <span className="text-subtle-foreground">·</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                    <Icon.Flame className="h-2.5 w-2.5" />
                    Prioritaire
                  </span>
                </>
              )}
            </div>
            <h3 className="mt-2 text-base font-semibold leading-snug tracking-tight text-foreground">
              {cleanProductName(product.nom)}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{product.serie}</p>
          </div>

          <div className="text-right shrink-0">
            <p
              className="font-display text-xl leading-none tracking-tight tabular-nums text-foreground"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {product.prix_fnac.toFixed(2)} €
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-subtle-foreground">
              prix retail
            </p>
          </div>
        </div>
      </div>

      {visible.length > 0 && (
        <div className="border-t border-border bg-surface/40">
          {visible.map((stock, i) => (
            <StoreLine
              key={stock.eagid}
              storeName={stock.magasin_nom}
              isFavori={stock.magasin_favori}
              isLimited={stock.stock_label?.includes('limitée') ?? false}
              storeUrl={stock.store_url}
              coord={stock.store_coord}
              isFirst={i === 0}
            />
          ))}
          {remaining > 0 && (
            <div className="border-t border-border px-4 py-2.5 text-center">
              <span className="text-[11px] font-medium text-muted-foreground">
                + {remaining} autre{remaining > 1 ? 's' : ''} magasin{remaining > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function StoreLine({
  storeName,
  isFavori,
  isLimited,
  storeUrl,
  coord,
  isFirst,
}: {
  storeName: string
  isFavori: boolean
  isLimited: boolean
  storeUrl?: string
  coord?: string | null
  isFirst: boolean
}) {
  const handleClick = () => {
    haptic('light')
    const cleanCoord = coord?.replace(/[()]/g, '')
    const url = cleanCoord
      ? `https://www.google.com/maps/search/?api=1&query=${cleanCoord}`
      : storeUrl ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeName)}`
    openExternal(url)
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'group w-full flex items-center justify-between gap-3 px-4 py-3 text-left',
        'hover:bg-card-hover transition-colors',
        !isFirst && 'border-t border-border',
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-lg shrink-0',
            isFavori
              ? 'bg-primary-muted text-primary'
              : 'bg-card text-muted-foreground border border-border',
          )}
        >
          {isFavori ? <Icon.Flame className="h-3.5 w-3.5" /> : <Icon.MapPin className="h-3.5 w-3.5" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{cleanStoreName(storeName)}</p>
          {isLimited && (
            <p className="text-[10px] uppercase tracking-[0.12em] text-warning mt-0.5">
              Quantité limitée
            </p>
          )}
        </div>
      </div>
      <Icon.ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
    </button>
  )
}

/* ============ Helpers ============ */

function formatTimeAgo(iso?: string | null): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'maintenant'
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} h`
  return `${Math.floor(h / 24)} j`
}

function cleanProductName(name: string): string {
  return name.replace(/^(Carte|Cartes) à collectionner Pokémon\s*/i, '').trim()
}

function cleanStoreName(name: string): string {
  return name.replace(/^FNAC\s+/, '')
}
