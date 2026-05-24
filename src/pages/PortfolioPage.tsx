import { useEffect, useState } from 'react'
import { Card, Eyebrow, EmptyState, Stat, Button, Badge } from '../components/ui'
import { Icon } from '../components/Icons'
import { haptic } from '../lib/telegram'
import { getPortfolio, removePurchase, updatePurchase, type Purchase } from '../lib/preferences'
import { cn } from '../lib/cn'
import { Sheet } from '../components/Sheet'

interface Props {
  refreshKey: number
}

export function PortfolioPage({ refreshKey }: Props) {
  const [purchases, setPurchases] = useState<Purchase[]>(() => getPortfolio())
  const [editing, setEditing] = useState<Purchase | null>(null)

  useEffect(() => {
    setPurchases(getPortfolio())
  }, [refreshKey])

  const reload = () => setPurchases(getPortfolio())

  const totalAchats = purchases.reduce((s, p) => s + p.prix_achat, 0)
  const revendues = purchases.filter((p) => p.prix_revente != null)
  const totalRevente = revendues.reduce((s, p) => s + (p.prix_revente ?? 0), 0)
  const totalCoutRevendu = revendues.reduce((s, p) => s + p.prix_achat, 0)
  const margeBrute = totalRevente - totalCoutRevendu
  const roi = totalCoutRevendu > 0 ? (margeBrute / totalCoutRevendu) * 100 : 0

  return (
    <div className="space-y-5">
      <header className="pt-3 pb-1">
        <Eyebrow>Portfolio</Eyebrow>
        <h1 className="mt-1 text-[2rem] font-bold tracking-[-0.03em] leading-[1.1] text-foreground">
          Mes <em className="not-italic text-primary">achats</em>.
        </h1>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Track tes achats, calcule ta marge quand tu revends.
        </p>
      </header>

      {purchases.length === 0 ? (
        <EmptyState
          title="Portfolio vide"
          description="Quand tu achètes un produit, tape sur 'J'ai pris' depuis sa fiche. Je tracke prix, magasin, date — et ta marge à la revente."
          icon={Icon.Wallet}
        />
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-2">
            <Stat value={purchases.length} label="Achats" />
            <Stat
              value={`${Math.round(totalAchats)}€`}
              label="Investi"
            />
            <Stat
              value={revendues.length > 0 ? `${margeBrute >= 0 ? '+' : ''}${Math.round(margeBrute)}€` : '—'}
              label="Marge"
              accent={margeBrute > 0}
            />
          </div>

          {revendues.length > 0 && (
            <Card className="p-4 flex items-center justify-between">
              <div>
                <Eyebrow>ROI moyen</Eyebrow>
                <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                  {roi >= 0 ? '+' : ''}
                  {roi.toFixed(1)}%
                </p>
              </div>
              <Badge variant={roi > 0 ? 'success' : roi < 0 ? 'destructive' : 'default'}>
                {revendues.length} vente{revendues.length > 1 ? 's' : ''}
              </Badge>
            </Card>
          )}

          <section className="space-y-2">
            <Eyebrow className="px-1">Historique</Eyebrow>
            {purchases.map((p) => (
              <PurchaseCard
                key={p.id}
                purchase={p}
                onEdit={() => {
                  haptic('light')
                  setEditing(p)
                }}
              />
            ))}
          </section>
        </>
      )}

      <EditPurchaseSheet
        purchase={editing}
        onClose={() => setEditing(null)}
        onSave={(patch) => {
          if (!editing) return
          updatePurchase(editing.id, patch)
          reload()
          setEditing(null)
        }}
        onDelete={() => {
          if (!editing) return
          removePurchase(editing.id)
          reload()
          setEditing(null)
        }}
      />
    </div>
  )
}

