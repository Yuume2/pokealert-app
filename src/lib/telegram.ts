/**
 * Initialisation du Telegram Mini App SDK.
 * Configure les couleurs du thème, l'expansion plein écran, et les paramètres viewport.
 * Fallback gracieux si l'app tourne hors de Telegram (mode dev navigateur).
 */

interface TelegramWebApp {
  ready: () => void
  expand: () => void
  setHeaderColor: (color: string) => void
  setBackgroundColor: (color: string) => void
  themeParams: Record<string, string>
  initData: string
  initDataUnsafe: {
    user?: {
      id: number
      first_name: string
      last_name?: string
      username?: string
    }
  }
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
    selectionChanged: () => void
  }
  MainButton: {
    text: string
    show: () => void
    hide: () => void
    onClick: (cb: () => void) => void
    offClick: (cb: () => void) => void
  }
  BackButton: {
    show: () => void
    hide: () => void
    onClick: (cb: () => void) => void
    offClick: (cb: () => void) => void
  }
  close: () => void
  openLink: (url: string) => void
  openTelegramLink: (url: string) => void
  showAlert: (msg: string) => void
  showConfirm: (msg: string, cb: (ok: boolean) => void) => void
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp
    }
  }
}

export function getTelegram(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null
  return window.Telegram?.WebApp ?? null
}

export function isInTelegram(): boolean {
  const tg = getTelegram()
  return !!tg && tg.initData.length > 0
}

export function init() {
  const tg = getTelegram()
  if (!tg) {
    console.log('[PokeAlert] Running outside Telegram - dev mode')
    return
  }

  tg.ready()
  tg.expand()
  tg.setHeaderColor('#0e0e10')
  tg.setBackgroundColor('#0e0e10')
}

export function haptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  getTelegram()?.HapticFeedback.impactOccurred(type)
}

export function notify(type: 'success' | 'error' | 'warning') {
  getTelegram()?.HapticFeedback.notificationOccurred(type)
}

export function getUser() {
  return getTelegram()?.initDataUnsafe.user ?? null
}

export function openExternal(url: string) {
  const tg = getTelegram()
  if (tg) {
    tg.openLink(url)
  } else {
    window.open(url, '_blank')
  }
}
