/**
 * Données mock pour le développement hors Telegram (et avant que les webhooks n8n soient prêts).
 * Activé automatiquement quand on est en mode dev navigateur.
 */

import type { BotStatus, ProductWithStock, StatsData } from './api'

export const MOCK_STATUS: BotStatus = {
  active: true,
  paused: false,
  paris_hour: 13,
  in_active_hours: true,
  last_run: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  next_run: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
  products_count: 22,
}

export const MOCK_STOCK: ProductWithStock[] = [
  {
    id: 1,
    prid: '22390738',
    nom: "ME04 Coffret Dresseur d'Élite",
    type_produit: 'ETB',
    serie: 'ME04 Chaos Ascendant',
    prix_fnac: 55.99,
    actif: true,
    in_stock_count: 5,
    in_stock_favoris: 2,
    stocks: [
      {
        prid: '22390738',
        eagid: '171',
        magasin_nom: 'FNAC La Défense-CNIT',
        magasin_favori: true,
        stock_label: 'En rayon',
        availability_status: 'InStore',
        last_check: new Date().toISOString(),
      },
      {
        prid: '22390738',
        eagid: '17',
        magasin_nom: 'FNAC Paris Forum des Halles',
        magasin_favori: true,
        stock_label: 'En rayon',
        availability_status: 'InStore',
        last_check: new Date().toISOString(),
      },
    ],
  },
  {
    id: 8,
    prid: '22390745',
    nom: 'ME04 Bundle 6 boosters',
    type_produit: 'Bundle',
    serie: 'ME04 Chaos Ascendant',
    prix_fnac: 35.99,
    actif: true,
    in_stock_count: 3,
    in_stock_favoris: 1,
    stocks: [
      {
        prid: '22390745',
        eagid: '4',
        magasin_nom: 'FNAC Paris Montparnasse (rue de Rennes)',
        magasin_favori: true,
        stock_label: 'En rayon',
        availability_status: 'InStore',
        last_check: new Date().toISOString(),
      },
    ],
  },
  {
    id: 16,
    prid: '22390749',
    nom: 'ME04 Pack 3 boosters',
    type_produit: 'Tripack',
    serie: 'ME04 Chaos Ascendant',
    prix_fnac: 17.99,
    actif: true,
    in_stock_count: 2,
    in_stock_favoris: 0,
    stocks: [],
  },
]

export const MOCK_STATS: StatsData = {
  snapshot_at: new Date().toISOString(),
  counts: {
    total_products: 22,
    actifs: 22,
    inactifs: 0,
    by_type: { ETB: 7, Bundle: 8, Tripack: 7 },
    magasins_tracked: 9,
    favoris_tracked: 3,
  },
  prices: {
    total_catalog_value: 805.78,
    min: 17.99,
    max: 55.99,
    avg: 36.63,
  },
  top_series: [
    { nom: 'Chaos Ascendant', count: 3 },
    { nom: 'Équilibre Parfait', count: 3 },
    { nom: 'Héros Transcendants', count: 2 },
  ],
}
