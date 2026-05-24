import { DEFAULT_FAVORIS } from './stores'

const KEY_FAVORIS = 'pokealert.v2.favoris'
const KEY_PORTFOLIO = 'pokealert.v2.portfolio'
const KEY_LAST_TAB = 'pokealert.v2.last_tab'

export function getFavorisStores(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY_FAVORIS)
    if (!raw) return new Set(DEFAULT_FAVORIS)
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set(DEFAULT_FAVORIS)
  }
}

export function setFavorisStores(s: Set<string>): void {
  try {
    localStorage.setItem(KEY_FAVORIS, JSON.stringify([...s]))
  } catch {}
}

export function toggleFavoriStore(eagid: string): Set<string> {
  const s = getFavorisStores()
  if (s.has(eagid)) s.delete(eagid)
  else s.add(eagid)
  setFavorisStores(s)
  return s
}

export interface Purchase {
  id: string
  prid: string
  produit_nom: string
  type_produit: string
  prix_achat: number
  magasin: string
  date: string
  prix_revente?: number
  date_revente?: string
}

export function getPortfolio(): Purchase[] {
  try {
    const raw = localStorage.getItem(KEY_PORTFOLIO)
    if (!raw) return []
    return JSON.parse(raw) as Purchase[]
  } catch {
    return []
  }
}

export function addPurchase(p: Omit<Purchase, 'id'>): Purchase {
  const purchase: Purchase = { ...p, id: crypto.randomUUID() }
  const all = getPortfolio()
  all.unshift(purchase)
  try {
    localStorage.setItem(KEY_PORTFOLIO, JSON.stringify(all))
  } catch {}
  return purchase
}

export function updatePurchase(id: string, patch: Partial<Purchase>): Purchase | null {
  const all = getPortfolio()
  const idx = all.findIndex((p) => p.id === id)
  if (idx < 0) return null
  all[idx] = { ...all[idx], ...patch }
  try {
    localStorage.setItem(KEY_PORTFOLIO, JSON.stringify(all))
  } catch {}
  return all[idx]
}

export function removePurchase(id: string): void {
  const all = getPortfolio().filter((p) => p.id !== id)
  try {
    localStorage.setItem(KEY_PORTFOLIO, JSON.stringify(all))
  } catch {}
}

export function getLastTab(): string | null {
  try {
    return localStorage.getItem(KEY_LAST_TAB)
  } catch {
    return null
  }
}

export function setLastTab(tab: string): void {
  try {
    localStorage.setItem(KEY_LAST_TAB, tab)
  } catch {}
}
