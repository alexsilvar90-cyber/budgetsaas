'use client'

import type { ModelOutput } from '@/lib/fpa/types'
import { fmtBRL, fmtNum } from '@/lib/fpa/engine'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

interface OperacionalTabProps {
  output: ModelOutput
}

export default function OperacionalTab({ output }: OperacionalTabProps) {
  const rows = output.rows
  // Sample every 3 months for chart readability
  const chartRows = rows.filter((_, i) => i % 3 === 0 || i === rows.length - 1)

  const tpvData = chartRows.map(r => ({
    label: r.label,
    TPV: Math.round(r.tpv / 1_000_000),
    Carteira: Math.round(r.carteira / 1_000_000),
  }))

  const clienteData = chartRows.map(r => ({
    label: r.label,
    Clientes: r.clientesAtivos,
    'Novos': r.novosClientes,
    'Churn': -r.churn,
  }))

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'TPV Mês 36', value: fmtBRL(rows[35].tpv, true), color: 'text-brand-400' },
          { label: 'Carteira Mês 36', value: fmtBRL(rows[35].carteira, true), color: 'text-purple-400' },
          { label: 'Clientes Mês 36', value: fmtNum(rows[35].clientesAtivos), color: 'text-emerald-400' },
          { label: 'Tx/Mês Mês 36', value: fmtNum(rows[35].numTransacoes), color: 'text-amber-400' },
        ].map(k => (
          <div key={k.label} className="card">
            <p className="text-xs text-surface-muted uppercase tracking-wider">{k.label}</p>
            <p className={`text-xl font-bold mt-1 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* TPV & Carteira Chart */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-4">TPV e Carteira de Crédito (R$ MM)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={tpvData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="tpvGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6081f7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6081f7" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="carteiraGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2535" />
            <XAxis dataKey="label" tick={{ fill: '#8b9ab5', fontSize: 10 }} />
            <YAxis tick={{ fill: '#8b9ab5', fontSize: 10 }} tickFormatter={v => `${v}M`} />
            <Tooltip
              contentStyle={{ background: '#161923', border: '1px solid #1f2535', borderRadius: 8 }}
              labelStyle={{ color: '#fff', fontWeight: 600 }}
              formatter={(v: number) => [`R$ ${v}M`, '']}
            />
            <Legend wrapperStyle={{ color: '#8b9ab5', fontSize: 12 }} />
            <Area type="monotone" dataKey="TPV" stroke="#6081f7" fill="url(#tpvGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="Carteira" stroke="#a78bfa" fill="url(#carteiraGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Clients Chart */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-4">Base de Clientes</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={clienteData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2535" />
            <XAxis dataKey="label" tick={{ fill: '#8b9ab5', fontSize: 10 }} />
            <YAxis tick={{ fill: '#8b9ab5', fontSize: 10 }} tickFormatter={v => fmtNum(v)} />
            <Tooltip
              contentStyle={{ background: '#161923', border: '1px solid #1f2535', borderRadius: 8 }}
              labelStyle={{ color: '#fff', fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ color: '#8b9ab5', fontSize: 12 }} />
            <Bar dataKey="Clientes" fill="#6081f7" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Novos" fill="#34d399" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Churn" fill="#f87171" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly table */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-3">Tabela Operacional — 36 Meses</h3>
        <div className="overflow-auto max-h-96">
          <table className="min-w-full text-xs">
            <thead className="sticky top-0 bg-surface-card border-b border-surface-border">
              <tr>
                {['Mês','Clientes','Novos','Churn','Transações','TPV','Carteira','Rotativo','Parcelado'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-surface-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50">
              {rows.map(r => (
                <tr key={r.month} className="hover:bg-white/[0.03]">
                  <td className="px-3 py-2 text-white font-medium sticky left-0 bg-surface-card">{r.label}</td>
                  <td className="px-3 py-2 text-surface-muted tabular-nums">{fmtNum(r.clientesAtivos)}</td>
                  <td className="px-3 py-2 text-emerald-400 tabular-nums">+{fmtNum(r.novosClientes)}</td>
                  <td className="px-3 py-2 text-red-400 tabular-nums">-{fmtNum(r.churn)}</td>
                  <td className="px-3 py-2 text-surface-muted tabular-nums">{fmtNum(r.numTransacoes)}</td>
                  <td className="px-3 py-2 text-brand-300 tabular-nums">{fmtBRL(r.tpv, true)}</td>
                  <td className="px-3 py-2 text-purple-300 tabular-nums">{fmtBRL(r.carteira, true)}</td>
                  <td className="px-3 py-2 text-amber-300 tabular-nums">{fmtBRL(r.carteiraRotativo, true)}</td>
                  <td className="px-3 py-2 text-cyan-300 tabular-nums">{fmtBRL(r.carteiraParcelada, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
