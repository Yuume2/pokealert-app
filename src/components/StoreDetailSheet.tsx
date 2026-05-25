import { useEffect, useState } from 'react'
import { Sheet } from './Sheet'
import { Eyebrow, Badge, Button, Card, Skeleton } from './ui'
import { Icon } from './Icons'
import { cn } from '../lib/cn'
import { haptic, openExternal } from '../lib/telegram'
import { api, type StoreDetail } from '../lib/api'
import { isInTelegram } from '../lib/telegram'
import { formatRelativeLong } from '../lib/useLiveTime'

interface Props {
  eagid: string | null
  onClose: () => void
}

const useMock = !isInTelegram() || import.meta.env.VITE_USE_MOCK === 'true'

export function StoreDetailSheet({ eagid, onClose }: Props) {
  const [data, setData] = useState<StoreDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!eagid) {
      setData(null)
      return
    }
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        if (useMock) {
          await new Promise((r) => setTimeout(r, 200))
          if (cancelled) return
          setData(buildMockStore(eagid!))
        } else {
          const d = await api.store(eagid!)
          if (cancelled) return
          setData(d)
        }
      } catch {
        if (!cancelled) setData(buildMockStore(eagid!))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [eagid])

  return (
    <Sheet open={!!eagid} onClose={onClose} title={data?.store.short}>
      {loading ? (
        <div className="px-5 pb-8 space-y-4">
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[80px]" />
          <Skeleton className="h-[140px]" />
        </div>
      ) : !data ? null : (
        <Content data={data} />
      )}
    </Sheet>
  )
}

function Content({ data }: { data: StoreDetail }) {
  return (
    <div className="px-5 pb-8 space-y-5">
      <StoreHeader store={data.store} />
      <ActionsBar store={data.store} />
      <StatsRow stats={data.stats} />
      <RestockPattern pattern={data.store.restock_pattern} />
      <EnRayonSection items={data.en_rayon} />
      <HistoriqueSection items={data.historique} />
      <InfosPratiques store={data.store} />
    </div>
  )
}

function StoreHeader({ store }: { store: StoreDetail['store'] }) {
  return (
    <div className="space-y-1.5">
      <Eyebrow>Magasin</Eyebrow>
      <h2 className="text-[1.75rem] font-bold tracking-[-0.02em] leading-[1.05] text-foreground">
        {store.short}
      </h2>
      <p className="text-[12px] text-muted-foreground">
        {store.adresse} · {store.zip}
      </p>
    </div>
  )
}

function ActionsBar({ store }: { store: StoreDetail['store'] }) {
  const handleMaps = () => {
    haptic('medium')
    openExternal(store.mapsUrl)
  }
  const handleCall = () => {
    haptic('light')
    openExternal(`tel:${store.tel.replace(/\s/g, '')}`)
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button variant="primary" size="md" onClick={handleMaps}>
        <Icon.Navigation className="h-4 w-4" />
        Itinéraire
      </Button>
      <Button variant="secondary" size="md" onClick={handleCall}>
        <Icon.AlertCircle className="h-4 w-4" />
        Appeler
      </Button>
    </div>
  )
}

function StatsRow({ stats }: { stats: StoreDetail['stats'] }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Card className="p-3 text-center">
        <p className="text-[1.5rem] font-bold tabular-nums text-foreground">
          {stats.en_rayon_actuel}
        </p>
        <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-muted-foreground font-semibold">
          En rayon
        </p>
      </Card>
      <Card className="p-3 text-center">
        <p className="text-[1.5rem] font-bold tabular-nums text-foreground">
          {stats.changements_7j}
        </p>
        <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-muted-foreground font-semibold">
          Activité 7j
        </p>
      </Card>
      <Card className="p-3 text-center">
        <p className="text-[1.5rem] font-bold tabular-nums text-foreground">
          {stats.total_produits_tracked}
        </p>
        <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-muted-foreground font-semibold">
          Suivis
        </p>
      </Card>
    </div>
  )
}

function RestockPattern({ pattern }: { pattern: StoreDetail['store']['restock_pattern'] }) {
  return (
    <Card className="p-4 border-primary-border bg-primary-muted/20">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-muted text-primary shrink-0">
          <Icon.Clock className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <Eyebrow>Pattern restock</Eyebrow>
          <p className="mt-1 text-[13px] font-semibold text-foreground">
            {pattern.days.join(' · ')}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
            Plage horaire : {pattern.heure}
          </p>
          <p className="text-[10px] text-subtle-foreground mt-2 italic">
            {pattern.note}
          </p>
        </div>
      </div>
    </Card>
  )
}

