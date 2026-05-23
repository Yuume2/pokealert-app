import { useEffect, useState } from 'react'
import { Card, Eyebrow, Stat, Skeleton } from '../components/ui'
import { Icon } from '../components/Icons'
import { NumberDisplay } from '../components/NumberDisplay'
import { api, type StatsData, type ProductWithStock } from '../lib/api'
import { isInTelegram } from '../lib/telegram'
import { cn } from '../lib/cn'

interface Props {
  stock: ProductWithStock[]
}

export function StatsPage({ stock }: Props) {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  const useMock = !isInTelegram() || import.meta.env.VITE_USE_MOCK === 'true'

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        if (useMock) {
          await new Promise((r) => setTimeout(r, 200))
          if (cancelled) return
          setStats(buildMockStats(stock))
        } else {
          const s = await api.stats()
          if (cancelled) return
          setStats(s)
        }
      } catch {
        if (!cancelled) {
          setStats(buildMockStats(stock))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [useMock, stock.length])

  // Calculs additionnels depuis le stock live
  const inStockNow = stock.reduce((s, p) => s + p.in_stock_count, 0)
  const inStockFavoris = stock.reduce((s, p) => s + p.in_stock_favoris, 0)
  const productsInStock = stock.filter((p) => p.in_stock_count > 0).length

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Insights"
        title="Tendances"
        description="Vue d'ensemble du catalogue, des magasins surveillés et de la couverture en temps réel."
      />

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-[88px]" />
          <Skeleton className="h-[180px]" />
          <Skeleton className="h-[140px]" />
        </div>
      ) : !stats ? null : (
        <>
          <LiveCoverage
            inStockNow={inStockNow}
            inStockFavoris={inStockFavoris}
            productsInStock={productsInStock}
            totalProducts={stats.counts.total_products}
          />

          <CatalogSection stats={stats} />

          <PriceSection stats={stats} />

          <TopSeriesSection topSeries={stats.top_series} />

          {stats.note && <NoteBox text={stats.note} />}
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

function LiveCoverage({
  inStockNow,
  inStockFavoris,
  productsInStock,
  totalProducts,
}: {
  inStockNow: number
  inStockFavoris: number
  productsInStock: number
  totalProducts: number
}) {
  const coverage = totalProducts > 0 ? Math.round((productsInStock / totalProducts) * 100) : 0

  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/12 blur-3xl" />
      <div className="relative p-5 space-y-4">
        <div className="flex items-center justify-between">
          <Eyebrow>État live</Eyebrow>
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-success font-medium">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-75" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            Direct
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <NumberDisplay
              value={inStockNow}
              className="text-[2.25rem] leading-none text-primary"
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Magasins×produits en rayon
            </p>
          </div>
          <div>
            <NumberDisplay
              value={inStockFavoris}
              className="text-[2.25rem] leading-none text-foreground"
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Dans tes prioritaires
            </p>
          </div>
          <div>
            <NumberDisplay
              value={coverage}
              className="text-[2.25rem] leading-none text-foreground"
              suffix="%"
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Couverture catalogue
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}

function CatalogSection({ stats }: { stats: StatsData }) {
  const t = stats.counts.by_type
  const total = t.ETB + t.Bundle + t.Tripack
  if (total === 0) return null

  const segments = [
    { key: 'ETB', value: t.ETB, color: 'bg-primary', label: 'Coffrets ETB' },
    { key: 'Bundle', value: t.Bundle, color: 'bg-success', label: 'Bundles' },
    { key: 'Tripack', value: t.Tripack, color: 'bg-warning', label: 'Tripacks' },
  ]

  return (
    <Card className="p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <Eyebrow>Catalogue surveillé</Eyebrow>
          <h2 className="mt-1 text-base font-semibold text-foreground">
            Répartition par format
          </h2>
        </div>
        <span
          className="font-display text-xl leading-none tabular-nums text-muted-foreground"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {total}
        </span>
      </div>

      <div className="mt-4 h-2 rounded-full bg-border overflow-hidden flex">
        {segments.map(
          (s) =>
            s.value > 0 && (
              <div
                key={s.key}
                className={s.color}
                style={{ width: `${(s.value / total) * 100}%` }}
              />
            ),
        )}
      </div>

      <div className="mt-4 space-y-2.5">
        {segments.map((s) => (
          <div key={s.key} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className={cn('h-2 w-2 rounded-full', s.color)} />
              <span className="text-foreground">{s.label}</span>
            </div>
            <span className="tabular-nums text-muted-foreground">
              {s.value}{' '}
              <span className="text-subtle-foreground">
                · {Math.round((s.value / total) * 100)}%
              </span>
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function PriceSection({ stats }: { stats: StatsData }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Stat
        value={`${stats.prices.min.toFixed(0)} €`}
        label="Prix min"
      />
      <Stat
        value={`${stats.prices.avg.toFixed(0)} €`}
        label="Prix moyen"
        accent
      />
      <Stat
        value={`${stats.prices.max.toFixed(0)} €`}
        label="Prix max"
      />
    </div>
  )
}

function TopSeriesSection({
  topSeries,
}: {
  topSeries: StatsData['top_series']
}) {
  if (topSeries.length === 0) return null

  const max = Math.max(...topSeries.map((s) => s.count), 1)

  return (
    <section className="space-y-3">
      <div className="px-0.5">
        <Eyebrow>Classement</Eyebrow>
        <h2 className="mt-1 text-base font-semibold text-foreground">Top séries</h2>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Extensions et séries Pokémon les plus représentées dans ta surveillance.
        </p>
      </div>

      <Card>
        {topSeries.map((s, i) => (
          <div
            key={s.nom}
            className={cn(
              'px-4 py-3.5',
              i > 0 && 'border-t border-border',
            )}
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="font-display text-base leading-none tabular-nums text-muted-foreground w-5"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {i + 1}
                </span>
                <p className="text-sm font-medium text-foreground truncate">{s.nom}</p>
              </div>
              <span className="text-sm font-semibold tabular-nums text-foreground shrink-0">
                {s.count}
              </span>
            </div>
            <div className="h-1 rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${(s.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </Card>
    </section>
  )
}

function NoteBox({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/50 p-4 flex items-start gap-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-card-hover text-muted-foreground shrink-0">
        <Icon.Sparkles className="h-3.5 w-3.5" />
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">{text}</p>
    </div>
  )
}

function buildMockStats(stock: ProductWithStock[]): StatsData {
  const actifs = stock.filter((p) => p.actif)
  const byType = {
    ETB: actifs.filter((p) => p.type_produit === 'ETB').length,
    Bundle: actifs.filter((p) => p.type_produit === 'Bundle').length,
    Tripack: actifs.filter((p) => p.type_produit === 'Tripack').length,
  }
  const prices = actifs.map((p) => p.prix_fnac).filter((p) => p > 0)
  const series: Record<string, number> = {}
  for (const p of actifs) {
    const key = p.serie.replace(/^(ME\d+|EV\d+(?:\.\d+)?|Q\d+)\s*/, '').trim() || p.serie
    series[key] = (series[key] || 0) + 1
  }
  const topSeries = Object.entries(series)
    .map(([nom, count]) => ({ nom, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    snapshot_at: new Date().toISOString(),
    counts: {
      total_products: stock.length,
      actifs: actifs.length,
      inactifs: stock.length - actifs.length,
      by_type: byType,
      magasins_tracked: 9,
      favoris_tracked: 3,
    },
    prices: {
      total_catalog_value: prices.reduce((a, b) => a + b, 0),
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 0,
      avg: prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
    },
    top_series: topSeries,
  }
}
