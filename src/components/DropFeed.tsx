import { useEffect, useState } from 'react'
import { Card, Eyebrow } from './ui'
import { Icon } from './Icons'
import { api, type ProductWithStock } from '../lib/api'
import { isInTelegram } from '../lib/telegram'
import { useLiveTime, formatRelativeShort } from '../lib/useLiveTime'
import { cn } from '../lib/cn'

interface FeedItem {
  id: string
  type: 'live' | 'limited' | 'check'
  produit_nom: string
  type_produit: string
  magasin_short: string
  prix: number
  timestamp: string
}

const useMock = !isInTelegram() || import.meta.env.VITE_USE_MOCK === 'true'

/**
 * DropFeed live - widget style trading floor.
 * Affiche en temps réel les produits actuellement en rayon avec ticker animé.
 */
export function DropFeed() {
  useLiveTime(30_000)
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        if (useMock) {
          await new Promise((r) => setTimeout(r, 200))
          if (cancelled) return
          setItems(buildMockFeed())
        } else {
          const stock = await api.stock()
          if (cancelled) return
          setItems(stockToFeed(stock))
        }
      } catch {
        if (!cancelled) setItems(buildMockFeed())
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    const interval = setInterval(load, 60_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  if (loading) return null
  if (items.length === 0) return null

  return (
    <section className="space-y-3 stagger-3">
      <div className="px-1 flex items-center justify-between">
        <div>
          <Eyebrow>Live feed</Eyebrow>
          <h2 className="mt-0.5 text-lg font-bold tracking-tight text-foreground">
            En rayon maintenant
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-75" />
            <span className="relative h-2 w-2 rounded-full bg-success shadow-[0_0_8px_var(--color-success-glow)]" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-success">
            Live
          </span>
        </div>
      </div>

      {/* Compact ticker style */}
      <Card className="overflow-hidden noise">
        {items.slice(0, 6).map((item, i) => (
          <FeedRow key={item.id} item={item} isFirst={i === 0} />
        ))}
      </Card>

      {items.length > 6 && (
        <p className="text-center text-[11px] text-muted-foreground tabular-nums">
          + {items.length - 6} autres en rayon
        </p>
      )}
    </section>
  )
}

function FeedRow({ item, isFirst }: { item: FeedItem; isFirst: boolean }) {
  const TypeIcon =
    item.type_produit === 'ETB'
      ? Icon.Box
      : item.type_produit === 'Bundle'
        ? Icon.Package
        : Icon.LayoutGrid

  const accentColor =
    item.type === 'live'
      ? 'var(--color-success)'
      : item.type === 'limited'
        ? 'var(--color-warning)'
        : 'var(--color-muted-foreground)'

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-4 py-3',
        !isFirst && 'border-t border-border',
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Status dot animated */}
        <div className="relative shrink-0">
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-60"
            style={{ background: accentColor }}
          />
          <span
            className="relative block h-2 w-2 rounded-full"
            style={{ background: accentColor, boxShadow: `0 0 8px ${accentColor}` }}
          />
        </div>

        {/* Type icon */}
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
          style={{
            background: `${accentColor}1A`,
            color: accentColor,
          }}
        >
          <TypeIcon className="h-3.5 w-3.5" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {item.type_produit}
            </span>
            <span className="text-subtle-foreground">·</span>
            <span className="text-[10px] font-semibold text-foreground truncate">
              {item.magasin_short}
            </span>
            {item.type === 'limited' && (
              <span className="text-[9px] uppercase font-bold tracking-[0.1em] text-warning">
                Limité
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[12px] font-semibold text-foreground truncate">
            {cleanName(item.produit_nom)}
          </p>
        </div>
      </div>

      {/* Prix + temps */}
      <div className="text-right shrink-0">
        <p className="text-[13px] font-bold tabular-nums text-foreground">
          {Math.round(item.prix)}€
        </p>
        <p className="text-[9px] text-subtle-foreground tabular-nums">
          {formatRelativeShort(item.timestamp)}
        </p>
      </div>
    </div>
  )
}

function stockToFeed(stock: ProductWithStock[]): FeedItem[] {
  const items: FeedItem[] = []
  const stores = {
    '171': 'CNIT',
    '17': 'Forum',
    '4': 'Montparnasse',
    '336': 'Beaugrenelle',
    '42': 'Ternes',
    '21': 'Saint-Lazare',
    '45': 'Boulogne',
    '20': 'Parly 2',
    '32': 'Vélizy',
  } as Record<string, string>

  for (const p of stock) {
    for (const s of p.stocks) {
      const inStock =
        s.stock_label === 'En rayon' || s.stock_label === 'En rayon- Quantité limitée'
      if (!inStock) continue
      items.push({
        id: `${p.prid}-${s.eagid}`,
        type: s.stock_label.includes('limitée') ? 'limited' : 'live',
        produit_nom: p.nom,
        type_produit: p.type_produit,
        magasin_short: stores[s.eagid] ?? s.magasin_nom.replace('FNAC ', ''),
        prix: p.prix_fnac,
        timestamp: s.last_check,
      })
    }
  }

  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  return items
}

function cleanName(name: string): string {
  return name
    .replace(/^(Carte|Cartes) à collectionner Pokémon\s*/i, '')
    .replace(/^Pokémon\s+/i, '')
    .replace(/Coffret Dresseur d'Élite/, 'Coffret Élite')
    .replace(/Bundle 6 boosters/, 'Bundle')
    .replace(/Pack 3 boosters/, 'Pack 3')
    .trim()
}

function buildMockFeed(): FeedItem[] {
  return [
    { id: 'mock-1', type: 'live', produit_nom: "ME04 Coffret Dresseur d'Élite", type_produit: 'ETB', magasin_short: 'CNIT', prix: 55.99, timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
    { id: 'mock-2', type: 'live', produit_nom: 'ME04 Bundle 6 boosters', type_produit: 'Bundle', magasin_short: 'CNIT', prix: 35.99, timestamp: new Date(Date.now() - 12 * 60000).toISOString() },
    { id: 'mock-3', type: 'limited', produit_nom: 'Q126 Bundle 6 boosters', type_produit: 'Bundle', magasin_short: 'Forum', prix: 35.99, timestamp: new Date(Date.now() - 30 * 60000).toISOString() },
  ]
}
