export interface StoreInfo {
  eagid: string
  nom: string
  short: string
  zip: string
  lat: number
  lng: number
  url: string
  mapsUrl: string
}

export const ALL_STORES: StoreInfo[] = [
  { eagid: '171', nom: 'FNAC La Défense-CNIT', short: 'La Défense', zip: '92053', lat: 48.8917859, lng: 2.2404863, url: 'https://www.fnac.com/La-Defense/Fnac-Defense/cl97/w-4', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=48.8917859,2.2404863' },
  { eagid: '17', nom: 'FNAC Paris Forum des Halles', short: 'Forum des Halles', zip: '75001', lat: 48.8614538, lng: 2.3464796, url: 'https://www.fnac.com/Paris-Forum-des-Halles/Fnac-Forum-des-Halles/cl74/w-4', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=48.8614538,2.3464796' },
  { eagid: '4', nom: 'FNAC Paris Montparnasse', short: 'Montparnasse', zip: '75006', lat: 48.84581, lng: 2.325604, url: 'https://www.fnac.com/Paris-Montparnasse/Fnac-Montparnasse/cl45/w-4', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=48.84581,2.325604' },
  { eagid: '336', nom: 'FNAC Paris Beaugrenelle', short: 'Beaugrenelle', zip: '75015', lat: 48.84891, lng: 2.282289, url: 'https://www.fnac.com/Paris-Beaugrenelle/Fnac-Beaugrenelle/cl321/w-4', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=48.84891,2.282289' },
  { eagid: '42', nom: 'FNAC Paris Ternes', short: 'Ternes', zip: '75017', lat: 48.8786708, lng: 2.2943219, url: 'https://www.fnac.com/Paris-Ternes/Fnac-Ternes/cl71/w-4', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=48.8786708,2.2943219' },
  { eagid: '21', nom: 'FNAC Paris Saint-Lazare', short: 'Saint-Lazare', zip: '75009', lat: 48.875565, lng: 2.326875, url: 'https://www.fnac.com/Paris-Saint-Lazare/Fnac-Saint-Lazare/cl72/w-4', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=48.875565,2.326875' },
  { eagid: '45', nom: 'FNAC Boulogne', short: 'Boulogne', zip: '92100', lat: 48.836501, lng: 2.238921, url: 'https://www.fnac.com/Boulogne/Fnac-Boulogne/cl114/w-4', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=48.836501,2.238921' },
  { eagid: '20', nom: 'FNAC Parly 2', short: 'Parly 2', zip: '78150', lat: 48.8253926, lng: 2.1185115, url: 'https://www.fnac.com/Parly-2/Fnac-Parly-2/cl70/w-4', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=48.8253926,2.1185115' },
  { eagid: '32', nom: 'FNAC Vélizy', short: 'Vélizy', zip: '78140', lat: 48.783371, lng: 2.220612, url: 'https://www.fnac.com/Velizy/Fnac-Velizy/cl48/w-4', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=48.783371,2.220612' },
  { eagid: '284', nom: 'FNAC Gennevilliers', short: 'Gennevilliers', zip: '92230', lat: 48.933042, lng: 2.3166959, url: 'https://www.fnac.com/Gennevilliers/Fnac-Gennevilliers/cl101/w-4', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=48.933042,2.3166959' },
  { eagid: '321', nom: 'FNAC Paris Bercy Village', short: 'Bercy Village', zip: '75012', lat: 48.833523, lng: 2.386662, url: 'https://www.fnac.com/Paris-Bercy-Village/Fnac-Bercy-Village/cl277/w-4', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=48.833523,2.386662' },
  { eagid: '36', nom: 'FNAC Rosny 2', short: 'Rosny 2', zip: '93117', lat: 48.8804472, lng: 2.4772964, url: 'https://www.fnac.com/Rosny-2/Fnac-Rosny-2/cl64/w-4', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=48.8804472,2.4772964' },
  { eagid: '13', nom: 'FNAC Créteil', short: 'Créteil', zip: '94012', lat: 48.7787018, lng: 2.4600355, url: 'https://www.fnac.com/Creteil/Fnac-Creteil/cl105/w-4', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=48.7787018,2.4600355' },
  { eagid: '280', nom: 'FNAC Thiais', short: 'Thiais', zip: '94320', lat: 48.7587155, lng: 2.387699, url: 'https://www.fnac.com/Thiais/Fnac-Thiais/cl59/w-4', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=48.7587155,2.387699' },
  { eagid: '16', nom: 'FNAC Cergy', short: 'Cergy', zip: '95014', lat: 49.038392, lng: 2.08096, url: 'https://www.fnac.com/Cergy/Fnac-Cergy/cl109/w-4', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=49.038392,2.08096' },
  { eagid: '172', nom: 'FNAC Noisy-le-Grand', short: 'Noisy-le-Grand', zip: '93160', lat: 48.8384501, lng: 2.5458092, url: 'https://www.fnac.com/Noisy-Le-Grand/Fnac-Noisy-Le-Grand/cl79/w-4', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=48.8384501,2.5458092' },
  { eagid: '29', nom: 'FNAC Parinor', short: 'Parinor', zip: '93600', lat: 48.9580153, lng: 2.4780288, url: 'https://www.fnac.com/Parinor/Fnac-Parinor/cl77/w-4', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=48.9580153,2.4780288' },
  { eagid: '18', nom: 'FNAC Val d\'Europe', short: 'Val d\'Europe', zip: '77711', lat: 48.855468, lng: 2.784305, url: 'https://www.fnac.com/Val-d-Europe/Fnac-Val-d-Europe/cl52/w-4', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=48.855468,2.784305' },
  { eagid: '322', nom: 'FNAC Chambourcy', short: 'Chambourcy', zip: '78240', lat: 48.911731, lng: 2.034317, url: 'https://www.fnac.com/Chambourcy/Fnac-Chambourcy/cl279/w-4', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=48.911731,2.034317' },
  { eagid: '283', nom: 'FNAC Villebon', short: 'Villebon', zip: '91140', lat: 48.7038636, lng: 2.2533891, url: 'https://www.fnac.com/Villebon/Fnac-Villebon/cl47/w-4', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=48.7038636,2.2533891' },
  { eagid: '312', nom: 'FNAC Paris Gare Montparnasse', short: 'Gare Montparnasse', zip: '75015', lat: 48.840754, lng: 2.31947, url: 'https://www.fnac.com/Paris-Gare-Montparnasse/Fnac-Paris-Gare-Montparnasse/cl227/w-4', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=48.840754,2.31947' },
  { eagid: '282', nom: 'FNAC Herblay', short: 'Herblay', zip: '95220', lat: 49.0046479, lng: 2.1748254, url: 'https://www.fnac.com/Herblay/Fnac-Herblay/cl98/w-4', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=49.0046479,2.1748254' },
]

export const DEFAULT_FAVORIS = ['171', '17', '4']

export function getStoreByEagid(eagid: string): StoreInfo | undefined {
  return ALL_STORES.find((s) => s.eagid === eagid)
}

/** Distance Haversine en km entre 2 coords. */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

/** Tri magasins : favoris d'abord puis distance, sinon ordre alpha. */
export function rankStores(
  favoris: Set<string>,
  userLat?: number,
  userLng?: number,
): Array<StoreInfo & { distanceKm?: number; isFavori: boolean }> {
  return ALL_STORES.map((s) => ({
    ...s,
    isFavori: favoris.has(s.eagid),
    distanceKm:
      userLat != null && userLng != null
        ? haversineKm(userLat, userLng, s.lat, s.lng)
        : undefined,
  })).sort((a, b) => {
    if (a.isFavori !== b.isFavori) return a.isFavori ? -1 : 1
    if (a.distanceKm != null && b.distanceKm != null) {
      return a.distanceKm - b.distanceKm
    }
    return a.short.localeCompare(b.short)
  })
}
