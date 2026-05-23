import { useCallback, useEffect, useState } from 'react'
import { isInTelegram, haptic } from './lib/telegram'
import { api, type BotStatus, type ProductWithStock } from './lib/api'
import { MOCK_STATUS, MOCK_STOCK } from './lib/mock'
import { HomePage } from './pages/Home'
import { StockPage } from './pages/Stock'
import { ProductsPage } from './pages/Products'
import { StatsPage } from './pages/Stats'
import { Icon } from './components/Icons'
import { cn } from './lib/cn'
import { ProductDetailSheet } from './components/ProductDetailSheet'
import { Onboarding } from './components/Onboarding'

type Tab = 'home' | 'stock' | 'products' | 'stats'

const useMock = (() => {
  if (typeof window === 'undefined') return false
  if (import.meta.env.VITE_USE_MOCK === 'true') return true
  return !isInTelegram()
})()

export default function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [status, setStatus] = useState<BotStatus | null>(null)
  const [stock, setStock] = useState<ProductWithStock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductWithStock | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [lastFetch, setLastFetch] = useState<number>(0)

  // Onboarding au 1er lancement
  useEffect(() => {
    try {
      const seen = localStorage.getItem('pokealert_seen_intro')
      if (!seen) setShowOnboarding(true)
    } catch {
      // localStorage indispo (mode privé/incognito), skip
    }
  }, [])

  const dismissOnboarding = () => {
    try {
      localStorage.setItem('pokealert_seen_intro', '1')
    } catch {}
    setShowOnboarding(false)
  }

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      else setRefreshing(true)

      if (useMock) {
        await new Promise((r) => setTimeout(r, 300))
        setStatus(MOCK_STATUS)
        setStock(MOCK_STOCK)
      } else {
        const [s, st] = await Promise.all([api.status(), api.stock()])
        setStatus(s)
        setStock(st)
      }
      setError(null)
      setLastFetch(Date.now())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(() => load(true), 60_000)
    return () => clearInterval(interval)
  }, [load])

  // Si selectedProduct change suite à un refresh, le mettre à jour
  useEffect(() => {
    if (selectedProduct) {
      const updated = stock.find((p) => p.id === selectedProduct.id)
      if (updated) setSelectedProduct(updated)
    }
  }, [stock])

  const handleTabChange = (next: Tab) => {
    haptic('light')
    setTab(next)
    // Reset scroll quand on change d'onglet
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const handleProductClick = (product: ProductWithStock) => {
    haptic('medium')
    setSelectedProduct(product)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="flex-1 px-4 pt-3 pb-28 max-w-2xl w-full mx-auto">
        {error && !loading && <ErrorBanner message={error} onRetry={() => load()} />}

        <div key={tab} className="animate-page">
          {tab === 'home' && (
            <HomePage
              status={status}
              stock={stock}
              loading={loading}
              refreshing={refreshing}
              lastFetch={lastFetch}
              onProductClick={handleProductClick}
              onRefresh={() => load(true)}
            />
          )}
          {tab === 'stock' && (
            <StockPage
              stock={stock}
              loading={loading}
              onProductClick={handleProductClick}
            />
          )}
          {tab === 'products' && (
            <ProductsPage stock={stock} loading={loading} onRefresh={() => load(true)} />
          )}
          {tab === 'stats' && <StatsPage stock={stock} />}
        </div>
      </main>

      <BottomNav current={tab} onChange={handleTabChange} refreshing={refreshing} />

      <ProductDetailSheet
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {showOnboarding && <Onboarding onClose={dismissOnboarding} />}
    </div>
  )
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mb-5 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10 text-destructive shrink-0">
          <Icon.WifiOff className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Connexion impossible</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{message}</p>
        </div>
        <button
          onClick={onRetry}
          className="text-xs font-medium text-foreground hover:text-primary transition-colors shrink-0"
        >
          Réessayer
        </button>
      </div>
    </div>
  )
}

function BottomNav({
  current,
  onChange,
  refreshing,
}: {
  current: Tab
  onChange: (t: Tab) => void
  refreshing: boolean
}) {
  const tabs: Array<{ id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'home', label: 'Accueil', icon: Icon.Home },
    { id: 'stock', label: 'Stock', icon: Icon.LayoutGrid },
    { id: 'products', label: 'Produits', icon: Icon.ListChecks },
    { id: 'stats', label: 'Stats', icon: Icon.TrendingUp },
  ]

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'border-t border-border bg-background/80 backdrop-blur-2xl',
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Refresh indicator */}
      {refreshing && (
        <div className="absolute top-0 left-0 right-0 h-0.5 overflow-hidden">
          <div className="h-full bg-primary animate-shimmer" style={{
            background: 'linear-gradient(90deg, transparent, var(--color-primary), transparent)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s linear infinite',
          }} />
        </div>
      )}

      <div className="max-w-2xl mx-auto px-2">
        <div className="grid grid-cols-4">
          {tabs.map((t) => {
            const isActive = current === t.id
            return (
              <button
                key={t.id}
                onClick={() => onChange(t.id)}
                className="relative flex flex-col items-center gap-0.5 py-3 transition-colors group"
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-primary rounded-full" />
                )}
                <t.icon
                  className={cn(
                    'h-[18px] w-[18px] transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                  )}
                />
                <span
                  className={cn(
                    'text-[10px] font-medium tracking-tight transition-colors',
                    isActive ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {t.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
