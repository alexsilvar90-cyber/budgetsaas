'use client'

import { fmtBRL, fmtPct } from '@/lib/fpa/engine'

interface FpaKpiCardProps {
  label: string
  value: number
  format?: 'brl' | 'pct' | 'num' | 'brl-compact'
  sub?: string
  trend?: 'up' | 'down' | 'neutral'
  goodTrend?: 'up' | 'down' // which direction is "good"
  color?: 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'cyan'
}

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  blue:   { bg: 'bg-blue-900/20',   text: 'text-blue-400',   border: 'border-blue-800/30' },
  green:  { bg: 'bg-emerald-900/20',text: 'text-emerald-400',border: 'border-emerald-800/30' },
  red:    { bg: 'bg-red-900/20',    text: 'text-red-400',    border: 'border-red-800/30' },
  amber:  { bg: 'bg-amber-900/20',  text: 'text-amber-400',  border: 'border-amber-800/30' },
  purple: { bg: 'bg-purple-900/20', text: 'text-purple-400', border: 'border-purple-800/30' },
  cyan:   { bg: 'bg-cyan-900/20',   text: 'text-cyan-400',   border: 'border-cyan-800/30' },
}

export default function FpaKpiCard({ label, value, format = 'brl', sub, color = 'blue' }: FpaKpiCardProps) {
  const c = colorMap[color]

  let displayValue: string
  if (format === 'brl') displayValue = fmtBRL(value)
  else if (format === 'brl-compact') displayValue = fmtBRL(value, true)
  else if (format === 'pct') displayValue = fmtPct(value)
  else displayValue = new Intl.NumberFormat('pt-BR').format(Math.round(value))

  return (
    <div className={`card ${c.bg} border ${c.border} flex flex-col gap-2`}>
      <p className="text-xs font-medium text-surface-muted uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold ${c.text} leading-none`}>{displayValue}</p>
      {sub && <p className="text-xs text-surface-muted">{sub}</p>}
    </div>
  )
}
