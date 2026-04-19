'use client'

import type { ModelOutput } from '@/lib/fpa/types'
import { fmtBRL, fmtPct } from '@/lib/fpa/engine'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

interface DreTabProps {
  output: ModelOutput
}

function pctOf(num: number, base: number): string {
  if (!base) return '-'
  return `${((num / base) * 100).toFixed(1)}%`
}

export default function DreTab({ output }: DreTabProps) {
  const rows = output.rows
  const chartRows = rows.filter((_, i) => i % 3 === 0 || i === rows.length - 1)

  const dreData = chartRows.map(r => ({
    label: r.label,
    'Receita Bruta': Math.round(r.receitaTotal / 1000),
    'EBITDA': Math.round(r.ebitda / 1000),
    'Lucro Líquido': Math.round(r.lucroLiquido / 1000),
    'Margem EBITDA %': +(r.margemEbitdaPct * 100).toFixed(1),
  }))

  // Aggregate 36-month P&L
  const tot = {
    receita: rows.reduce((s, r) => s + r.receitaTotal, 0),
    deducoes: rows.reduce((s, r) => s + r.deducoes, 0),
    receitaLiquida: rows.reduce((s, r) => s + r.receitaLiquida, 0),
    custoVariavel: rows.reduce((s, r) => s + r.custoVariavel, 0),
    pcld: rows.reduce((s, r) => s + r.pcld, 0),
    margemBruta: rows.reduce((s, r) => s + r.margemBruta, 0),
    pessoal: rows.reduce((s, r) => s + r.despesasPessoal, 0),
    marketing: rows.reduce((s, r) => s + r.despesasMarketing, 0),
    tecnologia: rows.reduce((s, r) => s + r.despesasTecnologia, 0),
    admin: rows.reduce((s, r) => s + r.despesasAdmin, 0),
    despesasOp: rows.reduce((s, r) => s + r.despesasOperacionais, 0),
    ebitda: rows.reduce((s, r) => s + r.ebitda, 0),
    resultFin: rows.reduce((s, r) => s + r.resultadoFinanceiro, 0),
    perdasLiq: rows.reduce((s, r) => s + r.perdasLiquidas, 0),
    lucroLiquido: rows.reduce((s, r) => s + r.lucroLiquido, 0),
  }

  const dreLines: Array<{ label: string; value: number; bold?: boolean; highlight?: boolean; indent?: boolean; negative?: boolean }> = [
    { label: '(+) Receita Bruta Total',         value: tot.receita,      bold: true },
    { label: '  (-) Deduções (PIS/COFINS)',       value: -tot.deducoes,   indent: true, negative: true },
    { label: '= Receita Líquida',                value: tot.receitaLiquida, bold: true },
    { label: '  (-) Custos Variáveis',              value: -tot.custoVariavel, indent: true, negative: true },
    { label: '  (-) PCLD (Provisão)',               value: -tot.pcld,       indent: true, negative: true },
    { label: '= Margem Bruta',                   value: tot.margemBruta,  bold: true, highlight: true },
    { label: '  (-) Pessoal',                       value: -tot.pessoal,    indent: true, negative: true },
    { label: '  (-) Marketing',                     value: -tot.marketing,  indent: true, negative: true },
    { label: '  (-) Tecnologia',                    value: -tot.tecnologia, indent: true, negative: true },
    { label: '  (-) Administrativo',                value: -tot.admin,      indent: true, negative: true },
    { label: '= Despesas Operacionais',          value: -tot.despesasOp, bold: true, negative: true },
    { label: '= EBITDA',                         value: tot.ebitda,       bold: true, highlight: true },
    { label: '  (+/-) Result. Financeiro',         value: tot.resultFin,   indent: true },
    { label: '  (-) Perdas Líquidas',              value: -tot.perdasLiq,  indent: true, negative: true },
    { label: '= Lucro Líquido',                  value: tot.lucroLiquido, bold: true, highlight: true },
  ]

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Receita Líquida (36m)', v: tot.receitaLiquida },
          { label: 'EBITDA (36m)', v: tot.ebitda, color: 'text-brand-400' },
          { label: 'Mg. EBITDA Média', v: tot.ebitda / tot.receitaLiquida, fmt: 'pct' as const },
          { label: 'Lucro Líquido (36m)', v: tot.lucroLiquido, color: 'text-emerald-400' },
        ].map(k => (
          <div key={k.label} className="card">
            <p className="text-xs text-surface-muted uppercase tracking-wider">{k.label}</p>
            <p className={`text-xl font-bold mt-1 ${k.color ?? 'text-white'}`}>
              {k.fmt === 'pct' ? fmtPct(k.v) : fmtBRL(k.v, true)}
            </p>
          </div>
        ))}
      </div>

      {/* DRE Chart */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-4">DRE — Evolução Mensal (R$ K)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={dreData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2535" />
            <XAxis dataKey="label" tick={{ fill: '#8b9ab5', fontSize: 10 }} />
            <YAxis yAxisId="left" tick={{ fill: '#8b9ab5', fontSize: 10 }} tickFormatter={v => `${v}K`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#8b9ab5', fontSize: 10 }} tickFormatter={v => `${v}%`} domain={['auto','auto']} />
            <Tooltip
              contentStyle={{ background: '#161923', border: '1px solid #1f2535', borderRadius: 8 }}
              labelStyle={{ color: '#fff', fontWeight: 600 }}
              formatter={(v: number, name: string) => [name.includes('%') ? `${v}%` : `R$ ${v}K`, name]}
            />
            <Legend wrapperStyle={{ color: '#8b9ab5', fontSize: 12 }} />
            <Bar yAxisId="left" dataKey="Receita Bruta" fill="#3d57f2" radius={[4,4,0,0]} opacity={0.7} />
            <Bar yAxisId="left" dataKey="EBITDA"        fill="#6081f7" radius={[4,4,0,0]} />
            <Bar yAxisId="left" dataKey="Lucro Líquido" fill="#34d399" radius={[4,4,0,0]} />
            <Line yAxisId="right" type="monotone" dataKey="Margem EBITDA %" stroke="#fbbf24" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* DRE Gerencial Summary Table */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-3">DRE Gerencial — Acumulado 36 Meses</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border">
              <th className="text-left py-2 text-surface-muted font-medium text-xs uppercase">Linha</th>
              <th className="text-right py-2 text-surface-muted font-medium text-xs uppercase">Total 36m</th>
              <th className="text-right py-2 text-surface-muted font-medium text-xs uppercase">% Receita Líq.</th>
            </tr>
          </thead>
          <tbody>
            {dreLines.map((line, i) => (
              <tr
                key={i}
                className={`border-b border-surface-border/30 ${
                  line.highlight ? 'bg-brand-900/20' : ''
                }`}
              >
                <td className={`py-2 pr-4 ${line.bold ? 'font-semibold text-white' : 'text-surface-muted'}`}>
                  {line.label}
                </td>
                <td className={`py-2 text-right tabular-nums font-mono ${
                  line.highlight ? 'text-brand-300 font-bold' :
                  line.negative ? 'text-red-400' :
                  line.bold ? 'text-white font-semibold' : 'text-surface-muted'
                }`}>
                  {fmtBRL(line.value, true)}
                </td>
                <td className="py-2 text-right tabular-nums text-surface-muted text-xs">
                  {pctOf(Math.abs(line.value), tot.receitaLiquida)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Monthly DRE Detail */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-3">DRE Mensal — 36 Meses</h3>
        <div className="overflow-auto max-h-96">
          <table className="min-w-full text-xs">
            <thead className="sticky top-0 bg-surface-card border-b border-surface-border">
              <tr>
                {['Mês','Rec. Bruta','Rec. Líq.','Mg. Bruta','Desp. Op.','EBITDA','Mg. EBITDA','Res. Fin.','Lucro Líq.'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-surface-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50">
              {rows.map(r => (
                <tr key={r.month} className="hover:bg-white/[0.03]">
                  <td className="px-3 py-2 text-white font-medium sticky left-0 bg-surface-card">{r.label}</td>
                  <td className="px-3 py-2 text-surface-muted tabular-nums">{fmtBRL(r.receitaTotal, true)}</td>
                  <td className="px-3 py-2 text-surface-muted tabular-nums">{fmtBRL(r.receitaLiquida, true)}</td>
                  <td className="px-3 py-2 text-cyan-300 tabular-nums">{fmtBRL(r.margemBruta, true)}</td>
                  <td className="px-3 py-2 text-red-400 tabular-nums">{fmtBRL(-r.despesasOperacionais, true)}</td>
                  <td className={`px-3 py-2 font-semibold tabular-nums ${r.ebitda >= 0 ? 'text-brand-300' : 'text-red-400'}`}>{fmtBRL(r.ebitda, true)}</td>
                  <td className="px-3 py-2 text-surface-muted tabular-nums">{fmtPct(r.margemEbitdaPct)}</td>
                  <td className={`px-3 py-2 tabular-nums ${r.resultadoFinanceiro >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmtBRL(r.resultadoFinanceiro, true)}</td>
                  <td className={`px-3 py-2 font-semibold tabular-nums ${r.lucroLiquido >= 0 ? 'text-emerald-300' : 'text-red-400'}`}>{fmtBRL(r.lucroLiquido, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
