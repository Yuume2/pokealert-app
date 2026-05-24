import type { ProductWithStock } from './api'

/**
 * Fuzzy search ultra-permissive : tolérance accents, casse, mots dans le désordre.
 */
export function fuzzySearchProducts(
  products: ProductWithStock[],
  query: string,
): ProductWithStock[] {
  const q = normalize(query.trim())
  if (!q) return products
  const tokens = q.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return products

  return products
    .map((p) => ({ product: p, score: scoreProduct(p, tokens) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.product)
}

function scoreProduct(p: ProductWithStock, tokens: string[]): number {
  const haystack = normalize(
    [p.nom, p.serie, p.type_produit, p.prid].join(' '),
  )
  let score = 0
  for (const token of tokens) {
    if (haystack.includes(token)) {
      score += 10
      if (haystack.startsWith(token)) score += 5
      if (normalize(p.nom).includes(token)) score += 3
      if (normalize(p.type_produit) === token) score += 8
    } else {
      return 0
    }
  }
  if (p.in_stock_count > 0) score += 2
  return score
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Score chaleur 1-5 d'un produit basé sur :
 * - Nombre de magasins en rayon (rareté inversée)
 * - Présence dans favoris
 * - Type (ETB > Bundle > Tripack)
 * - Limite (quantité limitée bonus)
 */
export function heatScore(p: ProductWithStock, favorisEagids: Set<string>): number {
  if (p.in_stock_count === 0) return 0

  let score = 0

  if (p.type_produit === 'ETB') score += 2
  else if (p.type_produit === 'Bundle') score += 1.5
  else score += 1

  if (p.in_stock_count <= 2) score += 2
  else if (p.in_stock_count <= 5) score += 1

  const inFavoris = p.stocks.some((s) => favorisEagids.has(s.eagid))
  if (inFavoris) score += 1.5

  const isLimited = p.stocks.some((s) => s.stock_label?.includes('limitée'))
  if (isLimited) score += 0.5

  return Math.min(5, Math.max(1, Math.round(score)))
}
