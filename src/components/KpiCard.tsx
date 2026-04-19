import { clsx, formatCurrency, formatPct } from '@/lib/utils'
import type { ReactNode } from 'react'

interface KpiCardProps {
  label: string
  value: number
  format?: 'currency' | 'pct'
  trend?: 'up' | 'down' | 'neutral'
  icon: ReactNode
  color?: 'blue' | 'green' | 'amber' | 'red'
}

const colorMap = {
  blue:   'from-brand-600/20  to-brand-800/10  border-brand-600/30  text-brand-400',
  green:  'from-emerald-600/20 to-emerald-800/10 border-emerald-600/30 text-emerald-400',
  amber:  'from-amber-600/20  to-amber-800/10  border-amber-600/30  text-amber-400',
  red:    'from-red-600/20    to-red-800/10    border-red-600/30    text-red-400',
}

export default function KpiCard({ label, value, format = 'currency', trend = 'neutral', icon, color = 'blue' }: KpiCardProps) {
  const colors = colorMap[color]

  return (
    <div className={clsx('card relative overflow-hidden border bg-gradient-to-br', colors)}>
      {/* Background glow */}
      <div className={clsx('absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-20 bg-current')} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-surface-muted uppercase tracking-wider mb-2">{label}</p>
          <p className="text-2xl font-bold text-white">
            {format === 'currency' ? formatCurrency(value) : formatPct(value)}
          </p>
        </div>
        <div className={clsx('flex-shrink-0 w-10 h-10 rounded-xl bg-current/10 flex items-center justify-center', colors)}>
          {icon}
        </div>
      </div>
    </div>
  )
}
