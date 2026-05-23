import { useEffect, useRef, type ReactNode } from 'react'
import { Icon } from './Icons'
import { cn } from '../lib/cn'
import { haptic } from '../lib/telegram'

interface Props {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
}

/**
 * Bottom sheet style iOS qui slide depuis le bas.
 * Backdrop blur + drag handle + scrollable content.
 * Ferme au clic backdrop ou bouton X.
 */
export function Sheet({ open, onClose, children, title }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  // Empêche scroll body quand sheet ouvert
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Escape pour fermer
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const handleClose = () => {
    haptic('light')
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <button
        aria-label="Fermer"
        onClick={handleClose}
        className={cn(
          'absolute inset-0 bg-black/60 backdrop-blur-md',
          'animate-fade-in',
        )}
      />

      {/* Sheet content */}
      <div
        ref={ref}
        className={cn(
          'relative w-full max-w-2xl mx-auto',
          'max-h-[92vh] flex flex-col',
          'rounded-t-3xl border-t border-border bg-background',
          'shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.8)]',
          'animate-sheet-up',
        )}
      >
        {/* Drag handle */}
        <button
          onClick={handleClose}
          className="absolute top-2 left-1/2 -translate-x-1/2 h-1 w-10 rounded-full bg-border-strong"
          aria-label="Fermer"
        />

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between gap-3 px-5 pt-6 pb-3">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <button
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-card-hover transition-colors"
              aria-label="Fermer"
            >
              <Icon.X className="h-4 w-4" />
            </button>
          </div>
        )}

        {!title && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-card-hover transition-colors z-10"
            aria-label="Fermer"
          >
            <Icon.X className="h-4 w-4" />
          </button>
        )}

        {/* Content scrollable */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
