'use client'

interface Column<T> {
  key: keyof T | string
  label: string
  format?: (val: unknown, row: T) => string
  className?: string
  sticky?: boolean
}

interface FpaDataTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[]
  rows: T[]
  maxHeight?: string
  highlightKey?: string       // highlight rows where `row.isHighlight === true`
}

export default function FpaDataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  maxHeight = '420px',
}: FpaDataTableProps<T>) {
  return (
    <div className="overflow-auto rounded-xl border border-surface-border" style={{ maxHeight }}>
      <table className="min-w-full text-xs">
        <thead className="sticky top-0 z-10 bg-surface-card border-b border-surface-border">
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                className={`px-3 py-2.5 text-left font-semibold text-surface-muted uppercase tracking-wider whitespace-nowrap ${
                  col.sticky ? 'sticky left-0 z-20 bg-surface-card' : ''
                } ${col.className ?? ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border/50">
          {rows.map((row, ri) => {
            const isHighlight = row.isHighlight === true
            const isBold = row.isBold === true
            return (
              <tr
                key={ri}
                className={`transition-colors hover:bg-white/[0.03] ${isHighlight ? 'bg-brand-900/20' : ''}`}
              >
                {columns.map((col, ci) => {
                  const raw = row[col.key as keyof T]
                  const display = col.format ? col.format(raw, row) : String(raw ?? '')
                  return (
                    <td
                      key={ci}
                      className={`px-3 py-2 whitespace-nowrap tabular-nums ${
                        isHighlight ? 'text-brand-300' : 'text-surface-muted'
                      } ${isBold ? 'font-semibold text-white' : ''} ${
                        col.sticky ? 'sticky left-0 z-10 bg-surface-card font-medium text-white' : ''
                      } ${col.className ?? ''}`}
                    >
                      {display}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
