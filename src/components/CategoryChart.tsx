'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { CategoryChartItem } from '@/types'

interface CategoryChartProps {
  data: CategoryChartItem[]
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

export default function CategoryChart({ data }: CategoryChartProps) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-white mb-4">Orçado vs. Realizado por Categoria</h3>
      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-surface-muted text-sm">
          Sem dados para exibir
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2535" vertical={false} />
            <XAxis
              dataKey="category"
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
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Legend
              formatter={v => <span style={{ color: '#8b9ab5', fontSize: 12 }}>{v === 'budget' ? 'Orçado' : 'Realizado'}</span>}
            />
            <Bar dataKey="budget"  name="budget"  fill="#2637e7" radius={[4,4,0,0]} />
            <Bar dataKey="actual"  name="actual"  fill="#10b981" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
