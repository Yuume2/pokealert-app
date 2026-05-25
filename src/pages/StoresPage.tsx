import { useMemo } from 'react'
import { Card, Eyebrow, Badge } from '../components/ui'
import { Icon } from '../components/Icons'
import { StarToggle } from '../components/StarToggle'
import { haptic, openExternal } from '../lib/telegram'
import { rankStores, formatDistance } from '../lib/stores'
import type { ProductWithStock } from '../lib/api'
import { cn } from '../lib/cn'

interface Props {
  stock: ProductWithStock[]
  favoris: Set<string>
  onToggleFavori: (eagid: string) => void
  userLat?: number
  userLng?: number
  onRequestGeoloc: () => void
  onStoreClick: (eagid: string) => void
}

export function StoresPage({
  stock,
  favoris,
  onToggleFavori,
  userLat,
  userLng,
  onRequestGeoloc,
  onStoreClick,
}: Props) {
  /** Map eagid → nombre de produits en rayon */
  const stockCountByStore = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of stock) {
      for (const s of p.stocks) {
        if (
          s.stock_label === 'En rayon' ||
          s.stock_label === 'En rayon- Quantité limitée'
        ) {
          m.set(s.eagid, (m.get(s.eagid) ?? 0) + 1)
        }
      }
    }
    return m
  }, [stock])

  const ranked = useMemo(
    () => rankStores(favoris, userLat, userLng),
    [favoris, userLat, userLng],
  )

  const favStores = ranked.filter((s) => s.isFavori)
  const otherStores = ranked.filter((s) => !s.isFavori)

  const totalInStock = Array.from(stockCountByStore.values()).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-5">
      <header className="pt-1 pb-1">
        <Eyebrow>Magasins</Eyebrow>
        <h1 className="mt-0.5 text-[1.75rem] font-bold tracking-[-0.02em] text-foreground">
          FNAC Paris · IDF
        </h1>
        <p className="mt-1 text-[12px] text-muted-foreground">
          {favStores.length} favoris · {totalInStock} produits en rayon au total
        </p>
      </header>

      {userLat == null && (
        <button
          onClick={onRequestGeoloc}
          className="w-full flex items-center justify-between gap-3 rounded-2xl border border-primary-border bg-primary-muted p-4 text-left hover:bg-primary-muted/80 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shrink-0">
              <Icon.Compass className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Activer la géoloc</p>
              <p className="text-[11px] text-muted-foreground">
                Pour trier les magasins par distance réelle
              </p>
            </div>
          </div>
          <Icon.ArrowRight className="h-4 w-4 text-primary shrink-0" />
        </button>
      )}

      {/* Favoris */}
      <Section
        eyebrow="Favoris"
        title={favStores.length === 0 ? 'Aucun favori' : `${favStores.length} favori${favStores.length > 1 ? 's' : ''}`}
      >
        {favStores.length === 0 ? (
          <Card className="p-5 text-center">
            <Icon.Star className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-[13px] font-medium text-foreground">
              Tu n'as marqué aucun magasin favori
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Tape sur l'étoile d'un magasin ci-dessous pour commencer.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {favStores.map((s) => (
              <StoreRow
                key={s.eagid}
                eagid={s.eagid}
                nom={s.short}
                fullNom={s.nom}
                zip={s.zip}
                isFavori={true}
                distance={s.distanceKm}
                stockCount={stockCountByStore.get(s.eagid) ?? 0}
                mapsUrl={s.mapsUrl}
                onToggleFavori={onToggleFavori}
                onClick={() => onStoreClick(s.eagid)}
              />
            ))}
          </div>
        )}
      </Section>

      {/* Tous les autres */}
      <Section
        eyebrow="Tous"
        title="Autres magasins"
      >
        <div className="space-y-2">
          {otherStores.map((s) => (
            <StoreRow
              key={s.eagid}
              eagid={s.eagid}
              nom={s.short}
              fullNom={s.nom}
              zip={s.zip}
              isFavori={false}
              distance={s.distanceKm}
              stockCount={stockCountByStore.get(s.eagid) ?? 0}
              mapsUrl={s.mapsUrl}
              onToggleFavori={onToggleFavori}
              onClick={() => onStoreClick(s.eagid)}
            />
          ))}
        </div>
      </Section>
    </div>
  )
}

function Section({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <div className="px-1">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="text-lg font-semibold tracking-tight text-foreground mt-0.5">{title}</h2>
        {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

function StoreRow({
  nom,
  fullNom,
  zip,
  isFavori,
  distance,
  stockCount,
  mapsUrl,
  eagid,
  onToggleFavori,
  onClick,
}: {
  eagid: string
  nom: string
  fullNom: string
  zip: string
  isFavori: boolean
  distance?: number
  stockCount: number
  mapsUrl: string
  onToggleFavori: (eagid: string) => void
  onClick: () => void
}) {
  const handleMaps = (e: React.MouseEvent) => {
    e.stopPropagation()
    haptic('light')
    openExternal(mapsUrl)
  }

  return (
    <Card
      interactive
      onClick={onClick}
      className={cn('p-3.5', isFavori && 'border-primary-border bg-primary-muted/30')}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-semibold text-foreground truncate">{nom}</p>
            {stockCount > 0 && (
              <Badge variant="success">
                <Icon.Zap className="h-2.5 w-2.5" fill="currentColor" strokeWidth={0} />
                {stockCount}
              </Badge>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground flex-wrap">
            <span className="font-mono tabular-nums">{zip}</span>
            {distance != null && (
              <>
                <span className="text-subtle-foreground">·</span>
                <span className="tabular-nums">{formatDistance(distance)}</span>
              </>
            )}
            {fullNom !== nom && (
              <>
                <span className="text-subtle-foreground">·</span>
                <span className="truncate">{fullNom.replace(/^FNAC\s+/, '')}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleMaps}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-card-hover active:scale-90 transition-all"
            aria-label="Itinéraire"
          >
            <Icon.Navigation className="h-3.5 w-3.5" />
          </button>
          <StarToggle active={isFavori} onToggle={() => onToggleFavori(eagid)} />
        </div>
      </div>
    </Card>
  )
}
