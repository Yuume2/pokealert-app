import { Card, DisplayHeading, Eyebrow, SectionHeading, Skeleton, EmptyState, Badge } from '../components/ui'
import { Icon } from '../components/Icons'
import { NumberDisplay } from '../components/NumberDisplay'
import { haptic, openExternal } from '../lib/telegram'
import type { BotStatus, ProductWithStock, StockEntry } from '../lib/api'
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
  const totalProducts = stock.length

  return (
    <div className="space-y-10">
      <Hero status={status} loading={loading} />
      <Pulse status={status} totalDispo={totalDispo} totalProducts={totalProducts} loading={loading} />

      <section className="space-y-4">
        <SectionHeader
          eyebrow="Drops en cours"
          title="Magasins prioritaires"
          hint={dropsFavoris.length > 0 ? `${dropsFavoris.length}` : undefined}
        />

        {loading ? (
          <SkeletonList count={2} />
        ) : dropsFavoris.length === 0 ? (
          <EmptyState
            title="Aucun drop actif"
            description="Aucun produit en rayon dans tes magasins prioritaires. Le bot continue de surveiller en arrière-plan."
            icon={Icon.Sparkles}
          />
        ) : (
          <ProductList products={dropsFavoris} priority />
        )}
      </section>

      {dropsOthers.length > 0 && !loading && (
        <section className="space-y-4">
          <SectionHeader
            eyebrow="Périphérie"
            title="Autres magasins"
            hint={`${dropsOthers.length}`}
          />
          <ProductList products={dropsOthers} />
        </section>
      )}

      {!loading && stock.length > 0 && <FooterCredit />}
    </div>
  )
}

/* ============================================================
   HERO — signature éditoriale
   ============================================================ */

function Hero({ status, loading }: { status: BotStatus | null; loading: boolean }) {
  return (
    <header className="relative pt-6 pb-2">
      {/* Aurora */}
      <div className="pointer-events-none absolute -top-20 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full aurora-primary blur-[120px]" />
      <div className="pointer-events-none absolute -top-10 right-0 h-48 w-48 rounded-full aurora-warm blur-3xl" />

      <div className="relative">
        <div className="flex items-center gap-2.5">
          <LogoMark />
          <Eyebrow>PokeAlert · Paris</Eyebrow>
          {!loading && <StatusPill status={status} />}
        </div>

        <DisplayHeading className="mt-6 text-[2.625rem] sm:text-[3rem]">
          Sois là <em className="not-italic text-primary" style={{ fontStyle: 'italic' }}>avant</em> les autres.
        </DisplayHeading>

        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground max-w-[34ch]">
          Surveillance temps réel des coffrets Pokémon TCG dans neuf magasins FNAC. Alerte instantanée dès qu'un produit passe en rayon.
        </p>
      </div>
    </header>
  )
}

function LogoMark() {
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
      <Icon.Flame className="h-3.5 w-3.5" />
    </div>
  )
}

function StatusPill({ status }: { status: BotStatus | null }) {
  if (!status) return null
  const isPaused = status.paused
  const isActiveHour = status.in_active_hours
  const isLive = status.active && isActiveHour && !isPaused

  if (isLive) {
    return (
      <Badge variant="success" className="ml-auto">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-75" />
          <span className="relative h-1.5 w-1.5 rounded-full bg-success" />
        </span>
        Live
      </Badge>
    )
  }

  if (isPaused) {
    return (
      <Badge variant="warning" className="ml-auto">
        <Icon.Pause className="h-2.5 w-2.5" />
        Pause
      </Badge>
    )
  }

  if (!isActiveHour) {
    return (
      <Badge variant="default" className="ml-auto">
        <Icon.Clock className="h-2.5 w-2.5" />
        Veille
      </Badge>
    )
  }

  return (
    <Badge variant="destructive" className="ml-auto">
      <Icon.WifiOff className="h-2.5 w-2.5" />
      Off
    </Badge>
  )
}

/* ============================================================
   PULSE — Pulse box éditorial avec gros chiffres animés
   ============================================================ */

function Pulse({
  status,
  totalDispo,
  totalProducts,
  loading,
}: {
  status: BotStatus | null
  totalDispo: number
  totalProducts: number
  loading: boolean
}) {
  if (loading) {
    return <Skeleton className="h-[180px]" />
  }

  const nextRun = status?.next_run ? new Date(status.next_run) : null
  const minutesUntilNext = nextRun ? Math.max(0, Math.round((nextRun.getTime() - Date.now()) / 60_000)) : null

  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full aurora-primary blur-3xl" />

      <div className="relative p-5">
        <Eyebrow>Pulse</Eyebrow>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <PulseStat
            value={totalDispo}
            label="En rayon"
            accent={totalDispo > 0}
            icon={Icon.Zap}
          />
          <PulseStat
            value={totalProducts}
            label="Suivis"
            icon={Icon.Package}
          />
          <PulseStat
            value={formatLastCheck(status?.last_run)}
            label="Vérifié"
            small
            icon={Icon.Clock}
          />
        </div>

        {minutesUntilNext !== null && minutesUntilNext > 0 && (
          <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="relative flex h-1 w-1">
              <span className="absolute inset-0 rounded-full bg-primary animate-pulse" />
              <span className="relative h-1 w-1 rounded-full bg-primary" />
            </span>
            Prochain check dans {minutesUntilNext} min
          </div>
        )}
      </div>
    </Card>
  )
}

