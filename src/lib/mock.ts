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
  drops_today: 3,
  drops_week: 18,
  drops_total: 47,
  top_magasins: [
    { nom: 'FNAC La Défense-CNIT', count: 12 },
    { nom: 'FNAC Forum des Halles', count: 9 },
    { nom: 'FNAC Beaugrenelle', count: 7 },
  ],
  top_produits: [
    { nom: 'ME04 ETB', count: 8 },
    { nom: 'ME04 Bundle', count: 6 },
    { nom: 'ME03 ETB', count: 4 },
  ],
  last_drops: [
    { produit: 'ME04 ETB', magasin: 'La Défense-CNIT', time: '11:23' },
    { produit: 'ME04 Bundle', magasin: 'Forum des Halles', time: '10:48' },
    { produit: 'ME03 ETB', magasin: 'Beaugrenelle', time: '09:15' },
  ],
}
