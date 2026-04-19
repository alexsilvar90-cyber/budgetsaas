'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { PeriodValue } from '@/types'

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 5 }, (_, i) => currentYear - i)
const months = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
]

interface FilterBarProps {
  value: PeriodValue
  onChange: (v: PeriodValue) => void
}

export default function FilterBar({ value, onChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Period type */}
      <div className="relative">
        <select
          value={value.type}
          onChange={e => onChange({ ...value, type: e.target.value as any })}
          className="form-select pr-8 appearance-none cursor-pointer"
        >
          <option value="monthly">Mensal</option>
          <option value="quarterly">Trimestral</option>
          <option value="annual">Anual</option>
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-muted pointer-events-none" />
      </div>

      {/* Year */}
      <div className="relative">
        <select
          value={value.year}
          onChange={e => onChange({ ...value, year: Number(e.target.value) })}
          className="form-select pr-8 appearance-none cursor-pointer"
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-muted pointer-events-none" />
      </div>

      {/* Month selector */}
      {value.type === 'monthly' && (
        <div className="relative">
          <select
            value={value.month ?? 1}
            onChange={e => onChange({ ...value, month: Number(e.target.value) })}
            className="form-select pr-8 appearance-none cursor-pointer"
          >
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-muted pointer-events-none" />
        </div>
      )}

      {/* Quarter selector */}
      {value.type === 'quarterly' && (
        <div className="relative">
          <select
            value={value.quarter ?? 1}
            onChange={e => onChange({ ...value, quarter: Number(e.target.value) })}
            className="form-select pr-8 appearance-none cursor-pointer"
          >
            <option value={1}>T1 (Jan-Mar)</option>
            <option value={2}>T2 (Abr-Jun)</option>
            <option value={3}>T3 (Jul-Set)</option>
            <option value={4}>T4 (Out-Dez)</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-muted pointer-events-none" />
        </div>
      )}
    </div>
  )
}