function PulseStat({
  value,
  label,
  accent,
  small,
  icon: IconCmp,
}: {
  value: number | string
  label: string
  accent?: boolean
  small?: boolean
  icon?: React.ComponentType<{ className?: string }>
}) {
  const isNum = typeof value === 'number'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Eyebrow>{label}</Eyebrow>
        {IconCmp && (
          <IconCmp
            className={cn('h-3 w-3', accent ? 'text-primary' : 'text-subtle-foreground')}
          />
        )}
      </div>
      <div>
        {isNum ? (
          <NumberDisplay
            value={value as number}
            className={cn(
              small ? 'text-xl' : 'text-[2rem] leading-none',
              accent ? 'text-primary' : 'text-foreground',
            )}
          />
        ) : (
          <p
            className={cn(
              'font-display tabular-nums leading-none tracking-tight',
              small ? 'text-base' : 'text-xl',
              'text-foreground',
            )}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {value}
          </p>
        )}
      </div>
    </div>
  )
}

/* ============================================================
   SECTION HEADER
   ============================================================ */

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
    <div className="flex items-end justify-between gap-3 px-0.5">
      <div className="space-y-1">
        <Eyebrow>{eyebrow}</Eyebrow>
        <SectionHeading>{title}</SectionHeading>
      </div>
      {hint && (
        <span className="font-display text-2xl leading-none tabular-nums text-muted-foreground"
          style={{ fontFamily: 'var(--font-display)' }}>
          {hint}
        </span>
      )}
    </div>
  )
}

function SkeletonList({ count }: { count: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-[160px]" />
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
    <div className="space-y-2.5">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} priority={priority} />
      ))}
    </div>
  )
}

/* ============================================================
   PRODUCT CARD — Style éditorial avec stocks
   ============================================================ */

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
      {/* Top zone produit */}
      <div className="p-4 pb-3.5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-md',
                  priority
                    ? 'bg-primary-muted text-primary'
                    : 'bg-card-hover text-muted-foreground border border-border',
                )}
              >
                <TypeIcon className="h-3 w-3" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {product.type_produit}
              </span>
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
            <h3 className="mt-2 text-[15px] font-semibold leading-snug tracking-tight text-foreground">
              {cleanProductName(product.nom)}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground truncate">{cleanSerieName(product.serie)}</p>
          </div>

          <div className="text-right shrink-0">
            <p
              className="font-display text-[1.5rem] leading-none tracking-tight tabular-nums text-foreground"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {product.prix_fnac.toFixed(0)}
              <span className="text-base ml-0.5">€</span>
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-subtle-foreground">
              retail
            </p>
          </div>
        </div>
      </div>

      {/* Bottom zone magasins */}
      {visible.length > 0 && (
        <div className="border-t border-border">
          {visible.map((stock, i) => (
            <StoreLine
              key={stock.eagid}
              stock={stock}
              isFirst={i === 0}
            />
          ))}
          {remaining > 0 && (
            <div className="border-t border-border px-4 py-2.5 text-center">
              <span className="text-[11px] font-medium text-subtle-foreground">
                + {remaining} autre{remaining > 1 ? 's' : ''} magasin{remaining > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function StoreLine({ stock, isFirst }: { stock: StockEntry; isFirst: boolean }) {
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
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-md shrink-0',
            stock.magasin_favori
              ? 'bg-primary-muted text-primary'
              : 'bg-card text-muted-foreground border border-border',
          )}
        >
          {stock.magasin_favori
            ? <Icon.Flame className="h-3 w-3" />
            : <Icon.MapPin className="h-3 w-3" />}
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-foreground truncate">
            {cleanStoreName(stock.magasin_nom)}
          </p>
          {isLimited && (
            <p className="text-[10px] uppercase tracking-[0.12em] text-warning mt-0.5 font-medium">
              Quantité limitée
            </p>
          )}
        </div>
      </div>
      <Icon.ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
    </button>
  )
}

/* ============================================================
   FOOTER credit — Touche éditoriale signature
   ============================================================ */

function FooterCredit() {
  return (
    <div className="pt-6 pb-2 text-center">
      <p
        className="font-display text-xs italic text-subtle-foreground"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        « Ce que la file d'attente ignore, PokeAlert le sait. »
      </p>
    </div>
  )
}

/* ============================================================
   Helpers
   ============================================================ */

function formatLastCheck(iso?: string | null): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'à l’instant'
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} h`
  return `${Math.floor(h / 24)} j`
}

function cleanProductName(name: string): string {
  return name
    .replace(/^(Carte|Cartes) à collectionner Pokémon\s*/i, '')
    .replace(/^Pokémon\s+/i, '')
    .trim()
}

function cleanSerieName(serie: string): string {
  return serie.replace(/^(ME\d+|EV\d+(?:\.\d+)?|Q\d+)\s*/, '').trim() || serie
}

function cleanStoreName(name: string): string {
  return name
    .replace(/^FNAC\s+/, '')
    .replace(/^Paris\s+/, '')
    .replace(/\s*\(rue de Rennes\)$/, '')
    .replace(/-CNIT$/, ' · CNIT')
}
