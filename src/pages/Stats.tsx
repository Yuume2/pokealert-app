import { Eyebrow, Stat, EmptyState } from '../components/ui'
import { Icon } from '../components/Icons'

export function StatsPage() {
  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <Eyebrow>Insights</Eyebrow>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Statistiques</h1>
        <p className="text-sm text-muted-foreground">
          Suivi des drops détectés et tendances par magasin.
        </p>
      </header>

      <EmptyState
        title="Bientôt disponible"
        description="Les statistiques arrivent dès que le bot aura accumulé une semaine d'historique. Reviens d'ici quelques jours."
        icon={Icon.TrendingUp}
      />

      <div className="grid grid-cols-3 gap-2 opacity-30">
        <Stat value="—" label="Cette semaine" />
        <Stat value="—" label="Ce mois" />
        <Stat value="—" label="Total" />
      </div>
    </div>
  )
}
