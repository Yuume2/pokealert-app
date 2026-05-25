import { useState } from 'react'
import { Card, Eyebrow, Badge, Switch, Button } from './ui'
import { Icon } from './Icons'
import { api, type ProductWithStock } from '../lib/api'
import { haptic } from '../lib/telegram'
import { cn } from '../lib/cn'

interface Props {
  product: ProductWithStock
  autoScanCount: number
  onAutoScanChange?: (next: boolean) => void
}

interface ScanResult {
  total: number
  in_stock: number
  in_stock_favoris: number
  scanned_at: string
  stores: Array<{ eagid: string; magasin_short: string; favori: boolean; stock_label: string; in_stock: boolean; limited: boolean }>
}

const BUDGET_PER_DAY = 100
const HOURS_ACTIVE = 13
const SCANS_PER_HOUR = BUDGET_PER_DAY / HOURS_ACTIVE

export function AutoScanControls({ product, autoScanCount, onAutoScanChange }: Props) {
  const [autoScan, setAutoScan] = useState(product.auto_scan === true)
  const [toggleBusy, setToggleBusy] = useState(false)
  const [scanBusy, setScanBusy] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)

  const nextN = autoScan ? autoScanCount : autoScanCount + 1
  const projectedInterval = Math.max(2, Math.ceil((60 / SCANS_PER_HOUR) * nextN))
  const projectedDaily = Math.round((60 / projectedInterval) * nextN * HOURS_ACTIVE)
  const overBudget = projectedDaily > BUDGET_PER_DAY

  const handleToggle = async () => {
    if (toggleBusy) return
    haptic('medium')
    const next = !autoScan
    setAutoScan(next)
    setToggleBusy(true)
    try {
      await api.toggleAutoScan(product.id, next)
      onAutoScanChange?.(next)
    } catch {
      setAutoScan(!next)
      setScanError('Echec mise a jour')
      setTimeout(() => setScanError(null), 3000)
    } finally {
      setToggleBusy(false)
    }
  }

  const handleScanNow = async () => {
    if (scanBusy) return
    haptic('medium')
    setScanBusy(true)
    setScanError(null)
    setScanResult(null)
    try {
      const res = (await api.scanNow(product.prid)) as unknown as {
        success: boolean
        scanned_at: string
        total_magasins: number
        en_rayon_total: number
        en_rayon_favoris: number
        stores: ScanResult['stores']
      }
      if (!res.success) {
        setScanError('Echec du scan')
        setTimeout(() => setScanError(null), 4000)
        return
      }
      setScanResult({
        total: res.total_magasins,
        in_stock: res.en_rayon_total,
        in_stock_favoris: res.en_rayon_favoris,
        scanned_at: res.scanned_at,
        stores: res.stores,
      })
      setTimeout(() => setScanResult(null), 30_000)
    } catch (e) {
      setScanError(e instanceof Error ? e.message : 'Echec du scan')
      setTimeout(() => setScanError(null), 4000)
    } finally {
      setScanBusy(false)
    }
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Eyebrow>Surveillance</Eyebrow>
          <p className="mt-0.5 text-[13px] font-semibold text-foreground">
            Scan automatique
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {autoScan
              ? `Scan auto toutes les ~${projectedInterval} min · 9h-22h`
              : 'Active pour surveiller ce produit en continu'}
          </p>
        </div>
        <Switch checked={autoScan} onChange={handleToggle} />
      </div>

      {autoScan && (
        <div className="rounded-xl bg-card-hover border border-border p-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Budget Firecrawl
            </p>
            <p className="mt-0.5 text-[12px] font-bold text-foreground tabular-nums">
              {autoScanCount}{' '}
              <span className="font-normal text-muted-foreground">
                produit{autoScanCount > 1 ? 's' : ''} suivi{autoScanCount > 1 ? 's' : ''}
              </span>
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
              Quota estimé
            </p>
            <p
              className={cn(
                'mt-0.5 text-[12px] font-bold tabular-nums',
                projectedDaily > 80
                  ? 'text-destructive'
                  : projectedDaily > 60
                    ? 'text-warning'
                    : 'text-success',
              )}
            >
              {projectedDaily} / 100 par jour
            </p>
          </div>
        </div>
      )}

      {!autoScan && overBudget && (
        <div className="rounded-xl bg-destructive-muted border border-destructive/30 p-3">
          <p className="text-[11px] font-semibold text-destructive">
            Activer dépasserait le budget Firecrawl. La fréquence sera ralentie.
          </p>
        </div>
      )}

      <div className="border-t border-border pt-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <Eyebrow>Scan manuel</Eyebrow>
          {scanResult && (
            <span className="text-[10px] tabular-nums text-muted-foreground">
              MAJ {new Date(scanResult.scanned_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        <Button
          variant={scanResult && scanResult.in_stock > 0 ? 'primary' : 'secondary'}
          size="md"
          className="w-full"
          onClick={handleScanNow}
          disabled={scanBusy}
        >
          {scanBusy ? (
            <>
              <Icon.RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Scan en cours…
            </>
          ) : scanResult ? (
            <>
              <Icon.Check className="h-3.5 w-3.5" />
              {scanResult.in_stock > 0
                ? `${scanResult.in_stock} magasin${scanResult.in_stock > 1 ? 's' : ''} en rayon`
                : 'Aucun magasin en rayon'}
            </>
          ) : (
            <>
              <Icon.Zap className="h-3.5 w-3.5" />
              Scanner maintenant
            </>
          )}
        </Button>

        {scanError && (
          <p className="text-[11px] text-destructive font-semibold text-center">
            {scanError}
          </p>
        )}

        {scanResult && scanResult.stores.length > 0 && (
          <div className="grid grid-cols-2 gap-1.5">
            {scanResult.stores
              .filter((s) => s.in_stock)
              .slice(0, 6)
              .map((s) => (
                <div
                  key={s.eagid}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1.5 rounded-lg border',
                    s.favori
                      ? 'border-success/30 bg-success-muted'
                      : 'border-border bg-card',
                  )}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full shrink-0"
                    style={{
                      background: s.favori ? 'var(--color-success)' : 'var(--color-foreground)',
                      boxShadow: s.favori ? '0 0 6px var(--color-success-glow)' : 'none',
                    }}
                  />
                  <span className="text-[11px] font-semibold text-foreground truncate">
                    {s.magasin_short}
                  </span>
                  {s.limited && (
                    <Badge variant="warning" className="ml-auto !px-1 !py-0 !text-[8px]">
                      Lim
                    </Badge>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </Card>
  )
}
