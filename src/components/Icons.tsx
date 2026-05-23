/**
 * Wrappers Lucide pour standardiser tailles et stroke-width sur l'app.
 * Une seule source pour les icônes — pas d'emoji dans le produit fini.
 */

import type { LucideProps } from 'lucide-react'
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BellRing,
  Box,
  Check,
  ChevronRight,
  CircleDot,
  Clock,
  Flame,
  Home,
  LayoutGrid,
  ListChecks,
  MapPin,
  MoreHorizontal,
  Package,
  Pause,
  Play,
  Plus,
  Power,
  Search,
  Settings,
  Sparkles,
  Store,
  TrendingUp,
  Wifi,
  WifiOff,
  X,
  Zap,
} from 'lucide-react'

const baseProps: Partial<LucideProps> = {
  strokeWidth: 1.6,
  absoluteStrokeWidth: false,
}

export const Icon = {
  Activity: (p: LucideProps) => <Activity {...baseProps} {...p} />,
  ArrowRight: (p: LucideProps) => <ArrowRight {...baseProps} {...p} />,
  ArrowUpRight: (p: LucideProps) => <ArrowUpRight {...baseProps} {...p} />,
  BellRing: (p: LucideProps) => <BellRing {...baseProps} {...p} />,
  Box: (p: LucideProps) => <Box {...baseProps} {...p} />,
  Check: (p: LucideProps) => <Check {...baseProps} {...p} />,
  ChevronRight: (p: LucideProps) => <ChevronRight {...baseProps} {...p} />,
  CircleDot: (p: LucideProps) => <CircleDot {...baseProps} {...p} />,
  Clock: (p: LucideProps) => <Clock {...baseProps} {...p} />,
  Flame: (p: LucideProps) => <Flame {...baseProps} {...p} />,
  Home: (p: LucideProps) => <Home {...baseProps} {...p} />,
  LayoutGrid: (p: LucideProps) => <LayoutGrid {...baseProps} {...p} />,
  ListChecks: (p: LucideProps) => <ListChecks {...baseProps} {...p} />,
  MapPin: (p: LucideProps) => <MapPin {...baseProps} {...p} />,
  More: (p: LucideProps) => <MoreHorizontal {...baseProps} {...p} />,
  Package: (p: LucideProps) => <Package {...baseProps} {...p} />,
  Pause: (p: LucideProps) => <Pause {...baseProps} {...p} />,
  Play: (p: LucideProps) => <Play {...baseProps} {...p} />,
  Plus: (p: LucideProps) => <Plus {...baseProps} {...p} />,
  Power: (p: LucideProps) => <Power {...baseProps} {...p} />,
  Search: (p: LucideProps) => <Search {...baseProps} {...p} />,
  Settings: (p: LucideProps) => <Settings {...baseProps} {...p} />,
  Sparkles: (p: LucideProps) => <Sparkles {...baseProps} {...p} />,
  Store: (p: LucideProps) => <Store {...baseProps} {...p} />,
  TrendingUp: (p: LucideProps) => <TrendingUp {...baseProps} {...p} />,
  Wifi: (p: LucideProps) => <Wifi {...baseProps} {...p} />,
  WifiOff: (p: LucideProps) => <WifiOff {...baseProps} {...p} />,
  X: (p: LucideProps) => <X {...baseProps} {...p} />,
  Zap: (p: LucideProps) => <Zap {...baseProps} {...p} />,
}
