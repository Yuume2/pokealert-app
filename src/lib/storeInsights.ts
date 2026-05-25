/**
 * Insights terrain par magasin : transport, étage, emplacement rayon Pokemon TCG.
 * Données collectées pour les magasins prioritaires Paris/IDF.
 * Permet de générer des drop walkthroughs ultra-spécifiques.
 */

export interface StoreInsight {
  eagid: string
  metroSortie: string
  metroLigne: string
  etage: string
  rayonLocation: string
  tempsOuverture: string
  notesTactiques: string[]
  trajetDepuisGareDuNord?: string
  trajetDepuisChatelet?: string
}

export const STORE_INSIGHTS: Record<string, StoreInsight> = {
  '171': {
    eagid: '171',
    metroSortie: 'M1 Esplanade La Défense (sortie 4) ou RER A La Défense Grande Arche',
    metroLigne: 'M1, RER A, RER E',
    etage: 'CNIT, 2e étage',
    rayonLocation: 'Rayon Jeux & Jouets / TCG, côté droit après entrée',
    tempsOuverture: '10h00 pile (Lun-Sam) · 10h00 (Dim)',
    notesTactiques: [
      'Demande TOUJOURS au vendeur "vous avez du Pokemon en arrière-boutique ?"',
      'Le vendredi matin = livraison Asmodée fréquente',
      'Plus calme que Forum des Halles, meilleure chance le matin tôt',
      'Parking sous le CNIT si tu y vas en voiture',
    ],
    trajetDepuisGareDuNord: 'RER B → Châtelet-Les Halles → RER A vers Saint-Germain → La Défense (25min)',
    trajetDepuisChatelet: 'RER A direct vers Saint-Germain → La Défense (12min)',
  },
  '17': {
    eagid: '17',
    metroSortie: 'M1/M4/M7/M11/M14 Châtelet-Les Halles (sortie Berger ou Pierre Lescot)',
    metroLigne: 'M1, M4, M7, M11, M14, RER A, B, D',
    etage: 'Westfield Forum, niveau -3',
    rayonLocation: 'FNAC entrée Porte Lescot, rayon Pop Culture/TCG au fond à droite',
    tempsOuverture: '10h00 (7j/7)',
    notesTactiques: [
      'Le plus passant - les pros arrivent souvent dès 9h45 devant la porte',
      'Si raté à 10h05, c\'est mort — enchaîne direct Montparnasse',
      'Connexion RER A directe vers CNIT en 12min',
      'Le mardi et jeudi sont les jours forts pour Pokemon ici',
    ],
    trajetDepuisGareDuNord: 'RER B direct → Châtelet-Les Halles (5min)',
    trajetDepuisChatelet: 'Sur place, sortir vers Westfield Forum',
  },
  '4': {
    eagid: '4',
    metroSortie: 'M4 Saint-Placide ou M12 Notre-Dame-des-Champs',
    metroLigne: 'M4, M12, M13 (à proximité Gare Montparnasse)',
    etage: 'FNAC rez-de-chaussée + niveaux',
    rayonLocation: 'Cartes & Jeux au sous-sol (niveau -1), section TCG sur le mur droit',
    tempsOuverture: '10h00 (Lun-Sam), 11h00 (Dim)',
    notesTactiques: [
      'Selon témoignages vendeurs : livraison vendredi matin observée',
      'Vendeur du rayon souvent jeune et passionné Pokemon - relation directe possible',
      'Moins frequenté que Forum, bon rapport vitesse/calme',
      'Aussi appelée "FNAC rue de Rennes" - 136 rue de Rennes',
    ],
    trajetDepuisGareDuNord: 'M4 direct (toutes stations) → Saint-Placide (22min)',
    trajetDepuisChatelet: 'M4 direct vers Bagneux → Saint-Placide (12min)',
  },
  '336': {
    eagid: '336',
    metroSortie: 'M10 Charles Michels ou M6 Bir-Hakeim (10min à pied)',
    metroLigne: 'M10, M6',
    etage: 'Centre Commercial Beaugrenelle, niveau 0',
    rayonLocation: 'Rayon Jeux & Jouets, entrée Magnetic gallery',
    tempsOuverture: '10h00 (7j/7)',
    notesTactiques: [
      'Plus petite FNAC, stock limité mais souvent oublié des scalpers',
      'Bonne opportunité pour les sets moins demandés',
      'Voisine de plein de magasins jouets - vérifier Picwic Toys à côté',
    ],
  },
  '42': {
    eagid: '42',
    metroSortie: 'M1/M2 Ternes ou Charles de Gaulle-Étoile (5min à pied)',
    metroLigne: 'M1, M2, RER A',
    etage: 'FNAC niveau 0 et -1',
    rayonLocation: 'Rayon Cartes au sous-sol',
    tempsOuverture: '10h00 (Lun-Sam)',
    notesTactiques: [
      'Clientèle plus âgée, moins de chasse scalpers',
      'Livraisons jeudi typique',
      'Si tu habites 17e, c\'est ton spot',
    ],
  },
  '21': {
    eagid: '21',
    metroSortie: 'M3/M12/M13/M14 Saint-Lazare',
    metroLigne: 'M3, M12, M13, M14, RER E',
    etage: 'Passage du Havre, niveau 0',
    rayonLocation: 'Rayon Cartes à l\'entrée gauche après caisses',
    tempsOuverture: '10h-20h (Ven jusqu\'à 20h30), 11h-19h (Dim)',
    notesTactiques: [
      'Magasin de gare = flux constant, drops difficiles à attraper',
      'Le vendredi soir (20h30 fermeture tardive) peut donner des restocks soir',
      'Souvent oublié pour Pokemon TCG',
    ],
  },
  '45': {
    eagid: '45',
    metroSortie: 'M10 Boulogne-Jean Jaurès',
    metroLigne: 'M10',
    etage: 'Centre commercial Les Passages, niveau 0',
    rayonLocation: 'FNAC fond du centre commercial, rayon Cartes au sous-sol',
    tempsOuverture: '10h-20h (Lun-Sam)',
    notesTactiques: [
      'Petit magasin de quartier, peu de surveillance scalpers',
      'Stock plus stable, moins de pic mais moins de creux',
    ],
  },
  '20': {
    eagid: '20',
    metroSortie: 'Voiture recommandée - RER C Petit Jouy-Les Loges',
    metroLigne: 'RER C ou voiture (parking gratuit)',
    etage: 'Centre commercial Parly 2',
    rayonLocation: 'FNAC fond du centre, rayon TCG bien identifié',
    tempsOuverture: '10h-21h (Lun-Sam)',
    notesTactiques: [
      'Ouvert jusqu\'à 21h = restocks soir possibles',
      'Plus accessible en voiture',
      'Stock régulier, peu de pression scalpers',
    ],
  },
  '32': {
    eagid: '32',
    metroSortie: 'Voiture recommandée - Bus 379 Vélizy 2 depuis Pont de Sèvres',
    metroLigne: 'Bus 379, voiture (parking gratuit)',
    etage: 'Centre commercial Vélizy 2',
    rayonLocation: 'FNAC niveau 1, rayon Jeux',
    tempsOuverture: '10h-21h (Lun-Sam), 10h-19h (Dim)',
    notesTactiques: [
      'Loin du centre Paris mais souvent oublié',
      'Ouvert le dimanche jusqu\'à 19h',
      'Bonne backup si tu fais le tour ouest IDF',
    ],
  },
}

/**
 * Génère un drop walkthrough Telegram pour un magasin donné
 */
export function buildWalkthrough(eagid: string, _produitNom: string, heureOuverture: string): string {
  const insight = STORE_INSIGHTS[eagid]
  if (!insight) {
    return `Pas d'insight terrain disponible pour ce magasin.\nViens à ${heureOuverture} pile à l'ouverture.`
  }

  const lines = [
    `Plan d'attaque`,
    ``,
    `Sortie · ${insight.metroSortie}`,
    `Lignes · ${insight.metroLigne}`,
    ``,
    `Étage · ${insight.etage}`,
    `Rayon · ${insight.rayonLocation}`,
    ``,
    `Heure cible · ${heureOuverture}`,
    `   (${insight.tempsOuverture})`,
    ``,
    `Notes :`,
    ...insight.notesTactiques.map((n) => `   · ${n}`),
  ]

  return lines.join('\n')
}
