'use client'

import { formatCurrency, clsx } from '@/lib/utils'
import type { BudgetTableRow } from '@/types'
import { ArrowUpDown } from 'lucide-react'
import { useState } from 'react'

interface BudgetTableProps {
  rows: BudgetTableRow[]
}

type SortKey = keyof BudgetTableRow
type SortDir = 'asc' | 'desc'

export default function BudgetTable({ rows }: BudgetTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('budget')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = [...rows].sort((a, b) => {
    const va = a[sortKey], vb = b[sortKey]
    const cmp = typeof va === 'number' && typeof vb === 'number'
      ? va - vb
      : String(va).localeCompare(String(vb))
    return sortDir === 'asc' ? cmp : -cmp
  })

  const headers: { key: SortKey; label: string; align?: string }[] = [
    { key: 'description', label: 'Descrição' },
    { key: 'category',    label: 'Categoria' },
    { key: 'budget',      label: 'Orçado',    align: 'right' },
    { key: 'actual',      label: 'Realizado',  align: 'right' },
    { key: 'balance',     label: 'Saldo',      align: 'right' },
    { key: 'pct',         label: '%',          align: 'right' },
  ]

  return (
    <div className="overflow-x-auto rounded-xl border border-surface-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-border bg-surface-card/50">
            {headers.map(h => (
              <th
                key={h.key}
                className={clsx(
                  'px-4 py-3 font-medium text-surface-muted whitespace-nowrap cursor-pointer hover:text-white transition-colors select-none',
                  h.align === 'right' ? 'text-right' : 'text-left'
                )}
                onClick={() => handleSort(h.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {h.label}
                  <ArrowUpDown className="w-3 h-3 opacity-50" />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {sorted.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-surface-muted">
                Nenhum dado encontrado para o período selecionado.
              </td>
            </tr>
          )}
          {sorted.map((row, i) => (
            <tr key={i} className="hover:bg-white/[0.02] transition-colors">
              <td className="px-4 py-3 text-white font-medium">{row.description}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-brand-600/10 text-brand-400 text-xs border border-brand-600/20">
                  {row.category}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-surface-muted">{formatCurrency(row.budget)}</td>
              <td className="px-4 py-3 text-right text-white">{formatCurrency(row.actual)}</td>
              <td className={clsx(
                'px-4 py-3 text-right font-medium',
                row.balance >= 0 ? 'text-emerald-400' : 'text-red-400'
              )}>
                {formatCurrency(row.balance)}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-surface-border overflow-hidden">
                    <div
                      className={clsx(
                        'h-full rounded-full',
                        row.pct > 100 ? 'bg-red-500' : row.pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                      )}
                      style={{ width: `${Math.min(row.pct, 100)}%` }}
                    />
                  </div>
                  <span className={clsx(
                    'text-xs w-10 text-right',
                    row.pct > 100 ? 'text-red-400' : row.pct > 80 ? 'text-amber-400' : 'text-emerald-400'
                  )}>
                    {row.pct.toFixed(0)}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
