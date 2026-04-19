'use client'

import type { ModelOutput } from '@/lib/fpa/types'
import { fmtBRL, fmtPct } from '@/lib/fpa/engine'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

interface RiscoTabProps {
  output: ModelOutput
}

export default function RiscoTab({ output }: RiscoTabProps) {
  const rows = output.rows
  const chartRows = rows.filter((_, i) => i % 3 === 0 || i === rows.length - 1)

  const pcldData = chartRows.map(r => ({
    label: r.label,
    PCLD: Math.round(r.pcld / 1000),
    Perdas: Math.round(r.perdas / 1000),
    Recuperação: Math.round(r.recuperacao / 1000),
    'Perdas Líquidas': Math.round(r.perdasLiquidas / 1000),
  }))

  const inadimplData = chartRows.map(r => ({
    label: r.label,
    'Inadimplência %': +(r.pctInadimplenciaEfetiva * 100).toFixed(2),
    'Perdas/Carteira %': +(r.perdasLiquidasCarteira * 100).toFixed(2),
  }))

  const totalPerdas = rows.reduce((s, r) => s + r.perdas, 0)
  const totalRecuperacao = rows.reduce((s, r) => s + r.recuperacao, 0)
  const totalPerdasLiquidas = rows.reduce((s, r) => s + r.perdasLiquidas, 0)
  const totalPCLD = rows.reduce((s, r) => s + r.pcld, 0)

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total PCLD (36m)', value: fmtBRL(totalPCLD, true), color: 'text-amber-400' },
          { label: 'Total Perdas', value: fmtBRL(totalPerdas, true), color: 'text-red-400' },
          { label: 'Total Recuperação', value: fmtBRL(totalRecuperacao, true), color: 'text-emerald-400' },
          { label: 'Perdas Líquidas', value: fmtBRL(totalPerdasLiquidas, true), color: 'text-red-300' },
        ].map(k => (
          <div key={k.label} className="card">
            <p className="text-xs text-surface-muted uppercase tracking-wider">{k.label}</p>
            <p className={`text-xl font-bold mt-1 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* PCLD & Perdas */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-4">PCLD, Perdas e Recuperação (R$ K)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={pcldData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2535" />
            <XAxis dataKey="label" tick={{ fill: '#8b9ab5', fontSize: 10 }} />
            <YAxis tick={{ fill: '#8b9ab5', fontSize: 10 }} tickFormatter={v => `${v}K`} />
            <Tooltip
              contentStyle={{ background: '#161923', border: '1px solid #1f2535', borderRadius: 8 }}
              labelStyle={{ color: '#fff', fontWeight: 600 }}
              formatter={(v: number) => [`R$ ${v}K`, '']}
            />
            <Legend wrapperStyle={{ color: '#8b9ab5', fontSize: 12 }} />
            <Bar dataKey="PCLD"            fill="#fbbf24" radius={[4,4,0,0]} />
            <Bar dataKey="Perdas"          fill="#f87171" radius={[4,4,0,0]} />
            <Bar dataKey="Recuperação"     fill="#34d399" radius={[4,4,0,0]} />
            <Bar dataKey="Perdas Líquidas" fill="#fb923c" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Inadimplência */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-4">Evolução da Inadimplência e Perda/Carteira (%)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={inadimplData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="inadGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f87171" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2535" />
            <XAxis dataKey="label" tick={{ fill: '#8b9ab5', fontSize: 10 }} />
            <YAxis tick={{ fill: '#8b9ab5', fontSize: 10 }} tickFormatter={v => `${v}%`} />
            <Tooltip
              contentStyle={{ background: '#161923', border: '1px solid #1f2535', borderRadius: 8 }}
              labelStyle={{ color: '#fff', fontWeight: 600 }}
              formatter={(v: number) => [`${v}%`, '']}
            />
            <Legend wrapperStyle={{ color: '#8b9ab5', fontSize: 12 }} />
            <Area type="monotone" dataKey="Inadimplência %" stroke="#f87171" fill="url(#inadGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="Perdas/Carteira %" stroke="#fb923c" fill="none" strokeWidth={2} strokeDasharray="4 2" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-3">Risco — 36 Meses</h3>
        <div className="overflow-auto max-h-96">
          <table className="min-w-full text-xs">
            <thead className="sticky top-0 bg-surface-card border-b border-surface-border">
              <tr>
                {['Mês','% Inadimp.','PCLD','Perdas','Recuperação','Perdas Líq.','Perd./Carteira'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-surface-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50">
              {rows.map(r => (
                <tr key={r.month} className="hover:bg-white/[0.03]">
                  <td className="px-3 py-2 text-white font-medium sticky left-0 bg-surface-card">{r.label}</td>
                  <td className="px-3 py-2 text-red-400 tabular-nums">{fmtPct(r.pctInadimplenciaEfetiva, 2)}</td>
                  <td className="px-3 py-2 text-amber-300 tabular-nums">{fmtBRL(r.pcld, true)}</td>
                  <td className="px-3 py-2 text-red-300 tabular-nums">{fmtBRL(r.perdas, true)}</td>
                  <td className="px-3 py-2 text-emerald-300 tabular-nums">{fmtBRL(r.recuperacao, true)}</td>
                  <td className="px-3 py-2 text-red-400 font-semibold tabular-nums">{fmtBRL(r.perdasLiquidas, true)}</td>
                  <td className="px-3 py-2 text-surface-muted tabular-nums">{fmtPct(r.perdasLiquidasCarteira, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
