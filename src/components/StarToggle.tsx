import { Icon } from './Icons'
import { cn } from '../lib/cn'
import { haptic } from '../lib/telegram'

interface Props {
  active: boolean
  onToggle: () => void
  size?: 'sm' | 'md'
}

export function StarToggle({ active, onToggle, size = 'md' }: Props) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    haptic(active ? 'light' : 'medium')
    onToggle()
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex items-center justify-center rounded-full transition-all',
        'active:scale-90',
        size === 'sm' && 'h-7 w-7',
        size === 'md' && 'h-9 w-9',
        active
          ? 'bg-primary-muted text-primary'
          : 'bg-card text-muted-foreground hover:bg-card-hover hover:text-foreground',
      )}
      aria-pressed={active}
      aria-label={active ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <Icon.Star
        className={cn(size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4')}
        fill={active ? 'currentColor' : 'none'}
        strokeWidth={active ? 1.5 : 1.8}
      />
    </button>
  )
}
