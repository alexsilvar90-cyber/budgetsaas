// Shared TypeScript types for Budget SaaS

export type Role = 'admin' | 'manager'

export interface CostCenter {
  id: string
  name: string
  code: string
}

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  role: Role
  cost_center_id: string | null
  is_active: boolean
  last_sign_in_at: string | null
  cost_centers?: CostCenter | null
}

export type EntryType = 'budget' | 'actual'

export interface BudgetEntry {
  id: string
  cost_center_id: string
  type: EntryType
  year: number
  month: number | null
  description: string
  category: string
  amount: number
  created_at: string
}

export type UploadStatus = 'ok' | 'review' | 'error'

export interface UploadLog {
  id: string
  uploaded_by: string | null
  cost_center_id: string | null
  type: string | null
  period: string | null
  filename: string | null
  storage_path: string | null
  status: UploadStatus
  error_message: string | null
  row_count: number
  created_at: string
  cost_centers?: CostCenter | null
  profiles?: Pick<Profile, 'full_name' | 'email'> | null
}

// Aggregated KPI data for the dashboard
export interface KpiData {
  totalBudget: number
  totalActual: number
  balance: number
  variationPct: number
}

// Data shape for the charts
export interface CategoryChartItem {
  category: string
  budget: number
  actual: number
}

export interface MonthlyChartItem {
  month: string
  budget: number
  actual: number
}

// Row shape shown in the BudgetTable
export interface BudgetTableRow {
  description: string
  category: string
  budget: number
  actual: number
  balance: number
  pct: number
}

// Period filter options
export type PeriodFilter = 'monthly' | 'quarterly' | 'annual'

export interface PeriodValue {
  type: PeriodFilter
  year: number
  month?: number   // 1-12
  quarter?: number // 1-4
}
