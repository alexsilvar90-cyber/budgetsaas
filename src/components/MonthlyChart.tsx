'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { MonthlyChartItem } from '@/types'

interface MonthlyChartProps {
  data: MonthlyChartItem[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-card border border-surface-border rounded-lg p-3 shadow-xl text-sm">
      <p className="font-medium text-white mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="flex justify-between gap-4">
          <span>{p.name === 'budget' ? 'Orçado' : 'Realizado'}</span>
          <span className="font-medium">{formatCurrency(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

export default function MonthlyChart({ data }: MonthlyChartProps) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-white mb-4">Evolução Mensal</h3>
      {data.every(d => d.budget === 0 && d.actual === 0) ? (
        <div className="h-64 flex items-center justify-center text-surface-muted text-sm">
          Sem dados para exibir
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2535" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: '#8b9ab5', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`}
              tick={{ fill: '#8b9ab5', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={v => <span style={{ color: '#8b9ab5', fontSize: 12 }}>{v === 'budget' ? 'Orçado' : 'Realizado'}</span>}
            />
            <Line
              type="monotone" dataKey="budget" name="budget"
              stroke="#2637e7" strokeWidth={2} dot={{ r: 3, fill: '#2637e7' }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone" dataKey="actual" name="actual"
              stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
