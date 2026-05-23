import { useMemo } from 'react'
import { Card, Eyebrow, Stat, EmptyState } from '../components/ui'
import { Icon } from '../components/Icons'
import { NumberDisplay } from '../components/NumberDisplay'
import type { ProductWithStock } from '../lib/api'
import { cn } from '../lib/cn'

interface Props {
  stock: ProductWithStock[]
}

export function StatsPage({ stock }: Props) {
  // Calculs dérivés du stock actuel (en attendant l'endpoint /stats avec historique)
  const stats = useMemo(() => {
    const totalActifs = stock.filter((p) => p.actif).length
    const totalEnRayon = stock.reduce((s, p) => s + p.in_stock_count, 0)
    const totalFavoris = stock.reduce((s, p) => s + p.in_stock_favoris, 0)
    const valeurStock = stock
      .filter((p) => p.in_stock_count > 0)
      .reduce((s, p) => s + p.prix_fnac * p.in_stock_favoris, 0)

    // Magasins triés par nombre de produits dispos
    const magasins = new Map<string, { name: string; count: number; favori: boolean }>()
    for (const product of stock) {
      for (const s of product.stocks) {
        const existing = magasins.get(s.magasin_nom)
        if (existing) {
          existing.count += 1
        } else {
          magasins.set(s.magasin_nom, { name: s.magasin_nom, count: 1, favori: s.magasin_favori })
        }
      }
    }
    const topMagasins = Array.from(magasins.values()).sort((a, b) => b.count - a.count).slice(0, 5)

    // Produits par type
    const byType = {
      ETB: stock.filter((p) => p.type_produit === 'ETB' && p.in_stock_count > 0).length,
      Bundle: stock.filter((p) => p.type_produit === 'Bundle' && p.in_stock_count > 0).length,
      Tripack: stock.filter((p) => p.type_produit === 'Tripack' && p.in_stock_count > 0).length,
    }

    return {
      totalActifs,
      totalEnRayon,
      totalFavoris,
      valeurStock,
      topMagasins,
      byType,
    }
  }, [stock])

  if (stock.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Insights"
          title="Tendances"
          description="Analyse de tes drops, magasins actifs et opportunités."
        />
        <EmptyState
          title="Bientôt"
          description="Les statistiques s'enrichissent dès qu'une semaine d'historique sera accumulée."
          icon={Icon.TrendingUp}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Insights"
        title="Tendances"
        description="Analyse de tes drops, magasins actifs et opportunités."
      />

      <div className="grid grid-cols-2 gap-2">
        <Stat value={stats.totalEnRayon} label="Total en rayon" accent />
        <Stat value={stats.totalFavoris} label="Prioritaires" />
      </div>

      <ValueCard valeur={stats.valeurStock} count={stats.totalFavoris} />

      <DistributionCard byType={stats.byType} />

      <section className="space-y-3">
        <div className="px-0.5">
          <Eyebrow>Classement</Eyebrow>
          <h2 className="mt-1 text-base font-semibold text-foreground">Top magasins</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Classement par nombre de produits disponibles actuellement.
          </p>
        </div>

        <Card>
          {stats.topMagasins.map((m, i) => (
            <div
              key={m.name}
              className={cn(
                'flex items-center justify-between gap-3 px-4 py-3',
                i > 0 && 'border-t border-border',
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="font-display text-base leading-none tabular-nums text-muted-foreground w-5"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {i + 1}
                </span>
                <div className="flex items-center gap-2 min-w-0">
                  {m.favori && <Icon.Flame className="h-3 w-3 text-primary shrink-0" />}
                  <p className="text-sm font-medium text-foreground truncate">
                    {cleanStoreName(m.name)}
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold tabular-nums text-foreground shrink-0">
                {m.count}
              </span>
            </div>
          ))}
        </Card>
      </section>

      <NoteBox />
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

function ValueCard({ valeur, count }: { valeur: number; count: number }) {
  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/12 blur-3xl" />
      <div className="relative p-5 space-y-3">
        <Eyebrow>Valeur actuelle accessible</Eyebrow>
        <NumberDisplay
          value={valeur}
          format={{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }}
          className="text-[2.5rem] leading-none text-foreground block"
        />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Valeur totale des {count} produit{count > 1 ? 's' : ''} disponible{count > 1 ? 's' : ''} dans tes magasins prioritaires, au prix retail FNAC.
        </p>
      </div>
    </Card>
  )
}

function DistributionCard({ byType }: { byType: { ETB: number; Bundle: number; Tripack: number } }) {
  const total = byType.ETB + byType.Bundle + byType.Tripack
  if (total === 0) return null

  const segments = [
    { key: 'ETB', value: byType.ETB, color: 'bg-primary', label: 'ETB' },
    { key: 'Bundle', value: byType.Bundle, color: 'bg-success', label: 'Bundle' },
    { key: 'Tripack', value: byType.Tripack, color: 'bg-warning', label: 'Tripack' },
  ]

  return (
    <Card className="p-5">
      <Eyebrow>Répartition</Eyebrow>
      <h3 className="mt-1 text-base font-semibold text-foreground">Par type de produit</h3>

      <div className="mt-4 h-2 rounded-full bg-border overflow-hidden flex">
        {segments.map((s) => s.value > 0 && (
          <div
            key={s.key}
            className={s.color}
            style={{ width: `${(s.value / total) * 100}%` }}
          />
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {segments.map((s) => (
          <div key={s.key} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className={cn('h-2 w-2 rounded-full', s.color)} />
              <span className="text-foreground">{s.label}</span>
            </div>
            <span className="tabular-nums text-muted-foreground">
              {s.value} <span className="text-subtle-foreground">·</span> {Math.round((s.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function NoteBox() {
  return (
    <div className="rounded-2xl border border-border bg-card/50 p-4 flex items-start gap-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-card-hover text-muted-foreground shrink-0">
        <Icon.Sparkles className="h-3.5 w-3.5" />
      </div>
      <div>
        <p className="text-xs font-semibold text-foreground">Plus d'historique bientôt</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
          Drops par jour, sparkline 7 jours et tendance hebdo seront disponibles d'ici une semaine d'usage.
        </p>
      </div>
    </div>
  )
}

function cleanStoreName(name: string): string {
  return name
    .replace(/^FNAC\s+/, '')
    .replace(/^Paris\s+-?\s*/, '')
    .replace(/\s*\(rue de Rennes\)$/, '')
    .replace(/-CNIT$/, ' · CNIT')
}
