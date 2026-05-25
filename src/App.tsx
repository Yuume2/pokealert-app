import { useCallback, useEffect, useState } from 'react'
import { isInTelegram, haptic } from './lib/telegram'
import { api, type BotStatus, type ProductWithStock } from './lib/api'
import { MOCK_STATUS, MOCK_STOCK } from './lib/mock'
import { TodayPage } from './pages/TodayPage'
import { HomeV2Page } from './pages/HomeV2'
import { SearchPage } from './pages/SearchPage'
import { StoresPage } from './pages/StoresPage'
import { CalendrierPage } from './pages/CalendrierPage'
import { PortfolioPage } from './pages/PortfolioPage'
import { Icon } from './components/Icons'
import { cn } from './lib/cn'
import { ProductDetailSheet } from './components/ProductDetailSheet'
import { StoreDetailSheet } from './components/StoreDetailSheet'
import { Onboarding } from './components/Onboarding'
import {
  getFavorisStores,
  toggleFavoriStore,
  getLastTab,
  setLastTab,
} from './lib/preferences'
import { useGeolocation } from './lib/useGeolocation'

type Tab = 'today' | 'live' | 'search' | 'stores' | 'calendrier'

const useMock = (() => {
  if (typeof window === 'undefined') return false
  if (import.meta.env.VITE_USE_MOCK === 'true') return true
  return !isInTelegram()
})()

export default function App() {
  const [tab, setTab] = useState<Tab>(() => {
    const last = getLastTab()
    if (
      last === 'today' ||
      last === 'live' ||
      last === 'search' ||
      last === 'stores' ||
      last === 'calendrier'
    )
      return last as Tab
    return 'today'
  })

  const [status, setStatus] = useState<BotStatus | null>(null)
  const [stock, setStock] = useState<ProductWithStock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductWithStock | null>(null)
  const [selectedStoreEagid, setSelectedStoreEagid] = useState<string | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showPortfolio, setShowPortfolio] = useState(false)
  const [lastFetch, setLastFetch] = useState<number>(0)
  const [favoris, setFavoris] = useState<Set<string>>(() => getFavorisStores())
  const [portfolioVersion, setPortfolioVersion] = useState(0)

  const geo = useGeolocation(false)

  useEffect(() => {
    try {
      const seen = localStorage.getItem('pokealert_seen_intro')
      if (!seen) setShowOnboarding(true)
    } catch {}
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

  useEffect(() => {
    if (selectedProduct) {
      const updated = stock.find((p) => p.id === selectedProduct.id)
      if (updated) setSelectedProduct(updated)
    }
  }, [stock])

  const handleTabChange = (next: Tab) => {
    haptic('light')
    setTab(next)
    setLastTab(next)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const handleProductClick = (product: ProductWithStock) => {
    haptic('medium')
    setSelectedProduct(product)
  }

  const handleStoreClick = (eagid: string) => {
    haptic('medium')
    setSelectedStoreEagid(eagid)
  }

  const handleToggleFavori = (eagid: string) => {
    const updated = toggleFavoriStore(eagid)
    setFavoris(new Set(updated))
  }

  const handlePurchased = () => {
    setPortfolioVersion((v) => v + 1)
  }

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-foreground">
      <main className="flex-1 px-4 pt-3 pb-28 max-w-2xl w-full mx-auto">
        {error && !loading && <ErrorBanner message={error} onRetry={() => load()} />}

        <div key={tab} className="animate-page">
          {tab === 'today' && (
            <TodayPage
              onStoreClick={handleStoreClick}
              refreshing={refreshing}
              onRefresh={() => load(true)}
            />
          )}
          {tab === 'live' && (
            <HomeV2Page
              status={status}
              stock={stock}
              loading={loading}
              refreshing={refreshing}
              lastFetch={lastFetch}
              favoris={favoris}
              onToggleFavori={handleToggleFavori}
              onProductClick={handleProductClick}
              onRefresh={() => load(true)}
              userLat={geo.lat}
              userLng={geo.lng}
            />
          )}
          {tab === 'search' && (
            <SearchPage
              stock={stock}
              favoris={favoris}
              onProductClick={handleProductClick}
              userLat={geo.lat}
              userLng={geo.lng}
            />
          )}
          {tab === 'stores' && (
            <StoresPage
              stock={stock}
              favoris={favoris}
              onToggleFavori={handleToggleFavori}
              userLat={geo.lat}
              userLng={geo.lng}
              onRequestGeoloc={geo.request}
              onStoreClick={handleStoreClick}
            />
          )}
          {tab === 'calendrier' && <CalendrierPage />}
        </div>

        <div className="mt-8 px-1">
          <button
            onClick={() => {
              haptic('light')
              setShowPortfolio(true)
            }}
            className="w-full flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5 text-left hover:bg-card-hover active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-muted text-primary shrink-0">
                <Icon.Wallet className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-foreground">Mon portfolio</p>
                <p className="text-[11px] text-muted-foreground">Achats, marge réalisée, ROI</p>
              </div>
            </div>
            <Icon.ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
        </div>
      </main>

      <BottomNav current={tab} onChange={handleTabChange} refreshing={refreshing} />

      <ProductDetailSheet
        product={selectedProduct}
        favoris={favoris}
        userLat={geo.lat}
        userLng={geo.lng}
        onClose={() => setSelectedProduct(null)}
        onPurchased={handlePurchased}
      />

      <StoreDetailSheet eagid={selectedStoreEagid} onClose={() => setSelectedStoreEagid(null)} />

      {showPortfolio && (
        <div className="fixed inset-0 z-[100] bg-background overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-6">
            <button
              onClick={() => setShowPortfolio(false)}
              className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-card border border-border text-muted-foreground hover:text-foreground"
              aria-label="Fermer"
            >
              <Icon.X className="h-4 w-4" />
            </button>
            <PortfolioPage refreshKey={portfolioVersion} />
          </div>
        </div>
      )}

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
    { id: 'today', label: 'Aujourd\'hui', icon: Icon.Target },
    { id: 'live', label: 'Live', icon: Icon.Zap },
    { id: 'search', label: 'Chercher', icon: Icon.Search },
    { id: 'stores', label: 'Magasins', icon: Icon.Store },
    { id: 'calendrier', label: 'Calendrier', icon: Icon.Sparkles },
  ]

  return (
    <nav
      className={cn('fixed bottom-0 left-0 right-0 z-50', 'border-t border-border glass')}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {refreshing && (
        <div className="absolute top-0 left-0 right-0 h-0.5 overflow-hidden">
          <div
            className="h-full"
            style={{
              background: 'linear-gradient(90deg, transparent, var(--color-primary), transparent)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.4s linear infinite',
            }}
          />
        </div>
      )}

      <div className="max-w-2xl mx-auto px-2">
        <div className="grid grid-cols-5">
          {tabs.map((t) => {
            const isActive = current === t.id
            return (
              <button
                key={t.id}
                onClick={() => onChange(t.id)}
                className="relative flex flex-col items-center gap-0.5 py-3 transition-colors group"
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-primary rounded-full shadow-[0_0_8px_-1px_var(--color-primary-glow)]" />
                )}
                <t.icon
                  className={cn(
                    'h-[18px] w-[18px] transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                  )}
                />
                <span
                  className={cn(
                    'text-[9px] font-semibold tracking-tight transition-colors',
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
