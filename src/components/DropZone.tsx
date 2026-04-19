'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileSpreadsheet, X } from 'lucide-react'
import { clsx } from '@/lib/utils'

interface DropZoneProps {
  onFile: (file: File) => void
  file: File | null
  onClear: () => void
}

export default function DropZone({ onFile, file, onClear }: DropZoneProps) {
  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) onFile(accepted[0])
  }, [onFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] },
    maxFiles: 1,
    disabled: !!file,
  })

  if (file) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl border border-brand-600/40 bg-brand-600/10">
        <FileSpreadsheet className="w-8 h-8 text-brand-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{file.name}</p>
          <p className="text-xs text-surface-muted">{(file.size / 1024).toFixed(1)} KB</p>
        </div>
        <button onClick={onClear} className="text-surface-muted hover:text-red-400 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={clsx(
        'flex flex-col items-center justify-center gap-3 p-10 rounded-xl border-2 border-dashed cursor-pointer transition-all',
        isDragActive
          ? 'border-brand-500 bg-brand-600/10'
          : 'border-surface-border hover:border-brand-600/60 hover:bg-white/[0.02]'
      )}
    >
      <input {...getInputProps()} />
      <div className="w-12 h-12 rounded-full bg-brand-600/10 border border-brand-600/20 flex items-center justify-center">
        <Upload className="w-5 h-5 text-brand-400" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-white">
          {isDragActive ? 'Solte o arquivo aqui' : 'Arraste e solte ou clique para selecionar'}
        </p>
        <p className="text-xs text-surface-muted mt-1">Apenas arquivos .xlsx</p>
      </div>
    </div>
  )
}
