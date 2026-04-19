'use client'

import type { ModelOutput } from '@/lib/fpa/types'
import { fmtBRL, fmtPct } from '@/lib/fpa/engine'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
} from 'recharts'

interface ReceitasTabProps {
  output: ModelOutput
}

export default function ReceitasTab({ output }: ReceitasTabProps) {
  const rows = output.rows
  const chartRows = rows.filter((_, i) => i % 3 === 0 || i === rows.length - 1)

  const stackData = chartRows.map(r => ({
    label: r.label,
    Comissão: Math.round(r.receitaComissao / 1000),
    Antecipação: Math.round(r.receitaAntecipacao / 1000),
    Financiamento: Math.round(r.receitaFinanciamento / 1000),
    Serviços: Math.round(r.receitaServicos / 1000),
    Outras: Math.round(r.receitaOutras / 1000),
  }))

  const takeRateData = chartRows.map(r => ({
    label: r.label,
    'Take Rate': +(r.taxaReceita * 100).toFixed(2),
  }))

  // Annual totals
  const totalByLine = {
    comissao: rows.reduce((s, r) => s + r.receitaComissao, 0),
    antecipacao: rows.reduce((s, r) => s + r.receitaAntecipacao, 0),
    financiamento: rows.reduce((s, r) => s + r.receitaFinanciamento, 0),
    servicos: rows.reduce((s, r) => s + r.receitaServicos, 0),
    outras: rows.reduce((s, r) => s + r.receitaOutras, 0),
    total: rows.reduce((s, r) => s + r.receitaTotal, 0),
  }

  return (
    <div className="space-y-6">
      {/* Mix cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Comissões (MDR)', value: totalByLine.comissao, color: 'text-brand-400' },
          { label: 'Antecipação', value: totalByLine.antecipacao, color: 'text-purple-400' },
          { label: 'Financiamento', value: totalByLine.financiamento, color: 'text-emerald-400' },
          { label: 'Serviços', value: totalByLine.servicos, color: 'text-amber-400' },
          { label: 'Outras', value: totalByLine.outras, color: 'text-cyan-400' },
        ].map(k => (
          <div key={k.label} className="card">
            <p className="text-xs text-surface-muted uppercase tracking-wider">{k.label}</p>
            <p className={`text-lg font-bold mt-1 ${k.color}`}>{fmtBRL(k.value, true)}</p>
            <p className="text-xs text-surface-muted mt-1">{fmtPct(k.value / totalByLine.total)} do total</p>
          </div>
        ))}
      </div>

      {/* Stacked bar */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-4">Mix de Receita por Linha (R$ K)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={stackData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2535" />
            <XAxis dataKey="label" tick={{ fill: '#8b9ab5', fontSize: 10 }} />
            <YAxis tick={{ fill: '#8b9ab5', fontSize: 10 }} tickFormatter={v => `${v}K`} />
            <Tooltip
              contentStyle={{ background: '#161923', border: '1px solid #1f2535', borderRadius: 8 }}
              labelStyle={{ color: '#fff', fontWeight: 600 }}
              formatter={(v: number) => [`R$ ${v}K`, '']}
            />
            <Legend wrapperStyle={{ color: '#8b9ab5', fontSize: 12 }} />
            <Bar dataKey="Comissão"     stackId="a" fill="#6081f7" />
            <Bar dataKey="Antecipação"  stackId="a" fill="#a78bfa" />
            <Bar dataKey="Financiamento" stackId="a" fill="#34d399" />
            <Bar dataKey="Serviços"     stackId="a" fill="#fbbf24" />
            <Bar dataKey="Outras"       stackId="a" fill="#22d3ee" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Take rate evolution */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-4">Take Rate — Receita / TPV (%)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={takeRateData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2535" />
            <XAxis dataKey="label" tick={{ fill: '#8b9ab5', fontSize: 10 }} />
            <YAxis tick={{ fill: '#8b9ab5', fontSize: 10 }} tickFormatter={v => `${v}%`} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{ background: '#161923', border: '1px solid #1f2535', borderRadius: 8 }}
              labelStyle={{ color: '#fff', fontWeight: 600 }}
              formatter={(v: number) => [`${v}%`, 'Take Rate']}
            />
            <Line type="monotone" dataKey="Take Rate" stroke="#6081f7" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Detail table */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-3">Receitas — 36 Meses</h3>
        <div className="overflow-auto max-h-96">
          <table className="min-w-full text-xs">
            <thead className="sticky top-0 bg-surface-card border-b border-surface-border">
              <tr>
                {['Mês','Comissão','Antecipação','Financiamento','Serviços','Outras','Total','Take Rate'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-surface-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50">
              {rows.map(r => (
                <tr key={r.month} className="hover:bg-white/[0.03]">
                  <td className="px-3 py-2 text-white font-medium sticky left-0 bg-surface-card">{r.label}</td>
                  <td className="px-3 py-2 text-brand-300 tabular-nums">{fmtBRL(r.receitaComissao, true)}</td>
                  <td className="px-3 py-2 text-purple-300 tabular-nums">{fmtBRL(r.receitaAntecipacao, true)}</td>
                  <td className="px-3 py-2 text-emerald-300 tabular-nums">{fmtBRL(r.receitaFinanciamento, true)}</td>
                  <td className="px-3 py-2 text-amber-300 tabular-nums">{fmtBRL(r.receitaServicos, true)}</td>
                  <td className="px-3 py-2 text-cyan-300 tabular-nums">{fmtBRL(r.receitaOutras, true)}</td>
                  <td className="px-3 py-2 text-white font-semibold tabular-nums">{fmtBRL(r.receitaTotal, true)}</td>
                  <td className="px-3 py-2 text-surface-muted tabular-nums">{fmtPct(r.taxaReceita, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
