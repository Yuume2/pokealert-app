import { useState } from 'react'
import { Sheet } from './Sheet'
import { Button, Eyebrow } from './ui'
import { Icon } from './Icons'
import { haptic } from '../lib/telegram'

interface Props {
  onClose: () => void
}

/**
 * Sheet d'introduction au premier lancement.
 * 1 écran avec la value proposition + bouton commencer.
 */
export function Onboarding({ onClose }: Props) {
  const [step, setStep] = useState(0)
  const steps = [
    {
      eyebrow: 'PokeAlert',
      title: 'Sois là avant les autres.',
      description: 'Surveillance temps réel des coffrets Pokémon TCG dans neuf magasins FNAC autour de Paris.',
      icon: Icon.Flame,
      bullets: [
        { icon: Icon.Zap, text: 'Détection instantanée des passages en rayon' },
        { icon: Icon.MapPin, text: '9 magasins surveillés en parallèle' },
        { icon: Icon.BellRing, text: 'Notifications Telegram dès qu\'un drop arrive' },
      ],
    },
    {
      eyebrow: 'Comment ça marche',
      title: 'Trois minutes d\'avance.',
      description: 'Le bot vérifie chaque produit toutes les 5 minutes via l\'API stock-magasin FNAC.',
      icon: Icon.Activity,
      bullets: [
        { icon: Icon.Box, text: '22 produits suivis : ETB, Bundles, Tripacks' },
        { icon: Icon.Flame, text: 'Magasins prioritaires : La Défense, Forum, Montparnasse' },
        { icon: Icon.TrendingUp, text: 'Marge type ETB retail 56€ → revente 75-90€' },
      ],
    },
  ]

  const current = steps[step]
  const isLast = step === steps.length - 1

  const handleNext = () => {
    haptic('light')
    if (isLast) onClose()
    else setStep(step + 1)
  }

  const handleSkip = () => {
    haptic('light')
    onClose()
  }

  return (
    <Sheet open onClose={onClose}>
      <div className="px-6 pt-10 pb-8 space-y-7">
        {/* Skip button */}
        <div className="flex justify-end -mt-2 -mr-2">
          <button
            onClick={handleSkip}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Passer
          </button>
        </div>

        {/* Icon hero */}
        <div className="relative flex justify-center pt-4">
          <div className="pointer-events-none absolute top-0 h-32 w-32 rounded-full aurora-primary blur-3xl" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_8px_32px_-8px_rgba(212,168,87,0.6)]">
            <current.icon className="h-7 w-7" strokeWidth={1.8} />
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-3">
          <Eyebrow>{current.eyebrow}</Eyebrow>
          <h1
            className="font-display text-[2.25rem] leading-[1.05] tracking-tight text-foreground px-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {current.title}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground max-w-[32ch] mx-auto">
            {current.description}
          </p>
        </div>

        {/* Bullets */}
        <div className="space-y-2 pt-2">
          {current.bullets.map((b, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-border bg-card"
              style={{ animation: `fade-in-up 400ms ${i * 100 + 100}ms both` }}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-muted text-primary shrink-0">
                <b.icon className="h-4 w-4" />
              </div>
              <p className="text-sm text-foreground">{b.text}</p>
            </div>
          ))}
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-1.5">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-primary' : 'w-1.5 bg-border'
              }`}
            />
          ))}
        </div>

        {/* CTA */}
        <Button onClick={handleNext} variant="primary" size="lg" className="w-full">
          {isLast ? 'Commencer' : 'Continuer'}
          <Icon.ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Sheet>
  )
}
