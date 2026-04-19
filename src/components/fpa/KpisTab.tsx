'use client'

import type { ModelOutput } from '@/lib/fpa/types'
import { fmtBRL, fmtPct, fmtNum } from '@/lib/fpa/engine'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'

interface KpisTabProps {
  output: ModelOutput
}

export default function KpisTab({ output }: KpisTabProps) {
  const rows = output.rows
  const s = output.summary
  const last = rows[rows.length - 1]
  const first = rows[0]

  const tpvGrowth = (last.tpv - first.tpv) / first.tpv
  const clientGrowth = (last.clientesAtivos - first.clientesAtivos) / first.clientesAtivos
  const cac = 450 // R$/client estimated CAC (static assumption for demo)
  const ltv = (last.taxaReceita * last.tpv / last.clientesAtivos) * 36 // simplified LTV

  const kpis = [
    { label: 'TPV Crescimento (36m)', value: tpvGrowth, fmt: 'pct', color: 'text-brand-400', sub: `${fmtBRL(first.tpv, true)} → ${fmtBRL(last.tpv, true)}` },
    { label: 'Take Rate Médio', value: s.takeRateMedio, fmt: 'pct', color: 'text-purple-400', sub: 'Receita / TPV' },
    { label: 'Margem EBITDA Média', value: s.margemEbitdaMedia, fmt: 'pct', color: s.margemEbitdaMedia > 0 ? 'text-emerald-400' : 'text-red-400', sub: 'EBITDA / Receita Líquida' },
    { label: '% Inadimplência Atual', value: last.pctInadimplenciaEfetiva, fmt: 'pct', color: last.pctInadimplenciaEfetiva > 0.06 ? 'text-red-400' : 'text-amber-400', sub: 'Mês 36' },
    { label: 'Perdas Líq. / Carteira', value: last.perdasLiquidasCarteira, fmt: 'pct', color: 'text-orange-400', sub: 'Net loss rate mês 36' },
    { label: 'Base de Clientes', value: last.clientesAtivos, fmt: 'num', color: 'text-cyan-400', sub: `+${fmtPct(clientGrowth)} em 36m` },
    { label: 'CAC Estimado', value: cac, fmt: 'brl', color: 'text-amber-400', sub: 'Custo aquisição por cliente' },
    { label: 'LTV Estimado', value: ltv, fmt: 'brl', color: 'text-emerald-400', sub: `LTV/CAC: ${(ltv / cac).toFixed(1)}x` },
    { label: 'TPV Total (36m)', value: s.totalTPV, fmt: 'brl-compact', color: 'text-brand-300', sub: 'Volume acumulado' },
    { label: 'Receita Total (36m)', value: s.totalReceita, fmt: 'brl-compact', color: 'text-purple-300', sub: 'Receita bruta acumulada' },
    { label: 'EBITDA Total (36m)', value: s.totalEbitda, fmt: 'brl-compact', color: s.totalEbitda > 0 ? 'text-emerald-300' : 'text-red-400', sub: 'EBITDA acumulado' },
    { label: 'Índice de Eficiência', value: 1 - s.margemEbitdaMedia, fmt: 'pct', color: 'text-blue-400', sub: 'Desp. Op. / Receita Líq.' },
  ]

  // KPI evolution chart (quarterly)
  const chartRows = rows.filter((_, i) => i % 3 === 0 || i === rows.length - 1)
  const evolData = chartRows.map(r => ({
    label: r.label,
    'Take Rate %': +(r.taxaReceita * 100).toFixed(2),
    'EBITDA % ': +(r.margemEbitdaPct * 100).toFixed(1),
    'Inadimp. %': +(r.pctInadimplenciaEfetiva * 100).toFixed(2),
  }))

  // Radar data (normalized 0-100)
  const maxTPVGrowth = 1.5
  const radarData = [
    { metric: 'Crescimento', value: Math.min(100, (tpvGrowth / maxTPVGrowth) * 100) },
    { metric: 'Rentabilidade', value: Math.min(100, Math.max(0, s.margemEbitdaMedia * 200)) },
    { metric: 'Take Rate', value: Math.min(100, (s.takeRateMedio / 0.08) * 100) },
    { metric: 'Risco (inv.)', value: Math.max(0, 100 - last.pctInadimplenciaEfetiva * 1000) },
    { metric: 'Eficiência', value: Math.min(100, Math.max(0, s.margemEbitdaMedia * 150)) },
    { metric: 'LTV/CAC', value: Math.min(100, (ltv / cac / 5) * 100) },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="card">
            <p className="text-xs text-surface-muted uppercase tracking-wider leading-tight">{k.label}</p>
            <p className={`text-xl font-bold mt-2 ${k.color}`}>
              {k.fmt === 'pct' ? fmtPct(k.value) :
               k.fmt === 'num' ? fmtNum(k.value) :
               k.fmt === 'brl-compact' ? fmtBRL(k.value, true) :
               fmtBRL(k.value)}
            </p>
            {k.sub && <p className="text-xs text-surface-muted mt-1">{k.sub}</p>}
          </div>
        ))}
      </div>

      {/* Evolution + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-4">KPIs % — Evolução Trimestral</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={evolData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2535" />
              <XAxis dataKey="label" tick={{ fill: '#8b9ab5', fontSize: 10 }} />
              <YAxis tick={{ fill: '#8b9ab5', fontSize: 10 }} tickFormatter={v => `${v}%`} />
              <Tooltip
                contentStyle={{ background: '#161923', border: '1px solid #1f2535', borderRadius: 8 }}
                labelStyle={{ color: '#fff', fontWeight: 600 }}
                formatter={(v: number) => [`${v}%`, '']}
              />
              <Legend wrapperStyle={{ color: '#8b9ab5', fontSize: 12 }} />
              <Line type="monotone" dataKey="Take Rate %" stroke="#a78bfa" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="EBITDA % " stroke="#34d399" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Inadimp. %" stroke="#f87171" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-4">Scorecard de Performance (Mês 36)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="#1f2535" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#8b9ab5', fontSize: 11 }} />
              <Radar name="Performance" dataKey="value" stroke="#6081f7" fill="#6081f7" fillOpacity={0.3} />
              <Tooltip
                contentStyle={{ background: '#161923', border: '1px solid #1f2535', borderRadius: 8 }}
                formatter={(v: number) => [`${v.toFixed(0)}/100`, 'Score']}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
