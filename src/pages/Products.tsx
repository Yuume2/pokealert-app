import { useState } from 'react'
import { Card, Eyebrow, Switch, Button, Skeleton, EmptyState } from '../components/ui'
import { Icon } from '../components/Icons'
import { cn } from '../lib/cn'
import { haptic, notify } from '../lib/telegram'
import { api, type ProductWithStock } from '../lib/api'
import { isInTelegram } from '../lib/telegram'

interface Props {
  stock: ProductWithStock[]
  loading: boolean
  onRefresh: () => void
}

export function ProductsPage({ stock, loading, onRefresh }: Props) {
  const [toggling, setToggling] = useState<number | null>(null)
  const useMock = !isInTelegram() || import.meta.env.VITE_USE_MOCK === 'true'

  const handleToggle = async (id: number, current: boolean) => {
    haptic('medium')
    setToggling(id)
    try {
      if (!useMock) {
        await api.toggleProduct(id, !current)
      } else {
        await new Promise((r) => setTimeout(r, 400))
      }
      notify('success')
      onRefresh()
    } catch (e) {
      notify('error')
    } finally {
      setToggling(null)
    }
  }

  const byType = {
    ETB: stock.filter((p) => p.type_produit === 'ETB'),
    Bundle: stock.filter((p) => p.type_produit === 'Bundle'),
    Tripack: stock.filter((p) => p.type_produit === 'Tripack'),
  }

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <Eyebrow>Configuration</Eyebrow>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Produits suivis</h1>
        <p className="text-sm text-muted-foreground">
          Active ou désactive le monitoring par produit. Les désactivés n'envoient plus d'alertes.
        </p>
      </header>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-muted text-primary">
              <Icon.Plus className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Ajouter un produit</p>
              <p className="text-xs text-muted-foreground">Colle un lien FNAC, le bot s'occupe du reste.</p>
            </div>
          </div>
          <Button size="sm" variant="secondary" disabled>
            Bientôt
          </Button>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-[68px]" />)}
        </div>
      ) : stock.length === 0 ? (
        <EmptyState
          title="Aucun produit"
          description="Ta liste de surveillance est vide."
          icon={Icon.Package}
        />
      ) : (
        <>
          <TypeSection title="Coffrets Dresseur d'Élite" eyebrow="ETB" items={byType.ETB} onToggle={handleToggle} toggling={toggling} />
          <TypeSection title="Bundles 6 boosters" eyebrow="Bundle" items={byType.Bundle} onToggle={handleToggle} toggling={toggling} />
          <TypeSection title="Tripacks" eyebrow="Tripack" items={byType.Tripack} onToggle={handleToggle} toggling={toggling} />
        </>
      )}
    </div>
  )
}

function TypeSection({
  title,
  eyebrow,
  items,
  onToggle,
  toggling,
}: {
  title: string
  eyebrow: string
  items: ProductWithStock[]
  onToggle: (id: number, current: boolean) => void
  toggling: number | null
}) {
  if (items.length === 0) return null
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="mt-1 text-base font-semibold text-foreground">{title}</h2>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {items.filter((i) => i.actif).length}/{items.length}
        </span>
      </div>
      <div className="space-y-2">
        {items.map((p) => (
          <ProductToggleRow
            key={p.id}
            product={p}
            disabled={toggling === p.id}
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
    <Card className={cn('p-3.5', !product.actif && 'opacity-60')}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {cleanProductName(product.nom)}
          </p>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="truncate">{product.serie}</span>
            <span className="text-subtle-foreground">·</span>
            <span className="tabular-nums">{product.prix_fnac.toFixed(2)} €</span>
            {product.in_stock_count > 0 && (
              <>
                <span className="text-subtle-foreground">·</span>
                <span className="text-success">
                  {product.in_stock_count} en rayon
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
  return name.replace(/^(Carte|Cartes) à collectionner Pokémon\s*/i, '').trim()
}
