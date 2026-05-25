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

const BUDGET_PER_DAY = 100
const HOURS_ACTIVE = 13
const SCANS_PER_HOUR = BUDGET_PER_DAY / HOURS_ACTIVE

export function AutoScanControls({ product, autoScanCount, onAutoScanChange }: Props) {
  const [autoScan, setAutoScan] = useState(product.auto_scan === true)
  const [toggleBusy, setToggleBusy] = useState(false)
  const [scanBusy, setScanBusy] = useState(false)
  const [scanResult, setScanResult] = useState<{
    in_stock: number
    total: number
    at: string
  } | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)

  const nextN = autoScan ? autoScanCount : autoScanCount + 1
  const projectedInterval = Math.max(2, Math.ceil((60 / SCANS_PER_HOUR) * nextN))
  const overBudget = nextN > 0 && (60 / projectedInterval) * nextN * HOURS_ACTIVE > BUDGET_PER_DAY

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
    } finally {
      setToggleBusy(false)
    }
  }

  const handleScanNow = async () => {
    if (scanBusy) return
    haptic('medium')
    setScanBusy(true)
    setScanError(null)
    try {
      const res = await api.scanNow(product.prid)
      const inStock = res.stocks.filter(
        (s) =>
          s.stock_label === 'En rayon' || s.stock_label === 'En rayon- Quantité limitée',
      ).length
      setScanResult({ in_stock: inStock, total: res.stocks.length, at: res.scanned_at })
      setTimeout(() => setScanResult(null), 8000)
    } catch (e) {
      setScanError(e instanceof Error ? e.message : 'Échec du scan')
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
              ? `Scan toutes les ~${projectedInterval} min · 9h-22h`
              : 'Hors scan auto, scan manuel à la demande'}
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
                produit{autoScanCount > 1 ? 's' : ''} auto
              </span>
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
              Estim. quota
            </p>
            <p
              className={cn(
                'mt-0.5 text-[12px] font-bold tabular-nums',
                overBudget ? 'text-destructive' : 'text-success',
              )}
            >
              {Math.round((60 / projectedInterval) * autoScanCount * HOURS_ACTIVE)}/100 par jour
            </p>
          </div>
        </div>
      )}

      {!autoScan && overBudget && (
        <div className="rounded-xl bg-destructive-muted border border-destructive/30 p-3">
          <p className="text-[11px] font-semibold text-destructive">
            ⚠ Activer dépasserait le budget Firecrawl (100/jour). La fréquence sera ralentie automatiquement.
          </p>
        </div>
      )}

      <div className="border-t border-border pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <Eyebrow>Scan manuel</Eyebrow>
          {scanResult && (
            <Badge variant={scanResult.in_stock > 0 ? 'success' : 'default'}>
              {scanResult.in_stock} / {scanResult.total} en rayon
            </Badge>
          )}
        </div>
        <Button
          variant="secondary"
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
          ) : (
            <>
              <Icon.Zap className="h-3.5 w-3.5" />
              Scanner ce produit maintenant
            </>
          )}
        </Button>
        {scanError && (
          <p className="text-[11px] text-destructive font-semibold">{scanError}</p>
        )}
        {scanResult && (
          <p className="text-[10px] text-muted-foreground">
            Scanné à {new Date(scanResult.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · Données rafraîchies
          </p>
        )}
      </div>
    </Card>
  )
}
