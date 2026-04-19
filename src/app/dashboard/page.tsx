'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  computeKpis, buildCategoryChartData, buildMonthlyChartData, buildTableRows
} from '@/lib/utils'
import KpiCard from '@/components/KpiCard'
import CategoryChart from '@/components/CategoryChart'
import MonthlyChart from '@/components/MonthlyChart'
import BudgetTable from '@/components/BudgetTable'
import FilterBar from '@/components/FilterBar'
import { DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import type { BudgetEntry, PeriodValue } from '@/types'

const currentDate = new Date()
const currentYear = currentDate.getFullYear()
const currentMonth = currentDate.getMonth() + 1

export default function DashboardPage() {
  const supabase = createClient()
  const [entries, setEntries] = useState<BudgetEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<PeriodValue>({
    type: 'annual',
    year: currentYear,
    month: currentMonth,
    quarter: Math.ceil(currentMonth / 3),
  })

  // Guard: ensure session exists before loading data
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.href = '/auth/login'
      }
    })
  }, [])

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  async function loadData() {
    setLoading(true)

    // Get current user's profile for cost_center_id
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('cost_center_id, role')
      .eq('id', user.id)
      .single()

    if (!profile) { setLoading(false); return }

    let query = supabase
      .from('budget_entries')
      .select('*')
      .eq('year', period.year)

    // Admins see all; managers see their cost center
    if (profile.role === 'manager' && profile.cost_center_id) {
      query = query.eq('cost_center_id', profile.cost_center_id)
    }

    // Month filter
    if (period.type === 'monthly' && period.month) {
      query = query.eq('month', period.month)
    }

    // Quarter filter
    if (period.type === 'quarterly' && period.quarter) {
      const q = period.quarter
      const months = [q*3-2, q*3-1, q*3]
      query = query.in('month', months)
    }

    const { data } = await query
    setEntries((data as BudgetEntry[]) ?? [])
    setLoading(false)
  }

  const kpis = computeKpis(entries)
  const categoryData = buildCategoryChartData(entries)
  const monthlyData = buildMonthlyChartData(entries)
  const tableRows = buildTableRows(entries)

  return (
    <div className="space-y-8 max-w-screen-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-surface-muted mt-1">Visão geral do orçamento e realizado</p>
        </div>
        <FilterBar value={period} onChange={p => { setPeriod(p); }} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Orçado Total"
          value={kpis.totalBudget}
          icon={<Wallet className="w-5 h-5 text-brand-400" />}
          color="blue"
        />
        <KpiCard
          label="Realizado"
          value={kpis.totalActual}
          icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
          color="green"
        />
        <KpiCard
          label="Saldo Disponível"
          value={kpis.balance}
          icon={<TrendingUp className="w-5 h-5 text-amber-400" />}
          color={kpis.balance >= 0 ? 'amber' : 'red'}
        />
        <KpiCard
          label="Variação %"
          value={kpis.variationPct}
          format="pct"
          icon={<TrendingDown className="w-5 h-5 text-red-400" />}
          color={kpis.variationPct <= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CategoryChart data={categoryData} />
        <MonthlyChart data={monthlyData} />
      </div>

      {/* Detail Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Detalhamento</h3>
          {loading && (
            <span className="text-xs text-surface-muted animate-pulse">Carregando…</span>
          )}
        </div>
        <BudgetTable rows={tableRows} />
      </div>
    </div>
  )
}
