import { useEffect, useState } from 'react'
import { isInTelegram, haptic, openExternal } from './lib/telegram'
import { api, type BotStatus, type ProductWithStock } from './lib/api'
import { MOCK_STATUS, MOCK_STOCK } from './lib/mock'

type Tab = 'home' | 'stock' | 'products' | 'stats'

export default function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [status, setStatus] = useState<BotStatus | null>(null)
  const [stock, setStock] = useState<ProductWithStock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const useMock = !isInTelegram() || import.meta.env.VITE_USE_MOCK === 'true'

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        if (useMock) {
          await new Promise((r) => setTimeout(r, 300))
          if (cancelled) return
          setStatus(MOCK_STATUS)
          setStock(MOCK_STOCK)
        } else {
          const [s, st] = await Promise.all([api.status(), api.stock()])
          if (cancelled) return
          setStatus(s)
          setStock(st)
        }
        setError(null)
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Erreur inconnue')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [useMock])

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      <Header status={status} />

      <main className="flex-1 px-4 py-4 pb-24">
        {loading && <LoadingState />}
        {!loading && error && <ErrorState message={error} />}
        {!loading && !error && tab === 'home' && <HomeView status={status} stock={stock} />}
        {!loading && !error && tab === 'stock' && <StockView stock={stock} />}
        {!loading && !error && tab === 'products' && <ProductsView stock={stock} />}
        {!loading && !error && tab === 'stats' && <StatsView />}
      </main>

      <BottomNav current={tab} onChange={setTab} />
    </div>
  )
}

function Header({ status }: { status: BotStatus | null }) {
  const isActive = status?.active && !status?.paused
  return (
    <header className="px-4 pt-4 pb-3 border-b border-white/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-2xl">🔥</div>
          <div>
            <h1 className="text-lg font-bold leading-tight">PokeAlert</h1>
            <p className="text-xs text-hint">Paris · La Défense</p>
          </div>
        </div>
        <StatusBadge active={!!isActive} paused={!!status?.paused} />
      </div>
    </header>
  )
}

function StatusBadge({ active, paused }: { active: boolean; paused: boolean }) {
  if (paused) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium">
        <span className="size-1.5 rounded-full bg-warning" />
        En pause
      </div>
    )
  }
  if (active) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
        <span className="size-1.5 rounded-full bg-success animate-pulse" />
        Actif
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
      <span className="size-1.5 rounded-full bg-destructive" />
      Inactif
    </div>
  )
}

