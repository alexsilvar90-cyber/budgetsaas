'use client'

import type { ModelOutput } from '@/lib/fpa/types'
import { fmtBRL, fmtPct, fmtNum } from '@/lib/fpa/engine'

interface OrcamentoTabProps {
  output: ModelOutput
}

function variance(actual: number, budget: number) {
  const abs = actual - budget
  const pct = budget !== 0 ? abs / Math.abs(budget) : 0
  return { abs, pct }
}

function varianceColor(v: number, positiveIsGood = true) {
  if (Math.abs(v) < 0.02) return 'text-surface-muted'
  if (positiveIsGood) return v > 0 ? 'text-emerald-400' : 'text-red-400'
  return v < 0 ? 'text-emerald-400' : 'text-red-400'
}

export default function OrcamentoTab({ output }: OrcamentoTabProps) {
  const rows = output.rows

  // Build comparison rows
  const comparison = rows.map(r => {
    const vReceita = variance(r.realizado.receita, r.orcado.receita)
    const vDespesas = variance(r.realizado.despesas, r.orcado.despesas)
    const vEbitda = variance(r.realizado.ebitda, r.orcado.ebitda)
    const vTPV = variance(r.realizado.tpv, r.orcado.tpv)
    return { r, vReceita, vDespesas, vEbitda, vTPV }
  })

  // Annual summary
  const totOrcReceita = rows.reduce((s, r) => s + r.orcado.receita, 0)
  const totRealReceita = rows.reduce((s, r) => s + r.realizado.receita, 0)
  const totOrcEbitda = rows.reduce((s, r) => s + r.orcado.ebitda, 0)
  const totRealEbitda = rows.reduce((s, r) => s + r.realizado.ebitda, 0)
  const totOrcTPV = rows.reduce((s, r) => s + r.orcado.tpv, 0)
  const totRealTPV = rows.reduce((s, r) => s + r.realizado.tpv, 0)

  const summaryVars = [
    { label: 'Receita Total', orc: totOrcReceita, real: totRealReceita, positiveGood: true },
    { label: 'EBITDA', orc: totOrcEbitda, real: totRealEbitda, positiveGood: true },
    { label: 'TPV', orc: totOrcTPV, real: totRealTPV, positiveGood: true },
  ]

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {summaryVars.map(s => {
          const v = variance(s.real, s.orc)
          const col = varianceColor(v.pct, s.positiveGood)
          return (
            <div key={s.label} className="card space-y-3">
              <p className="text-sm font-semibold text-white">{s.label} — Acumulado 36m</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-surface-muted uppercase tracking-wider mb-1">Orçado</p>
                  <p className="text-white font-semibold">{fmtBRL(s.orc, true)}</p>
                </div>
                <div>
                  <p className="text-surface-muted uppercase tracking-wider mb-1">Realizado</p>
                  <p className="text-white font-semibold">{fmtBRL(s.real, true)}</p>
                </div>
              </div>
              <div className={`text-sm font-bold ${col}`}>
                Desvio: {fmtBRL(v.abs, true)} ({v.pct > 0 ? '+' : ''}{fmtPct(v.pct)})
              </div>
            </div>
          )
        })}
      </div>

      {/* Header explanation */}
      <div className="p-3 bg-amber-900/10 border border-amber-800/30 rounded-xl text-xs text-amber-300">
        <strong>Nota:</strong> Os valores &quot;Realizado&quot; são simulados com variações aleatórias determinísticas (±8%) sobre o orçado, para demonstração do modelo. Em produção, conectar à base de dados real.
      </div>

      {/* Budget vs Actual table */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-3">Budget vs. Realizado — Detalhe Mensal</h3>
        <div className="overflow-auto max-h-[480px]">
          <table className="min-w-full text-xs">
            <thead className="sticky top-0 bg-surface-card border-b border-surface-border z-10">
              <tr>
                <th className="px-3 py-3 text-left text-surface-muted uppercase sticky left-0 bg-surface-card z-20">Mês</th>
                <th className="px-3 py-3 text-right text-surface-muted uppercase">TPV Orc.</th>
                <th className="px-3 py-3 text-right text-surface-muted uppercase">TPV Real.</th>
                <th className="px-3 py-3 text-right text-surface-muted uppercase">TPV Δ%</th>
                <th className="px-3 py-3 text-right text-surface-muted uppercase">Rec. Orc.</th>
                <th className="px-3 py-3 text-right text-surface-muted uppercase">Rec. Real.</th>
                <th className="px-3 py-3 text-right text-surface-muted uppercase">Rec. Δ%</th>
                <th className="px-3 py-3 text-right text-surface-muted uppercase">EBITDA Orc.</th>
                <th className="px-3 py-3 text-right text-surface-muted uppercase">EBITDA Real.</th>
                <th className="px-3 py-3 text-right text-surface-muted uppercase">EBITDA Δ%</th>
                <th className="px-3 py-3 text-left text-surface-muted uppercase">Classif.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50">
              {comparison.map(({ r, vReceita, vEbitda, vTPV }) => {
                const absDeviation = Math.abs(vEbitda.pct) > 0.05
                const classification = absDeviation
                  ? Math.abs(vTPV.pct) > 0.04 ? 'Não controlável' : 'Controlável'
                  : 'Dentro do range'
                const badgeClass = classification === 'Não controlável'
                  ? 'badge-error'
                  : classification === 'Controlável'
                  ? 'badge-review'
                  : 'badge-ok'
                return (
                  <tr key={r.month} className="hover:bg-white/[0.03]">
                    <td className="px-3 py-2 text-white font-medium sticky left-0 bg-surface-card">{r.label}</td>
                    <td className="px-3 py-2 text-right text-surface-muted tabular-nums">{fmtBRL(r.orcado.tpv, true)}</td>
                    <td className="px-3 py-2 text-right text-white tabular-nums">{fmtBRL(r.realizado.tpv, true)}</td>
                    <td className={`px-3 py-2 text-right tabular-nums ${varianceColor(vTPV.pct, true)}`}>{vTPV.pct > 0 ? '+' : ''}{fmtPct(vTPV.pct)}</td>
                    <td className="px-3 py-2 text-right text-surface-muted tabular-nums">{fmtBRL(r.orcado.receita, true)}</td>
                    <td className="px-3 py-2 text-right text-white tabular-nums">{fmtBRL(r.realizado.receita, true)}</td>
                    <td className={`px-3 py-2 text-right tabular-nums ${varianceColor(vReceita.pct, true)}`}>{vReceita.pct > 0 ? '+' : ''}{fmtPct(vReceita.pct)}</td>
                    <td className="px-3 py-2 text-right text-surface-muted tabular-nums">{fmtBRL(r.orcado.ebitda, true)}</td>
                    <td className="px-3 py-2 text-right text-white tabular-nums">{fmtBRL(r.realizado.ebitda, true)}</td>
                    <td className={`px-3 py-2 text-right tabular-nums font-semibold ${varianceColor(vEbitda.pct, true)}`}>{vEbitda.pct > 0 ? '+' : ''}{fmtPct(vEbitda.pct)}</td>
                    <td className="px-3 py-2"><span className={badgeClass}>{classification}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
