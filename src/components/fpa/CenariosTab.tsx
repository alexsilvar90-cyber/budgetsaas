'use client'

import type { ModelOutput, ScenarioKey } from '@/lib/fpa/types'
import type { Assumptions } from '@/lib/fpa/types'
import { runModel, fmtBRL, fmtPct } from '@/lib/fpa/engine'
import { SCENARIOS } from '@/lib/fpa/defaults'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'

interface CenariosTabProps {
  baseAssumptions: Assumptions
  currentOutput: ModelOutput
  currentScenario: ScenarioKey
}

export default function CenariosTab({ baseAssumptions, currentOutput, currentScenario }: CenariosTabProps) {
  const scenarios: ScenarioKey[] = ['base', 'pessimista', 'otimista']

  // Run all 3 scenarios
  const outputs: Record<ScenarioKey, ModelOutput> = {
    base: runModel(baseAssumptions, 'base'),
    pessimista: runModel(baseAssumptions, 'pessimista'),
    otimista: runModel(baseAssumptions, 'otimista'),
  }

  // Key metrics comparison — quarterly
  const quarterlyRows = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35]
  const compData = quarterlyRows.map(idx => {
    const r = outputs.base.rows[idx]
    return {
      label: r.label,
      Base: Math.round(outputs.base.rows[idx].ebitda / 1_000),
      Pessimista: Math.round(outputs.pessimista.rows[idx].ebitda / 1_000),
      Otimista: Math.round(outputs.otimista.rows[idx].ebitda / 1_000),
    }
  })

  const tpvData = quarterlyRows.map(idx => ({
    label: outputs.base.rows[idx].label,
    Base: Math.round(outputs.base.rows[idx].tpv / 1_000_000),
    Pessimista: Math.round(outputs.pessimista.rows[idx].tpv / 1_000_000),
    Otimista: Math.round(outputs.otimista.rows[idx].tpv / 1_000_000),
  }))

  // Radar comparison
  const radarData = [
    { metric: 'TPV', ...Object.fromEntries(scenarios.map(s => [SCENARIOS[s].label, Math.round(outputs[s].summary.totalTPV / 1_000_000)])) },
    { metric: 'Receita', ...Object.fromEntries(scenarios.map(s => [SCENARIOS[s].label, Math.round(outputs[s].summary.totalReceita / 1_000_000)])) },
    { metric: 'EBITDA', ...Object.fromEntries(scenarios.map(s => [SCENARIOS[s].label, Math.round(outputs[s].summary.totalEbitda / 1_000_000)])) },
  ]

  // Summary table
  const metrics: Array<{ label: string; fmt: 'brl-compact' | 'pct' | 'num'; get: (o: ModelOutput) => number }> = [
    { label: 'TPV Total (36m)', fmt: 'brl-compact', get: o => o.summary.totalTPV },
    { label: 'Receita Total (36m)', fmt: 'brl-compact', get: o => o.summary.totalReceita },
    { label: 'EBITDA Total (36m)', fmt: 'brl-compact', get: o => o.summary.totalEbitda },
    { label: 'Mg. EBITDA Média', fmt: 'pct', get: o => o.summary.margemEbitdaMedia },
    { label: 'Perdas Líquidas (36m)', fmt: 'brl-compact', get: o => o.summary.totalPerdasLiquidas },
    { label: 'Take Rate Médio', fmt: 'pct', get: o => o.summary.takeRateMedio },
    { label: 'Clientes Mês 36', fmt: 'num', get: o => o.summary.totalClientes },
    { label: 'Inadimp. Mês 36', fmt: 'pct', get: o => o.rows[35].pctInadimplenciaEfetiva },
    { label: 'Caixa Final (Mês 36)', fmt: 'brl-compact', get: o => o.rows[35].caixaFinal },
  ]

  function fmt(v: number, f: 'brl-compact' | 'pct' | 'num') {
    if (f === 'brl-compact') return fmtBRL(v, true)
    if (f === 'pct') return fmtPct(v)
    return new Intl.NumberFormat('pt-BR').format(Math.round(v))
  }

  return (
    <div className="space-y-6">
      {/* Currently active scenario indicator */}
      <div className="flex items-center gap-3 p-3 bg-surface-card border border-surface-border rounded-xl">
        <span className="text-sm text-surface-muted">Cenário ativo:</span>
        <span
          className="font-semibold text-sm px-3 py-1 rounded-full"
          style={{ background: SCENARIOS[currentScenario].color + '20', color: SCENARIOS[currentScenario].color }}
        >
          {SCENARIOS[currentScenario].label}
        </span>
        <span className="text-xs text-surface-muted ml-2">— altere via o seletor no topo da página</span>
      </div>

      {/* Sensitivity table */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-4">Análise de Sensibilidade — Comparativo de Cenários</h3>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left py-2 pr-6 text-surface-muted text-xs uppercase font-medium">Métrica</th>
                {scenarios.map(s => (
                  <th key={s} className="text-right py-2 px-4 text-xs uppercase font-semibold" style={{ color: SCENARIOS[s].color }}>
                    {SCENARIOS[s].label}
                  </th>
                ))}
                <th className="text-right py-2 px-4 text-xs uppercase font-medium text-surface-muted">Pess. vs Base</th>
                <th className="text-right py-2 px-4 text-xs uppercase font-medium text-surface-muted">Otim. vs Base</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map(m => {
                const vals = { base: m.get(outputs.base), pessimista: m.get(outputs.pessimista), otimista: m.get(outputs.otimista) }
                const dPess = vals.base !== 0 ? (vals.pessimista - vals.base) / Math.abs(vals.base) : 0
                const dOtim = vals.base !== 0 ? (vals.otimista - vals.base) / Math.abs(vals.base) : 0
                return (
                  <tr key={m.label} className="border-b border-surface-border/30 hover:bg-white/[0.02]">
                    <td className="py-2 pr-6 text-surface-muted">{m.label}</td>
                    {scenarios.map(s => (
                      <td key={s} className="py-2 px-4 text-right tabular-nums font-medium" style={{ color: SCENARIOS[s].color }}>
                        {fmt(vals[s], m.fmt)}
                      </td>
                    ))}
                    <td className={`py-2 px-4 text-right tabular-nums text-xs ${dPess >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {dPess > 0 ? '+' : ''}{fmtPct(dPess)}
                    </td>
                    <td className={`py-2 px-4 text-right tabular-nums text-xs ${dOtim >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {dOtim > 0 ? '+' : ''}{fmtPct(dOtim)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* EBITDA comparison chart */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-4">EBITDA por Cenário — Trimestral (R$ K)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={compData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2535" />
            <XAxis dataKey="label" tick={{ fill: '#8b9ab5', fontSize: 10 }} />
            <YAxis tick={{ fill: '#8b9ab5', fontSize: 10 }} tickFormatter={v => `${v}K`} />
            <Tooltip
              contentStyle={{ background: '#161923', border: '1px solid #1f2535', borderRadius: 8 }}
              labelStyle={{ color: '#fff', fontWeight: 600 }}
              formatter={(v: number) => [`R$ ${v}K`, '']}
            />
            <Legend wrapperStyle={{ color: '#8b9ab5', fontSize: 12 }} />
            <Bar dataKey="Pessimista" fill="#f87171" radius={[4,4,0,0]} />
            <Bar dataKey="Base"       fill="#6081f7" radius={[4,4,0,0]} />
            <Bar dataKey="Otimista"   fill="#34d399" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* TPV comparison */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-4">TPV por Cenário — Trimestral (R$ MM)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={tpvData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2535" />
            <XAxis dataKey="label" tick={{ fill: '#8b9ab5', fontSize: 10 }} />
            <YAxis tick={{ fill: '#8b9ab5', fontSize: 10 }} tickFormatter={v => `${v}M`} />
            <Tooltip
              contentStyle={{ background: '#161923', border: '1px solid #1f2535', borderRadius: 8 }}
              labelStyle={{ color: '#fff', fontWeight: 600 }}
              formatter={(v: number) => [`R$ ${v}M`, '']}
            />
            <Legend wrapperStyle={{ color: '#8b9ab5', fontSize: 12 }} />
            <Bar dataKey="Pessimista" fill="#f87171" radius={[4,4,0,0]} />
            <Bar dataKey="Base"       fill="#6081f7" radius={[4,4,0,0]} />
            <Bar dataKey="Otimista"   fill="#34d399" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sensitivity inputs summary */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-3">Premissas de Sensibilidade por Cenário</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-surface-border">
              <th className="text-left py-2 text-surface-muted uppercase">Variável</th>
              {scenarios.map(s => (
                <th key={s} className="text-right py-2 px-4 uppercase" style={{ color: SCENARIOS[s].color }}>{SCENARIOS[s].label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'TPV (multiplicador)', vals: scenarios.map(s => `${SCENARIOS[s].tpvMultiplier.toFixed(2)}x`) },
              { label: 'Inadimplência (mult.)', vals: scenarios.map(s => `${SCENARIOS[s].inadimplenciaMultiplier.toFixed(2)}x`) },
              { label: 'Taxa de Juros (mult.)', vals: scenarios.map(s => `${SCENARIOS[s].txJurosMultiplier.toFixed(2)}x`) },
              { label: 'Custo de Funding (mult.)', vals: scenarios.map(s => `${SCENARIOS[s].custoFundingMultiplier.toFixed(2)}x`) },
              { label: 'Despesas Operacionais (mult.)', vals: scenarios.map(s => `${SCENARIOS[s].despesasMultiplier.toFixed(2)}x`) },
            ].map(row => (
              <tr key={row.label} className="border-b border-surface-border/30">
                <td className="py-2 text-surface-muted">{row.label}</td>
                {row.vals.map((v, i) => (
                  <td key={i} className="py-2 px-4 text-right tabular-nums" style={{ color: SCENARIOS[scenarios[i]].color }}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
