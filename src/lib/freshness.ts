/**
 * Freshness scoring : exprime la confiance qu'on a sur l'état "en rayon" actuel
 * en fonction du temps écoulé depuis la dernière vérification.
 *
 * Logique :
 * - < 5 min  : 95% (cristal frais)
 * - < 15 min : 85% (frais)
 * - < 30 min : 70% (encore correct)
 * - < 1h     : 50% (à vérifier)
 * - < 2h     : 30% (douteux)
 * - > 2h     : 15% (probablement périmé)
 */

export type FreshnessLevel = 'fresh' | 'recent' | 'stale' | 'expired'

export interface FreshnessInfo {
  ageMinutes: number
  confidence: number
  level: FreshnessLevel
  label: string
  shortLabel: string
  colorVar: string
  warning: string | null
}

export function computeFreshness(lastCheckIso?: string | null): FreshnessInfo {
  if (!lastCheckIso) {
    return {
      ageMinutes: -1,
      confidence: 0,
      level: 'expired',
      label: 'Pas de donnée',
      shortLabel: '—',
      colorVar: 'var(--color-subtle-foreground)',
      warning: 'Aucune vérification récente',
    }
  }

  const ageMs = Date.now() - new Date(lastCheckIso).getTime()
  const ageMinutes = Math.round(ageMs / 60000)

  if (ageMinutes < 0) {
    return {
      ageMinutes: 0,
      confidence: 95,
      level: 'fresh',
      label: "À l'instant",
      shortLabel: '<1m',
      colorVar: 'var(--color-success)',
      warning: null,
    }
  }

  if (ageMinutes < 5) {
    return {
      ageMinutes,
      confidence: 95,
      level: 'fresh',
      label: `Vu il y a ${ageMinutes}min`,
      shortLabel: `${ageMinutes}m`,
      colorVar: 'var(--color-success)',
      warning: null,
    }
  }

  if (ageMinutes < 15) {
    return {
      ageMinutes,
      confidence: 85,
      level: 'fresh',
      label: `Vu il y a ${ageMinutes}min`,
      shortLabel: `${ageMinutes}m`,
      colorVar: 'var(--color-success)',
      warning: null,
    }
  }

  if (ageMinutes < 30) {
    return {
      ageMinutes,
      confidence: 70,
      level: 'recent',
      label: `Vu il y a ${ageMinutes}min`,
      shortLabel: `${ageMinutes}m`,
      colorVar: 'var(--color-warning)',
      warning: null,
    }
  }

  if (ageMinutes < 60) {
    return {
      ageMinutes,
      confidence: 50,
      level: 'recent',
      label: `Vu il y a ${ageMinutes}min`,
      shortLabel: `${ageMinutes}m`,
      colorVar: 'var(--color-warning)',
      warning: 'À reconfirmer',
    }
  }

  if (ageMinutes < 120) {
    const hours = Math.floor(ageMinutes / 60)
    return {
      ageMinutes,
      confidence: 30,
      level: 'stale',
      label: `Vu il y a ${hours}h`,
      shortLabel: `${hours}h`,
      colorVar: 'var(--color-destructive)',
      warning: 'Peut-être plus en rayon',
    }
  }

  const hours = Math.floor(ageMinutes / 60)
  return {
    ageMinutes,
    confidence: 15,
    level: 'expired',
    label: `Vu il y a ${hours}h`,
    shortLabel: `${hours}h`,
    colorVar: 'var(--color-destructive)',
    warning: 'Très probablement épuisé',
  }
}

