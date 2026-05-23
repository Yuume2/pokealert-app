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
}

export interface StockEntry {
  prid: string
  eagid: string
  magasin_nom: string
  magasin_favori: boolean
  stock_label: string
  availability_status: string
  last_check: string
}

export interface ProductWithStock extends Product {
  stocks: StockEntry[]
  in_stock_count: number
  in_stock_favoris: number
}

export interface StatsData {
  drops_today: number
  drops_week: number
  drops_total: number
  top_magasins: Array<{ nom: string; count: number }>
  top_produits: Array<{ nom: string; count: number }>
  last_drops: Array<{ produit: string; magasin: string; time: string }>
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
  addProduct: (url: string) =>
    fetchJson<{ ok: boolean; product?: Product; error?: string }>('/pokealert/products/add', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),
  stats: () => fetchJson<StatsData>('/pokealert/stats'),
  togglePause: (paused: boolean) =>
    fetchJson<{ ok: boolean }>('/pokealert/bot/pause', {
      method: 'POST',
      body: JSON.stringify({ paused }),
    }),
}

export { ApiError }
