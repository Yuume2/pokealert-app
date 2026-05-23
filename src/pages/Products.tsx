import { useState, useMemo } from 'react'
import { Card, Eyebrow, Switch, Skeleton, EmptyState } from '../components/ui'
import { Icon } from '../components/Icons'
import { cn } from '../lib/cn'
import { haptic, notify, isInTelegram } from '../lib/telegram'
import { api, type ProductWithStock } from '../lib/api'

interface Props {
  stock: ProductWithStock[]
  loading: boolean
  onRefresh: () => void
}

export function ProductsPage({ stock, loading, onRefresh }: Props) {
  const [toggling, setToggling] = useState<Set<number>>(new Set())
  const [query, setQuery] = useState('')
  const useMock = !isInTelegram() || import.meta.env.VITE_USE_MOCK === 'true'

  const handleToggle = async (id: number, current: boolean) => {
    haptic('medium')
    setToggling((s) => new Set(s).add(id))
    try {
      if (!useMock) {
        await api.toggleProduct(id, !current)
      } else {
        await new Promise((r) => setTimeout(r, 350))
      }
      notify('success')
      onRefresh()
    } catch {
      notify('error')
    } finally {
      setToggling((s) => {
        const next = new Set(s)
        next.delete(id)
        return next
      })
    }
  }

  const filtered = useMemo(() => {
    if (!query) return stock
    const q = query.toLowerCase()
    return stock.filter((p) =>
      p.nom.toLowerCase().includes(q) || p.serie.toLowerCase().includes(q),
    )
  }, [stock, query])

  const byType = {
    ETB: filtered.filter((p) => p.type_produit === 'ETB'),
    Bundle: filtered.filter((p) => p.type_produit === 'Bundle'),
    Tripack: filtered.filter((p) => p.type_produit === 'Tripack'),
  }

  const totalActifs = stock.filter((p) => p.actif).length

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuration"
        title="Surveillance"
        description={`${totalActifs} produit${totalActifs > 1 ? 's' : ''} sur ${stock.length} actuellement actif${totalActifs > 1 ? 's' : ''}.`}
      />

      <AddProductCard />

      <div className="relative">
        <Icon.Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher dans tes produits…"
          className={cn(
            'w-full h-11 pl-11 pr-4 rounded-full',
            'bg-card border border-border',
            'text-sm text-foreground placeholder:text-muted-foreground',
            'focus:outline-none focus:border-border-strong focus:bg-card-hover',
            'transition-colors',
          )}
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-[68px]" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={query ? 'Aucun résultat' : 'Aucun produit'}
          description={query ? 'Essaie un autre terme.' : 'Ajoute des produits pour commencer.'}
          icon={Icon.Package}
        />
      ) : (
        <>
          <TypeSection
            title="Coffrets Dresseur d'Élite"
            eyebrow="ETB"
            description="Premium · 9 boosters · le plus rentable"
            items={byType.ETB}
            onToggle={handleToggle}
            toggling={toggling}
          />
          <TypeSection
            title="Bundles 6 boosters"
            eyebrow="Bundle"
            description="Lot de 6 boosters scellés"
            items={byType.Bundle}
            onToggle={handleToggle}
            toggling={toggling}
          />
          <TypeSection
            title="Tripacks 3 boosters"
            eyebrow="Tripack"
            description="Pack de 3 boosters avec carte promo"
            items={byType.Tripack}
            onToggle={handleToggle}
            toggling={toggling}
          />
        </>
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

function AddProductCard() {
  return (
    <Card className="p-4 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/8 blur-3xl" />
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-muted text-primary shrink-0">
            <Icon.Plus className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Ajouter un produit</p>
            <p className="text-xs text-muted-foreground truncate">
              Colle un lien FNAC, le bot extrait tout
            </p>
          </div>
        </div>
        <button
          disabled
          className="shrink-0 px-3 h-8 rounded-full text-[11px] font-medium border border-border bg-card text-muted-foreground"
        >
          Bientôt
        </button>
      </div>
    </Card>
  )
}

function TypeSection({
  title,
  eyebrow,
  description,
  items,
  onToggle,
  toggling,
}: {
  title: string
  eyebrow: string
  description: string
  items: ProductWithStock[]
  onToggle: (id: number, current: boolean) => void
  toggling: Set<number>
}) {
  if (items.length === 0) return null
  const actifs = items.filter((i) => i.actif).length

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3 px-0.5">
        <div className="space-y-1">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="text-[11px] text-muted-foreground">{description}</p>
        </div>
        <span
          className="font-display text-xl leading-none tabular-nums text-muted-foreground"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {actifs}<span className="text-subtle-foreground">/{items.length}</span>
        </span>
      </div>
      <div className="space-y-2">
        {items.map((p) => (
          <ProductToggleRow
            key={p.id}
            product={p}
            disabled={toggling.has(p.id)}
            onToggle={() => onToggle(p.id, p.actif)}
          />
        ))}
      </div>
    </section>
  )
}

function ProductToggleRow({
  product,
  disabled,
  onToggle,
}: {
  product: ProductWithStock
  disabled: boolean
  onToggle: () => void
}) {
  return (
    <Card className={cn('p-3.5 transition-opacity', !product.actif && 'opacity-50')}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-foreground truncate leading-snug">
            {cleanProductName(product.nom)}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground flex-wrap">
            <span className="truncate">{cleanSerie(product.serie)}</span>
            <span className="text-subtle-foreground">·</span>
            <span className="tabular-nums font-medium">{product.prix_fnac.toFixed(0)} €</span>
            {product.in_stock_count > 0 && (
              <>
                <span className="text-subtle-foreground">·</span>
                <span className="inline-flex items-center gap-1 text-success">
                  <span className="h-1 w-1 rounded-full bg-success" />
                  {product.in_stock_count} dispo
                </span>
              </>
            )}
          </div>
        </div>
        <div className={cn('shrink-0', disabled && 'opacity-50 pointer-events-none')}>
          <Switch checked={product.actif} onChange={onToggle} />
        </div>
      </div>
    </Card>
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