function PurchaseCard({ purchase, onEdit }: { purchase: Purchase; onEdit: () => void }) {
  const TypeIcon =
    purchase.type_produit === 'ETB'
      ? Icon.Box
      : purchase.type_produit === 'Bundle'
        ? Icon.Package
        : Icon.LayoutGrid

  const isRevendu = purchase.prix_revente != null
  const margeUnitaire = isRevendu ? (purchase.prix_revente ?? 0) - purchase.prix_achat : null
  const date = new Date(purchase.date)

  return (
    <Card interactive onClick={onEdit} className="p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card-hover text-muted-foreground border border-border shrink-0">
            <TypeIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {purchase.type_produit}
              </span>
              <span className="text-subtle-foreground">·</span>
              <span className="text-[11px] text-muted-foreground">
                {date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
              </span>
            </div>
            <p className="text-[13px] font-semibold text-foreground truncate mt-0.5">
              {purchase.produit_nom}
            </p>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              <Icon.MapPin className="inline h-2.5 w-2.5 mr-0.5" />
              {purchase.magasin}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          {isRevendu ? (
            <>
              <p
                className={cn(
                  'text-[14px] font-bold tabular-nums',
                  (margeUnitaire ?? 0) > 0 ? 'text-success' : (margeUnitaire ?? 0) < 0 ? 'text-destructive' : 'text-foreground',
                )}
              >
                {(margeUnitaire ?? 0) >= 0 ? '+' : ''}
                {Math.round(margeUnitaire ?? 0)}€
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">
                {Math.round(purchase.prix_achat)}€ → {Math.round(purchase.prix_revente ?? 0)}€
              </p>
            </>
          ) : (
            <>
              <p className="text-[14px] font-bold tabular-nums text-foreground">
                {Math.round(purchase.prix_achat)}€
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">en stock</p>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}

function EditPurchaseSheet({
  purchase,
  onClose,
  onSave,
  onDelete,
}: {
  purchase: Purchase | null
  onClose: () => void
  onSave: (patch: Partial<Purchase>) => void
  onDelete: () => void
}) {
  const [reventePrix, setReventePrix] = useState('')

  return (
    <Sheet open={!!purchase} onClose={onClose} title={purchase ? 'Détail achat' : ''}>
      {purchase && (
        <div className="px-5 pb-8 space-y-5">
          {/* Récap */}
          <Card className="p-4">
            <Eyebrow>Produit</Eyebrow>
            <p className="text-[15px] font-semibold text-foreground mt-1">
              {purchase.produit_nom}
            </p>
            <p className="text-[12px] text-muted-foreground mt-1">
              {purchase.type_produit} · {purchase.magasin}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <Eyebrow>Prix achat</Eyebrow>
                <p className="text-lg font-bold tabular-nums text-foreground mt-0.5">
                  {Math.round(purchase.prix_achat)}€
                </p>
              </div>
              <div>
                <Eyebrow>Date</Eyebrow>
                <p className="text-sm font-medium text-foreground mt-0.5">
                  {new Date(purchase.date).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </Card>

          {/* Revente */}
          {purchase.prix_revente == null ? (
            <Card className="p-4 space-y-3">
              <Eyebrow>Marquer comme revendu</Eyebrow>
              <p className="text-[12px] text-muted-foreground">
                Indique le prix de revente pour calculer ta marge réelle.
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  value={reventePrix}
                  onChange={(e) => setReventePrix(e.target.value)}
                  placeholder={`ex: ${Math.round(purchase.prix_achat * 1.4)}`}
                  className="flex-1 h-11 px-4 rounded-xl bg-card border border-border text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-border"
                />
                <Button
                  size="md"
                  onClick={() => {
                    const v = parseFloat(reventePrix)
                    if (isNaN(v) || v <= 0) return
                    onSave({
                      prix_revente: v,
                      date_revente: new Date().toISOString(),
                    })
                  }}
                  disabled={!reventePrix || parseFloat(reventePrix) <= 0}
                >
                  Valider
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-4">
              <Eyebrow>Revendu</Eyebrow>
              <div className="mt-2 flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold tabular-nums text-foreground">
                    {Math.round(purchase.prix_revente)}€
                  </p>
                  {purchase.date_revente && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      le {new Date(purchase.date_revente).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
                <Badge
                  variant={
                    purchase.prix_revente - purchase.prix_achat > 0 ? 'success' : 'destructive'
                  }
                >
                  {purchase.prix_revente - purchase.prix_achat >= 0 ? '+' : ''}
                  {Math.round(purchase.prix_revente - purchase.prix_achat)}€ ·{' '}
                  {(
                    ((purchase.prix_revente - purchase.prix_achat) / purchase.prix_achat) *
                    100
                  ).toFixed(0)}
                  %
                </Badge>
              </div>
            </Card>
          )}

          <Button variant="destructive" className="w-full" size="md" onClick={onDelete}>
            <Icon.X className="h-3.5 w-3.5" />
            Supprimer cet achat
          </Button>
        </div>
      )}
    </Sheet>
  )
}