function EnRayonSection({ items }: { items: StoreDetail['en_rayon'] }) {
  if (items.length === 0) {
    return (
      <section className="space-y-3">
        <div className="px-1">
          <Eyebrow>En rayon maintenant</Eyebrow>
          <h3 className="mt-0.5 text-base font-semibold text-foreground">Rien actuellement</h3>
        </div>
        <Card className="p-4 text-center">
          <Icon.Clock className="mx-auto h-5 w-5 text-muted-foreground mb-2" />
          <p className="text-[12px] text-muted-foreground">
            Aucun produit Pokémon suivi n'est en rayon dans ce magasin.
          </p>
        </Card>
      </section>
    )
  }

  return (
    <section className="space-y-3">
      <div className="px-1">
        <Eyebrow>En rayon maintenant</Eyebrow>
        <h3 className="mt-0.5 text-base font-semibold text-foreground">
          {items.length} produit{items.length > 1 ? 's' : ''} disponible{items.length > 1 ? 's' : ''}
        </h3>
      </div>
      <div className="space-y-2">
        {items.map((p) => (
          <Card key={p.prid} className="p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {p.type_produit}
                  </span>
                  {p.stock_label.includes('limitée') && (
                    <Badge variant="warning">Limité</Badge>
                  )}
                </div>
                <p className="mt-0.5 text-[13px] font-semibold text-foreground truncate">
                  {cleanName(p.produit_nom)}
                </p>
              </div>
              <span className="text-base font-bold tabular-nums text-foreground shrink-0">
                {Math.round(p.prix_fnac)}€
              </span>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}

function HistoriqueSection({ items }: { items: StoreDetail['historique'] }) {
  if (items.length === 0) {
    return (
      <section className="space-y-3">
        <div className="px-1">
          <Eyebrow>Activité 7 derniers jours</Eyebrow>
          <h3 className="mt-0.5 text-base font-semibold text-foreground">Pas d'historique</h3>
        </div>
        <Card className="p-4 text-center">
          <p className="text-[12px] text-muted-foreground">
            Le bot va observer ce magasin. Reviens dans quelques jours pour voir les patterns.
          </p>
        </Card>
      </section>
    )
  }

  return (
    <section className="space-y-3">
      <div className="px-1">
        <Eyebrow>Activité 7 derniers jours</Eyebrow>
        <h3 className="mt-0.5 text-base font-semibold text-foreground">
          {items.length} événement{items.length > 1 ? 's' : ''}
        </h3>
      </div>
      <Card className="overflow-hidden">
        {items.map((h, i) => (
          <div
            key={h.prid + i}
            className={cn(
              'flex items-center justify-between gap-3 px-4 py-3',
              i > 0 && 'border-t border-border',
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={cn(
                  'h-2 w-2 rounded-full shrink-0',
                  h.currently_in_stock ? 'bg-success' : 'bg-subtle-foreground',
                )}
              />
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-foreground truncate">
                  {cleanName(h.produit_nom)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {h.currently_in_stock ? 'En rayon' : 'Hors rayon'} · {formatRelativeLong(h.last_check)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </Card>
    </section>
  )
}

function InfosPratiques({ store }: { store: StoreDetail['store'] }) {
  return (
    <Card className="p-4">
      <Eyebrow>Infos pratiques</Eyebrow>
      <div className="mt-3 space-y-2 text-[12px]">
        <Row label="Horaires" value={store.horaires} />
        <Row label="Téléphone" value={store.tel} mono />
        <Row label="Adresse" value={`${store.adresse} ${store.zip}`} />
      </div>
    </Card>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={cn('text-foreground font-medium text-right', mono && 'font-mono')}>
        {value}
      </span>
    </div>
  )
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

function buildMockStore(eagid: string): StoreDetail {
  return {
    generated_at: new Date().toISOString(),
    store: {
      eagid,
      nom: 'FNAC La Défense-CNIT',
      short: 'CNIT',
      adresse: '2, place de La Défense, CNIT',
      zip: '92053',
      tel: '0825 020 020',
      horaires: 'Lun-Sam 10h-20h, Dim 10h-19h',
      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=48.8917859,2.2404863',
      restock_pattern: {
        days: ['Mardi', 'Jeudi', 'Vendredi'],
        heure: '9h-11h',
        note: 'Pattern par défaut.',
      },
    },
    en_rayon: [],
    historique: [],
    stats: { total_produits_tracked: 0, en_rayon_actuel: 0, changements_7j: 0 },
  }
}
