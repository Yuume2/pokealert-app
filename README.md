# 🔥 PokeAlert

Mini App Telegram qui détecte en temps réel les drops de produits Pokémon TCG (ETB, Bundle, Tripack) dans les magasins FNAC de Paris / La Défense.

## Stack

- **Frontend** : React 19 + Vite + TypeScript + Tailwind CSS v4
- **Telegram** : Telegram WebApp SDK
- **Backend** : Webhooks n8n Cloud
- **Hébergement** : Vercel

## Fonctionnalités

- 🏠 **Accueil** — Status bot + drops actifs dans les magasins favoris
- 📊 **Stock** — Liste complète de tous les produits surveillés
- ⚙️ **Produits** — Activer/désactiver les produits suivis
- 📈 **Stats** — Historique des drops détectés *(Sprint 3)*

## Magasins surveillés

9 magasins FNAC autour de Paris dont 3 favoris (🔥) :
- 🔥 FNAC La Défense-CNIT
- 🔥 FNAC Paris Forum des Halles
- 🔥 FNAC Paris Montparnasse (rue de Rennes)
- 📍 + Beaugrenelle, Ternes, Saint-Lazare, Boulogne, Parly 2, Vélizy

## Dev local

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Variables d'env

| Variable | Description | Défaut |
|---|---|---|
| `VITE_N8N_WEBHOOK_BASE` | URL de base des webhooks n8n | `https://yumeee.app.n8n.cloud/webhook` |
| `VITE_USE_MOCK` | Force le mode données factices (dev) | `false` |
