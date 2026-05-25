import { useState } from 'react'
import { Button, Eyebrow } from './ui'
import { Icon } from './Icons'
import { haptic } from '../lib/telegram'
import { cn } from '../lib/cn'

interface Props {
  onClose: () => void
}

/**
 * Onboarding cinématographique 3 steps + intro hero
 * Style Linear/Stripe/Lovable
 */
export function Onboarding({ onClose }: Props) {
  const [step, setStep] = useState(0)

  const steps = [
    {
      eyebrow: 'PokeAlert',
      title: 'Sois là avant les autres.',
      subtitle: 'L\'app de chasse aux drops Pokémon TCG la plus précise de France.',
      bg: 'aurora-primary',
      highlight: 'avant',
      icon: Icon.Target,
      stat: { value: '22', label: 'produits surveillés' },
      stat2: { value: '9', label: 'magasins Paris/IDF' },
      stat3: { value: '5min', label: 'fréquence scan' },
    },
    {
      eyebrow: 'Comment ça marche',
      title: 'Algo + calendrier officiel.',
      subtitle: 'Chaque matin 7h, le bot croise les sorties officielles, les jours de livraison FNAC et l\'historique observé pour te dire OÙ ALLER.',
      bg: 'aurora-success',
      highlight: 'Algo',
      icon: Icon.Sparkles,
      features: [
        { icon: Icon.Compass, label: 'Top 3 magasins par jour' },
        { icon: Icon.BellRing, label: 'Push Telegram silencieux' },
        { icon: Icon.Navigation, label: 'Walkthrough métro + rayon' },
      ],
    },
    {
      eyebrow: 'C\'est parti',
      title: 'Prêt à choper ME05 ?',
      subtitle: 'ETB Nuit Noire sort le 17 juillet. Le bot t\'alerte J-7, J-3, J-1 et le matin J. Plus jamais de drop raté.',
      bg: 'aurora-hot',
      highlight: 'ME05',
      icon: Icon.Flame,
      next: { date: '17 juillet 2026', label: 'ETB Nuit Noire — Méga Darkrai ex', price: '55,99€ retail' },
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
    <div className="fixed inset-0 z-[100] bg-background overflow-hidden flex flex-col">
      {/* Backgrounds animés */}
      <div className={cn('absolute inset-0 pointer-events-none opacity-50', current.bg)} />
      <div className="absolute inset-0 dot-pattern opacity-20 pointer-events-none" />

      {/* Skip */}
      <div className="absolute top-6 right-6 z-10">
        <button
          onClick={handleSkip}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full bg-card border border-border"
        >
          Passer
        </button>
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col justify-center px-6 max-w-2xl w-full mx-auto">
        <div key={step} className="space-y-8">
          {/* Icon hero animé */}
          <div className="relative flex justify-center">
            <div className="absolute inset-0 h-24 w-24 mx-auto rounded-full bg-primary blur-2xl opacity-40 animate-pulse-violet" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary-hover text-primary-foreground shadow-glow-strong">
              <current.icon className="h-9 w-9" strokeWidth={2} />
            </div>
          </div>

          {/* Text central */}
          <div className="text-center space-y-3 stagger-1">
            <Eyebrow>{current.eyebrow}</Eyebrow>
            <h1 className="text-[2.5rem] font-black tracking-[-0.04em] leading-[1.05] text-foreground">
              {current.title.split(current.highlight).flatMap((part, i, arr) =>
                i < arr.length - 1
                  ? [
                      <span key={`p-${i}`}>{part}</span>,
                      <em key={`h-${i}`} className="not-italic text-primary text-glow">
                        {current.highlight}
                      </em>,
                    ]
                  : [<span key={`p-${i}`}>{part}</span>],
              )}
            </h1>
            <p className="text-[14px] leading-relaxed text-muted-foreground max-w-[34ch] mx-auto">
              {current.subtitle}
            </p>
          </div>

          {/* Step 1: 3 big stats */}
          {step === 0 && (
            <div className="grid grid-cols-3 gap-2.5 stagger-2">
              {[current.stat, current.stat2, current.stat3].filter(Boolean).map((s, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border bg-card-elevated px-4 py-5 text-center"
                >
                  <p className="text-[1.75rem] font-black text-primary leading-none tabular-nums text-glow">
                    {s!.value}
                  </p>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground leading-tight">
                    {s!.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Step 2: features list */}
          {step === 1 && current.features && (
            <div className="space-y-2 stagger-2">
              {current.features.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-border bg-card"
                  style={{ animation: `fade-in-up 500ms ${i * 120 + 200}ms both` }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-muted text-primary shrink-0">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <p className="text-[14px] font-semibold text-foreground">{f.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Step 3: next drop preview */}
          {step === 2 && current.next && (
            <div className="rounded-3xl border border-[var(--color-hot)]/30 bg-[var(--color-hot-muted)] p-5 stagger-2 relative overflow-hidden">
              <div className="absolute inset-0 aurora-hot opacity-40 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <Eyebrow>Prochain drop critique</Eyebrow>
                  <span className="text-[10px] uppercase tracking-[0.14em] font-bold text-[var(--color-hot)]">
                    J-{Math.max(0, Math.ceil((new Date('2026-07-17').getTime() - Date.now()) / (24 * 3600 * 1000)))}
                  </span>
                </div>
                <p className="text-[14px] font-bold text-foreground">{current.next.label}</p>
                <p className="mt-1 text-[12px] text-muted-foreground">{current.next.date}</p>
                <p className="mt-2 text-[11px] text-[var(--color-hot)] font-bold">
                  {current.next.price}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom : dots + CTA */}
      <div className="relative px-6 pb-8 max-w-2xl w-full mx-auto space-y-4">
        {/* Dots */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                haptic('light')
                setStep(i)
              }}
              className={cn(
                'h-2 rounded-full transition-all',
                i === step ? 'w-8 bg-primary shadow-glow' : 'w-2 bg-border hover:bg-border-strong',
              )}
              aria-label={`Step ${i + 1}`}
            />
          ))}
        </div>

        <Button onClick={handleNext} variant="primary" size="lg" className="w-full">
          {isLast ? 'C\'est parti' : 'Continuer'}
          <Icon.ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