function HomeView({
  status,
  stock,
}: {
  status: BotStatus | null
  stock: ProductWithStock[]
}) {
  const dropsInFavoris = stock.filter((p) => p.in_stock_favoris > 0)
  const totalInStock = stock.reduce((sum, p) => sum + p.in_stock_count, 0)

  return (
    <div className="space-y-4">
      <SummaryCards
        productsCount={status?.products_count ?? 0}
        inStock={totalInStock}
        lastRun={status?.last_run}
      />

      <section>
        <SectionHeader title="🔥 Drops actifs dans tes magasins" />
        {dropsInFavoris.length === 0 ? (
          <EmptyState message="Aucun produit en rayon dans tes magasins favoris pour l'instant." />
        ) : (
          <div className="space-y-2">
            {dropsInFavoris.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {stock.filter((p) => p.in_stock_count > 0 && p.in_stock_favoris === 0).length > 0 && (
        <section>
          <SectionHeader title="📍 Autres magasins" />
          <div className="space-y-2">
            {stock
              .filter((p) => p.in_stock_count > 0 && p.in_stock_favoris === 0)
              .map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
          </div>
        </section>
      )}
    </div>
  )
}

function SummaryCards({
  productsCount,
  inStock,
  lastRun,
}: {
  productsCount: number
  inStock: number
  lastRun?: string | null
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <SummaryCard label="Suivis" value={productsCount.toString()} />
      <SummaryCard label="Dispo" value={inStock.toString()} accent />
      <SummaryCard label="Dernier check" value={timeAgo(lastRun)} small />
    </div>
  )
}

function SummaryCard({
  label,
  value,
  accent,
  small,
}: {
  label: string
  value: string
  accent?: boolean
  small?: boolean
}) {
  return (
    <div className="bg-bg-secondary rounded-2xl p-3">
      <div className="text-xs text-hint mb-1">{label}</div>
      <div
        className={`font-bold ${small ? 'text-sm' : 'text-2xl'} ${
          accent ? 'text-accent' : ''
        }`}
      >
        {value}
      </div>
    </div>
  )
}

function ProductCard({ product }: { product: ProductWithStock }) {
  const favorisStocks = product.stocks.filter((s) => s.magasin_favori)
  const otherStocks = product.stocks.filter((s) => !s.magasin_favori)
  const allStocks = [...favorisStocks, ...otherStocks]
  const typeEmoji =
    product.type_produit === 'ETB' ? '📦' : product.type_produit === 'Bundle' ? '🎁' : '🎴'

  return (
    <div className="bg-bg-secondary rounded-2xl p-3.5 space-y-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-base">{typeEmoji}</span>
            <span className="text-xs font-semibold text-accent uppercase tracking-wide">
              {product.type_produit}
            </span>
          </div>
          <h3 className="font-semibold text-sm leading-snug truncate">{product.nom}</h3>
          <p className="text-xs text-hint mt-0.5 truncate">{product.serie}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-base font-bold">{product.prix_fnac.toFixed(2)}€</div>
          <div className="text-[10px] text-hint uppercase">retail</div>
        </div>
      </div>

      {allStocks.length > 0 && (
        <div className="space-y-1.5 pt-1.5 border-t border-white/5">
          {allStocks.slice(0, 3).map((s) => (
            <StockLine key={s.eagid} stock={s} />
          ))}
          {allStocks.length > 3 && (
            <div className="text-xs text-hint pt-1">+ {allStocks.length - 3} autres magasins</div>
          )}
        </div>
      )}
    </div>
  )
}

function StockLine({ stock }: { stock: any }) {
  const onClick = () => {
    haptic('light')
    const coord = stock.store_coord?.replace(/[()]/g, '')
    const url = coord
      ? `https://www.google.com/maps/search/?api=1&query=${coord}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stock.magasin_nom)}`
    openExternal(url)
  }

  const limite = stock.stock_label?.includes('limitée')

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-2 text-left hover:bg-white/5 active:bg-white/10 rounded-lg px-1 py-0.5 -mx-1 transition-colors"
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-sm shrink-0">{stock.magasin_favori ? '🔥' : '📍'}</span>
        <span className="text-sm truncate">{stock.magasin_nom}</span>
        {limite && <span className="text-[10px] text-warning shrink-0">limité</span>}
      </div>
      <span className="text-xs text-hint shrink-0">→</span>
    </button>
  )
}

function StockView({ stock }: { stock: ProductWithStock[] }) {
  return (
    <div className="space-y-3">
      <SectionHeader title={`📊 Stock complet (${stock.length})`} />
      {stock.length === 0 ? (
        <EmptyState message="Aucun produit suivi." />
      ) : (
        <div className="space-y-2">
          {stock.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}

function ProductsView({ stock }: { stock: ProductWithStock[] }) {
  return (
    <div className="space-y-3">
      <SectionHeader title="⚙️ Gérer les produits" />
      <button className="w-full bg-accent text-accent-text font-medium py-3 rounded-xl active:opacity-80">
        + Ajouter un produit (lien FNAC)
      </button>
      <div className="space-y-2">
        {stock.map((p) => (
          <ProductToggleCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  )
}

function ProductToggleCard({ product }: { product: ProductWithStock }) {
  return (
    <div className="bg-bg-secondary rounded-2xl p-3 flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm truncate">{product.nom}</h3>
        <p className="text-xs text-hint truncate">{product.serie}</p>
      </div>
      <div
        className={`relative w-11 h-6 rounded-full transition-colors ${
          product.actif ? 'bg-success' : 'bg-white/10'
        }`}
      >
        <div
          className={`absolute top-0.5 size-5 bg-white rounded-full transition-transform ${
            product.actif ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </div>
    </div>
  )
}

function StatsView() {
  return (
    <div className="space-y-3">
      <SectionHeader title="📈 Statistiques" />
      <EmptyState message="Stats disponibles au Sprint 3 (cette semaine)." />
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return <h2 className="text-sm font-semibold text-hint mb-2.5 px-1">{title}</h2>
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-hint">
      <div className="text-4xl mb-3 animate-pulse">🔥</div>
      <p className="text-sm">Chargement…</p>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 text-sm">
      <p className="font-semibold text-destructive mb-1">Erreur de connexion</p>
      <p className="text-hint text-xs">{message}</p>
      <p className="text-hint text-xs mt-2">Les webhooks n8n sont peut-être pas encore configurés.</p>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-bg-secondary rounded-2xl p-6 text-center text-sm text-hint">
      {message}
    </div>
  )
}

function BottomNav({ current, onChange }: { current: Tab; onChange: (t: Tab) => void }) {
  const tabs: Array<{ id: Tab; icon: string; label: string }> = [
    { id: 'home', icon: '🏠', label: 'Accueil' },
    { id: 'stock', icon: '📊', label: 'Stock' },
    { id: 'products', icon: '⚙️', label: 'Produits' },
    { id: 'stats', icon: '📈', label: 'Stats' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg/95 backdrop-blur-xl border-t border-white/5 px-2 pb-safe">
      <div className="flex items-center justify-around">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              haptic('light')
              onChange(t.id)
            }}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
              current === t.id ? 'text-accent' : 'text-hint'
            }`}
          >
            <span className="text-xl">{t.icon}</span>
            <span className="text-[10px] font-medium">{t.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

function timeAgo(iso?: string | null): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h}h`
  return `il y a ${Math.floor(h / 24)}j`
}
