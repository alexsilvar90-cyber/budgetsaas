'use client'

import { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/client'
import DropZone from '@/components/DropZone'
import { UploadHistoryTable } from '@/components/UploadHistoryTable'
import type { CostCenter, UploadLog } from '@/types'
import { CheckCircle, AlertCircle, Loader2, ChevronDown } from 'lucide-react'
import { clsx } from '@/lib/utils'

type UploadType = 'budget' | 'actual'

interface ValidationError {
  row: number
  message: string
}

export default function UploadPage() {
  const supabase = createClient()

  const [file, setFile] = useState<File | null>(null)
  const [uploadType, setUploadType] = useState<UploadType>('budget')
  const [costCenterId, setCostCenterId] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [costCenters, setCostCenters] = useState<CostCenter[]>([])
  const [logs, setLogs] = useState<UploadLog[]>([])
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [preview, setPreview] = useState<{ description: string; category: string; values: number[] }[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    loadCostCenters()
    loadLogs()
  }, [])

  async function loadCostCenters() {
    const { data } = await supabase.from('cost_centers').select('*').order('name')
    setCostCenters((data as CostCenter[]) ?? [])
    if (data && data.length > 0 && !costCenterId) setCostCenterId(data[0].id)
  }

  async function loadLogs() {
    const { data } = await supabase
      .from('upload_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30)
    setLogs((data as UploadLog[]) ?? [])
  }

  function handleFile(f: File) {
    setFile(f)
    setErrors([])
    setPreview([])
    validateFile(f)
  }

  function validateFile(f: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const wb = XLSX.read(e.target?.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 })

      const errs: ValidationError[] = []
      const prev: { description: string; category: string; values: number[] }[] = []

      rows.forEach((row, i) => {
        if (i === 0) return // skip header row
        const rowNum = i + 1

        const description = row[0]
        const category = row[1]
        const monthValues = row.slice(2, 14)

        if (!description || typeof description !== 'string') {
          errs.push({ row: rowNum, message: 'Coluna A (Descrição) deve ser texto' })
        }
        if (!category || typeof category !== 'string') {
          errs.push({ row: rowNum, message: 'Coluna B (Categoria) deve ser texto' })
        }
        monthValues.forEach((v, mi) => {
          if (v !== undefined && v !== null && typeof v !== 'number') {
            errs.push({ row: rowNum, message: `Coluna ${String.fromCharCode(67 + mi)} (mês ${mi + 1}) deve ser número` })
          }
        })

        if (errs.filter(e => e.row === rowNum).length === 0 && description && category) {
          prev.push({
            description: String(description),
            category: String(category),
            values: monthValues.map(v => Number(v ?? 0)),
          })
        }
      })

      setErrors(errs)
      setPreview(prev)
    }
    reader.readAsArrayBuffer(f)
  }

  async function handleSubmit() {
    if (!file || errors.length > 0 || !costCenterId || preview.length === 0) return
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Upload to Storage
      const storagePath = `uploads/${costCenterId}/${Date.now()}_${file.name}`
      const { error: uploadErr } = await supabase.storage
        .from('uploads')
        .upload(storagePath, file)

      if (uploadErr) throw uploadErr

      // Build budget_entries rows
      const rows: object[] = []
      for (const item of preview) {
        item.values.forEach((amount, mi) => {
          if (amount === 0 && uploadType === 'budget') return
          rows.push({
            cost_center_id: costCenterId,
            type: uploadType,
            year,
            month: uploadType === 'actual' ? month : mi + 1,
            description: item.description,
            category: item.category,
            amount,
          })
        })
      }

      const { error: insertErr } = await supabase.from('budget_entries').insert(rows)
      if (insertErr) throw insertErr

      // Log the import
      const period = uploadType === 'budget' ? String(year) : `${year}-${String(month).padStart(2,'0')}`
      await supabase.from('upload_logs').insert({
        uploaded_by: user?.id,
        cost_center_id: costCenterId,
        type: uploadType === 'budget' ? 'Orçamento Anual' : 'Realizado Mensal',
        period,
        filename: file.name,
        storage_path: storagePath,
        status: 'ok',
        row_count: rows.length,
      })

      setToast({ type: 'success', message: `${rows.length} linhas importadas com sucesso!` })
      setFile(null)
      setPreview([])
      await loadLogs()
    } catch (e: any) {
      await supabase.from('upload_logs').insert({
        cost_center_id: costCenterId,
        type: uploadType === 'budget' ? 'Orçamento Anual' : 'Realizado Mensal',
        filename: file?.name,
        status: 'error',
        error_message: String(e?.message ?? e),
      })
      setToast({ type: 'error', message: `Erro na importação: ${e?.message ?? e}` })
    } finally {
      setLoading(false)
      setTimeout(() => setToast(null), 5000)
    }
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Importar Dados</h1>
        <p className="text-sm text-surface-muted mt-1">Carregue planilhas de orçamento ou realizado</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={clsx(
          'flex items-center gap-3 p-4 rounded-xl border text-sm font-medium',
          toast.type === 'success'
            ? 'bg-emerald-900/30 border-emerald-700/50 text-emerald-400'
            : 'bg-red-900/30 border-red-700/50 text-red-400'
        )}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          {toast.message}
        </div>
      )}

      {/* Form */}
      <div className="card space-y-6">
        <h2 className="text-sm font-semibold text-white">Configurações da Importação</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Type */}
          <div>
            <label className="block text-xs text-surface-muted mb-1.5">Tipo</label>
            <div className="relative">
              <select
                value={uploadType}
                onChange={e => setUploadType(e.target.value as UploadType)}
                className="form-select w-full pr-8 appearance-none"
              >
                <option value="budget">Orçamento Anual</option>
                <option value="actual">Realizado Mensal</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-muted pointer-events-none" />
            </div>
          </div>

          {/* Cost Center */}
          <div>
            <label className="block text-xs text-surface-muted mb-1.5">Centro de Custo</label>
            <div className="relative">
              <select
                value={costCenterId}
                onChange={e => setCostCenterId(e.target.value)}
                className="form-select w-full pr-8 appearance-none"
              >
                {costCenters.length === 0 && <option value="">Nenhum centro cadastrado</option>}
                {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name} ({cc.code})</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-muted pointer-events-none" />
            </div>
          </div>

          {/* Year */}
          <div>
            <label className="block text-xs text-surface-muted mb-1.5">Ano</label>
            <div className="relative">
              <select
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="form-select w-full pr-8 appearance-none"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-muted pointer-events-none" />
            </div>
          </div>

          {/* Month (only for actual) */}
          {uploadType === 'actual' && (
            <div>
              <label className="block text-xs text-surface-muted mb-1.5">Mês</label>
              <div className="relative">
                <select
                  value={month}
                  onChange={e => setMonth(Number(e.target.value))}
                  className="form-select w-full pr-8 appearance-none"
                >
                  {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-muted pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* DropZone */}
        <div>
          <label className="block text-xs text-surface-muted mb-1.5">Arquivo .xlsx</label>
          <DropZone file={file} onFile={handleFile} onClear={() => { setFile(null); setPreview([]); setErrors([]) }} />
          <p className="text-xs text-surface-muted mt-2">
            Formato esperado: <strong className="text-white">A</strong> = Descrição · <strong className="text-white">B</strong> = Categoria · <strong className="text-white">C-N</strong> = Jan a Dez
          </p>
        </div>

        {/* Validation Errors */}
        {errors.length > 0 && (
          <div className="rounded-xl border border-red-700/50 bg-red-900/20 p-4 space-y-1">
            <p className="text-sm font-medium text-red-400 mb-2">Erros de validação encontrados:</p>
            {errors.slice(0, 10).map((e, i) => (
              <p key={i} className="text-xs text-red-300">Linha {e.row}: {e.message}</p>
            ))}
            {errors.length > 10 && <p className="text-xs text-red-400">…e mais {errors.length - 10} erros.</p>}
          </div>
        )}

        {/* Preview */}
        {preview.length > 0 && errors.length === 0 && (
          <div className="rounded-xl border border-emerald-700/30 bg-emerald-900/10 p-4">
            <p className="text-sm font-medium text-emerald-400 mb-1">
              <CheckCircle className="w-4 h-4 inline mr-1" />
              {preview.length} linha{preview.length !== 1 ? 's' : ''} validadas e prontas para importar
            </p>
            <p className="text-xs text-surface-muted">
              Exemplo: {preview[0]?.description} / {preview[0]?.category}
            </p>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!file || errors.length > 0 || !costCenterId || preview.length === 0 || loading}
            className="btn-primary"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Importando…' : 'Importar Planilha'}
          </button>
        </div>
      </div>

      {/* Import History */}
      <div className="card">
        <h2 className="text-sm font-semibold text-white mb-4">Histórico de Importações</h2>
        <UploadHistoryTable logs={logs} />
      </div>
    </div>
  )
}
