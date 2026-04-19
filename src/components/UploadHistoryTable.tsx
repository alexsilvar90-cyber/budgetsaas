'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'
import type { UploadLog, CostCenter } from '@/types'
import { clsx } from '@/lib/utils'

interface UserTableProps {
  users: (UploadLog & { profiles?: { full_name: string | null; email: string | null } | null })[]
}

const statusBadge = (s: string) => {
  if (s === 'ok')     return <span className="badge-ok">OK</span>
  if (s === 'review') return <span className="badge-review">Revisão</span>
  return                     <span className="badge-error">Erro</span>
}

interface UploadHistoryTableProps {
  logs: UploadLog[]
}

export function UploadHistoryTable({ logs }: UploadHistoryTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-surface-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-border bg-surface-card/50">
            <th className="px-4 py-3 text-left text-surface-muted font-medium">Arquivo</th>
            <th className="px-4 py-3 text-left text-surface-muted font-medium">Tipo</th>
            <th className="px-4 py-3 text-left text-surface-muted font-medium">Período</th>
            <th className="px-4 py-3 text-left text-surface-muted font-medium">Linhas</th>
            <th className="px-4 py-3 text-left text-surface-muted font-medium">Status</th>
            <th className="px-4 py-3 text-left text-surface-muted font-medium">Data</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {logs.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-surface-muted">Nenhuma importação encontrada.</td>
            </tr>
          )}
          {logs.map(log => (
            <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
              <td className="px-4 py-3 text-white font-medium">{log.filename ?? '—'}</td>
              <td className="px-4 py-3 text-surface-muted capitalize">{log.type ?? '—'}</td>
              <td className="px-4 py-3 text-surface-muted">{log.period ?? '—'}</td>
              <td className="px-4 py-3 text-surface-muted">{log.row_count}</td>
              <td className="px-4 py-3">{statusBadge(log.status)}</td>
              <td className="px-4 py-3 text-surface-muted">
                {new Date(log.created_at).toLocaleDateString('pt-BR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
