/**
 * Client API qui parle aux webhooks n8n.
 * Toutes les opérations de lecture/écriture des Data Tables passent par n8n.
 */

const API_BASE = import.meta.env.VITE_N8N_WEBHOOK_BASE ?? 'https://yumeee.app.n8n.cloud/webhook'

export interface Product {
  id: number
  prid: string
  nom: string
  type_produit: 'ETB' | 'Bundle' | 'Tripack'
  serie: string
  prix_fnac: number
  actif: boolean
  auto_scan?: boolean
  image_url?: string | null
}

export interface StockEntry {
  prid: string
  eagid: string
  magasin_nom: string
  magasin_favori: boolean
  stock_label: string
  availability_status: string
  last_check: string
  store_url?: string
  store_coord?: string | null
}

export interface ProductWithStock extends Product {
  stocks: StockEntry[]
  in_stock_count: number
  in_stock_favoris: number
}

export interface StatsData {
  snapshot_at: string
  counts: {
    total_products: number
    actifs: number
    inactifs: number
    by_type: { ETB: number; Bundle: number; Tripack: number }
    magasins_tracked: number
    favoris_tracked: number
  }
  prices: {
    total_catalog_value: number
    min: number
    max: number
    avg: number
  }
  top_series: Array<{ nom: string; count: number }>
  note?: string
}

export interface BotStatus {
  active: boolean
  paused: boolean
  paris_hour: number
  in_active_hours: boolean
  last_run: string | null
  next_run: string | null
  products_count: number
}

export interface CalendrierEntry {
  id?: number
  produit_nom: string
  serie: string
  type_produit: string
  date_sortie: string
  prix_estime: number
  source_url: string
  j_minus: number
  j_minus_today: number
  priorite: 'critique' | 'haute' | 'moyenne' | 'basse'
  notes?: string
}

export interface EventEntry {
  prid: string
  eagid: string
  event_type: 'ENTRY' | 'EXIT' | 'ENTRY_INITIAL'
  produit_nom: string
  magasin_nom: string
  is_favori: boolean
  event_at: string
  duration_minutes: number
  context: string
  age_minutes: number
}

export interface EventsData {
  generated_at: string
  stats: {
    total: number
    last_24h: number
    last_7d: number
    entries_24h: number
    exits_24h: number
    midday_restocks_7d: number
    fast_sellouts_7d: number
  }
  recent: EventEntry[]
}

export interface StoreDetail {
  generated_at: string
  store: {
    eagid: string
    nom: string
    short: string
    adresse: string
    zip: string
    tel: string
    horaires: string
    mapsUrl: string
    restock_pattern: {
      days: string[]
      heure: string
      note: string
    }
  }
  en_rayon: Array<{
    prid: string
    produit_nom: string
    type_produit: string
    serie: string
    prix_fnac: number
    stock_label: string
    last_check: string
  }>
  historique: Array<{
    prid: string
    produit_nom: string
    type_produit: string
    stock_label: string
    last_check: string
    currently_in_stock: boolean
  }>
  stats: {
    total_produits_tracked: number
    en_rayon_actuel: number
    changements_7j: number
  }
}

export interface TodayPrediction {
  eagid: string
  nom: string
  short: string
  favori: boolean
  score: number
  heure_optimale: string
  produit_cible: string
  reasoning: string[]
  ouverture: number
  en_rayon_count: number
}

export interface TodayData {
  generated_at: string
  date_today: string
  paris_day: string
  paris_hour: number
  is_weekend: boolean
  predictions: TodayPrediction[]
  top_3: TodayPrediction[]
  has_urgent: boolean
  top_confidence: number
  sortie_imminente: CalendrierEntry[]
  prochaine_critique: CalendrierEntry | null
  context_message: string
}

export interface BriefData {
  generated_at: string
  brief: {
    titre: string
    contenu: string
    date: string
    score_confiance: number
    next_critique: CalendrierEntry | null
  }
  calendrier: {
    imminent: CalendrierEntry[]
    future: CalendrierEntry[]
    past_recent?: CalendrierEntry[]
    total: number
  }
}

class ApiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.status = status
  }
}

async function fetchJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new ApiError(`API error: ${response.statusText}`, response.status)
  }

  return response.json() as Promise<T>
}

export const api = {
  status: () => fetchJson<BotStatus>('/pokealert/status'),
  stock: () => fetchJson<ProductWithStock[]>('/pokealert/stock'),
  products: () => fetchJson<Product[]>('/pokealert/products'),
  toggleProduct: (id: number, actif: boolean) =>
    fetchJson<{ ok: boolean }>('/pokealert/products/toggle', {
      method: 'POST',
      body: JSON.stringify({ id, actif }),
    }),
  toggleAutoScan: (id: number, auto_scan: boolean) =>
    fetchJson<{ ok: boolean; id: number; auto_scan: boolean }>('/pokealert/products/auto-toggle', {
      method: 'POST',
      body: JSON.stringify({ id, auto_scan }),
    }),
  scanNow: (prid: string) =>
    fetchJson<{
      success: boolean
      prid: string
      scanned_at: string
      total_magasins: number
      en_rayon_total: number
      en_rayon_favoris: number
      stores: Array<{
        eagid: string
        magasin_nom: string
        magasin_short: string
        favori: boolean
        stock_label: string
        in_stock: boolean
        limited: boolean
      }>
    }>('/pokealert/products/scan-now', {
      method: 'POST',
      body: JSON.stringify({ prid }),
    }),
  scanStore: (eagid: string) =>
    fetchJson<{
      success: boolean
      eagid: string
      scanned_at: string
      total_scanned: number
      in_stock_count: number
      products: Array<{
        prid: string
        nom: string
        type_produit: string
        serie: string
        prix_fnac: number
        image_url?: string | null
        in_stock: boolean
        stock_label: string
        limited: boolean
      }>
    }>('/pokealert/stores/scan', {
      method: 'POST',
      body: JSON.stringify({ eagid }),
    }),
  addProduct: (url: string) =>
    fetchJson<{ ok: boolean; product?: Product; error?: string }>('/pokealert/products/add', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),
  stats: () => fetchJson<StatsData>('/pokealert/stats'),
  brief: () => fetchJson<BriefData>('/pokealert/brief'),
  today: () => fetchJson<TodayData>('/pokealert/today'),
  store: (eagid: string) => fetchJson<StoreDetail>(`/pokealert/store?eagid=${encodeURIComponent(eagid)}`),
  events: () => fetchJson<EventsData>('/pokealert/events'),
  togglePause: (paused: boolean) =>
    fetchJson<{ ok: boolean }>('/pokealert/bot/pause', {
      method: 'POST',
      body: JSON.stringify({ paused }),
    }),
}

export { ApiError }
