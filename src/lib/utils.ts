import { type BudgetEntry, type BudgetTableRow, type CategoryChartItem, type MonthlyChartItem, type KpiData } from '@/types'

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatPct(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

export function monthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? ''
}

/** Compute KPIs from a flat list of budget entries */
export function computeKpis(entries: BudgetEntry[]): KpiData {
  const totalBudget = entries.filter(e => e.type === 'budget').reduce((s, e) => s + e.amount, 0)
  const totalActual = entries.filter(e => e.type === 'actual').reduce((s, e) => s + e.amount, 0)
  const balance = totalBudget - totalActual
  const variationPct = totalBudget === 0 ? 0 : ((totalActual - totalBudget) / totalBudget) * 100
  return { totalBudget, totalActual, balance, variationPct }
}

/** Build category chart data (budgeted vs actual per category) */
export function buildCategoryChartData(entries: BudgetEntry[]): CategoryChartItem[] {
  const map = new Map<string, { budget: number; actual: number }>()
  for (const e of entries) {
    if (!map.has(e.category)) map.set(e.category, { budget: 0, actual: 0 })
    const item = map.get(e.category)!
    if (e.type === 'budget') item.budget += e.amount
    else item.actual += e.amount
  }
  return Array.from(map.entries()).map(([category, v]) => ({ category, ...v }))
}

/** Build monthly chart data */
export function buildMonthlyChartData(entries: BudgetEntry[]): MonthlyChartItem[] {
  const map = new Map<number, { budget: number; actual: number }>()
  for (let m = 1; m <= 12; m++) map.set(m, { budget: 0, actual: 0 })

  for (const e of entries) {
    if (!e.month) continue
    const item = map.get(e.month)!
    if (e.type === 'budget') item.budget += e.amount
    else item.actual += e.amount
  }
  return Array.from(map.entries()).map(([m, v]) => ({ month: MONTH_NAMES[m - 1], ...v }))
}

/** Aggregate entries into table rows */
export function buildTableRows(entries: BudgetEntry[]): BudgetTableRow[] {
  const map = new Map<string, { budget: number; actual: number; category: string }>()
  for (const e of entries) {
    const key = `${e.description}|${e.category}`
    if (!map.has(key)) map.set(key, { budget: 0, actual: 0, category: e.category })
    const item = map.get(key)!
    if (e.type === 'budget') item.budget += e.amount
    else item.actual += e.amount
  }
  return Array.from(map.entries()).map(([key, v]) => {
    const [description] = key.split('|')
    const balance = v.budget - v.actual
    const pct = v.budget === 0 ? 0 : (v.actual / v.budget) * 100
    return { description, category: v.category, budget: v.budget, actual: v.actual, balance, pct }
  })
}

export function clsx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
