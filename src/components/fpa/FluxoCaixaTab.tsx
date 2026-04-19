'use client'

import type { ModelOutput } from '@/lib/fpa/types'
import { fmtBRL } from '@/lib/fpa/engine'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

interface FluxoCaixaTabProps {
  output: ModelOutput
}

export default function FluxoCaixaTab({ output }: FluxoCaixaTabProps) {
  const rows = output.rows
  const chartRows = rows.filter((_, i) => i % 3 === 0 || i === rows.length - 1)

  const data = chartRows.map(r => ({
    label: r.label,
    'Cx. Operacional': Math.round(r.caixaOperacional / 1_000_000),
    'Variação Carteira': Math.round(r.variacaoCarteira / 1_000_000),
    'Investimentos': Math.round(r.investimentos / 1_000_000),
    'Caixa Final': Math.round(r.caixaFinal / 1_000_000),
  }))

  const totalCxOp = rows.reduce((s, r) => s + r.caixaOperacional, 0)
  const totalFunding = rows.reduce((s, r) => s + r.necessidadeFunding, 0)
  const caixaFinal = rows[35].caixaFinal

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-xs text-surface-muted uppercase tracking-wider">Geração de Caixa Operacional (36m)</p>
          <p className={`text-xl font-bold mt-1 ${totalCxOp >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmtBRL(totalCxOp, true)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-surface-muted uppercase tracking-wider">Necessidade de Funding (36m)</p>
          <p className="text-xl font-bold mt-1 text-amber-400">{fmtBRL(totalFunding, true)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-surface-muted uppercase tracking-wider">Caixa Final (Mês 36)</p>
          <p className={`text-xl font-bold mt-1 ${caixaFinal >= 0 ? 'text-brand-400' : 'text-red-400'}`}>{fmtBRL(caixaFinal, true)}</p>
        </div>
      </div>

      {/* Caixa Chart */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-4">Evolução do Caixa (R$ MM)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2535" />
            <XAxis dataKey="label" tick={{ fill: '#8b9ab5', fontSize: 10 }} />
            <YAxis yAxisId="bar" tick={{ fill: '#8b9ab5', fontSize: 10 }} tickFormatter={v => `${v}M`} />
            <YAxis yAxisId="line" orientation="right" tick={{ fill: '#8b9ab5', fontSize: 10 }} tickFormatter={v => `${v}M`} />
            <Tooltip
              contentStyle={{ background: '#161923', border: '1px solid #1f2535', borderRadius: 8 }}
              labelStyle={{ color: '#fff', fontWeight: 600 }}
              formatter={(v: number) => [`R$ ${v}M`, '']}
            />
            <Legend wrapperStyle={{ color: '#8b9ab5', fontSize: 12 }} />
            <Bar yAxisId="bar" dataKey="Cx. Operacional"   fill="#34d399" radius={[4,4,0,0]} />
            <Bar yAxisId="bar" dataKey="Variação Carteira" fill="#fbbf24" radius={[4,4,0,0]} />
            <Bar yAxisId="bar" dataKey="Investimentos"     fill="#f87171" radius={[4,4,0,0]} />
            <Line yAxisId="line" type="monotone" dataKey="Caixa Final" stroke="#6081f7" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-3">Fluxo de Caixa — 36 Meses</h3>
        <div className="overflow-auto max-h-96">
          <table className="min-w-full text-xs">
            <thead className="sticky top-0 bg-surface-card border-b border-surface-border">
              <tr>
                {['Mês','Cx. Operacional','Variação Carteira','Funding Necessário','Investimentos','Caixa Final'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-surface-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50">
              {rows.map(r => (
                <tr key={r.month} className="hover:bg-white/[0.03]">
                  <td className="px-3 py-2 text-white font-medium sticky left-0 bg-surface-card">{r.label}</td>
                  <td className={`px-3 py-2 tabular-nums ${r.caixaOperacional >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmtBRL(r.caixaOperacional, true)}</td>
                  <td className="px-3 py-2 text-amber-300 tabular-nums">{fmtBRL(r.variacaoCarteira, true)}</td>
                  <td className="px-3 py-2 text-red-300 tabular-nums">{fmtBRL(r.necessidadeFunding, true)}</td>
                  <td className="px-3 py-2 text-red-400 tabular-nums">{fmtBRL(r.investimentos, true)}</td>
                  <td className={`px-3 py-2 font-semibold tabular-nums ${r.caixaFinal >= 0 ? 'text-brand-300' : 'text-red-400'}`}>{fmtBRL(r.caixaFinal, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
