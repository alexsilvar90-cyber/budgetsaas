'use client'

import { useState, useMemo } from 'react'
import type { ScenarioKey, Assumptions } from '@/lib/fpa/types'
import { runModel } from '@/lib/fpa/engine'
import { DEFAULT_ASSUMPTIONS, SCENARIOS } from '@/lib/fpa/defaults'

import PremissasTab from '@/components/fpa/PremissasTab'
import OperacionalTab from '@/components/fpa/OperacionalTab'
import ReceitasTab from '@/components/fpa/ReceitasTab'
import RiscoTab from '@/components/fpa/RiscoTab'
import DreTab from '@/components/fpa/DreTab'
import FluxoCaixaTab from '@/components/fpa/FluxoCaixaTab'
import OrcamentoTab from '@/components/fpa/OrcamentoTab'
import KpisTab from '@/components/fpa/KpisTab'
import CenariosTab from '@/components/fpa/CenariosTab'

const TABS = [
  { id: 'premissas',   label: '1. Premissas' },
  { id: 'operacional', label: '2. Operacional' },
  { id: 'receitas',    label: '3. Receitas' },
  { id: 'risco',       label: '4. Risco' },
  { id: 'dre',         label: '5. DRE' },
  { id: 'caixa',       label: '6. Fluxo de Caixa' },
  { id: 'orcamento',   label: '7. Orçamento' },
  { id: 'kpis',        label: '8. KPIs' },
  { id: 'cenarios',    label: '9. Cenários' },
] as const

type TabId = typeof TABS[number]['id']

export default function AgenteFpaPage() {
  const [activeTab, setActiveTab] = useState<TabId>('premissas')
  const [assumptions, setAssumptions] = useState<Assumptions>(DEFAULT_ASSUMPTIONS)
  const [scenario, setScenario] = useState<ScenarioKey>('base')

  const output = useMemo(() => runModel(assumptions, scenario), [assumptions, scenario])

  return (
    <div className="space-y-6 max-w-screen-xl">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-2xl">🧠</span>
            Agente FP&amp;A
          </h1>
          <p className="text-sm text-surface-muted mt-1">
            Business Plan + Orçamento — Cartão de Crédito (Arranjo Fechado) · 36 Meses
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-surface-muted uppercase tracking-wider">Cenário:</span>
          <div className="flex rounded-xl overflow-hidden border border-surface-border">
            {(Object.entries(SCENARIOS) as [ScenarioKey, typeof SCENARIOS[ScenarioKey]][]).map(([key, s]) => (
              <button
                key={key}
                onClick={() => setScenario(key)}
                className="flex-shrink-0 px-4 py-2 text-xs font-semibold transition-all"
                style={scenario === key
                  ? { background: s.color + '33', color: s.color }
                  : { color: '#8b9ab5' }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'TPV Acum. 36m', value: output.summary.totalTPV, color: 'text-brand-400' },
          { label: 'Receita Bruta 36m', value: output.summary.totalReceita, color: 'text-purple-400' },
          { label: 'EBITDA 36m', value: output.summary.totalEbitda, color: output.summary.totalEbitda >= 0 ? 'text-emerald-400' : 'text-red-400' },
          { label: 'Clientes (Mês 36)', value: output.summary.totalClientes, color: 'text-cyan-400', isNum: true },
        ].map(k => (
          <div key={k.label} className="bg-surface-card border border-surface-border rounded-xl px-4 py-3">
            <p className="text-xs text-surface-muted">{k.label}</p>
            <p className={`text-base font-bold mt-0.5 ${k.color}`}>
              {k.isNum
                ? new Intl.NumberFormat('pt-BR').format(Math.round(k.value))
                : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0, notation: 'compact', compactDisplay: 'short' }).format(k.value)
              }
            </p>
          </div>
        ))}
      </div>

      <div className="border-b border-surface-border">
        <nav className="flex gap-1 overflow-x-auto pb-px">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-4 py-2.5 text-xs font-medium transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-surface-muted hover:text-white hover:border-surface-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="min-h-96 pt-2">
        {activeTab === 'premissas'   && <PremissasTab assumptions={assumptions} onChange={setAssumptions} />}
        {activeTab === 'operacional' && <OperacionalTab output={output} />}
        {activeTab === 'receitas'    && <ReceitasTab output={output} />}
        {activeTab === 'risco'       && <RiscoTab output={output} />}
        {activeTab === 'dre'         && <DreTab output={output} />}
        {activeTab === 'caixa'       && <FluxoCaixaTab output={output} />}
        {activeTab === 'orcamento'   && <OrcamentoTab output={output} />}
        {activeTab === 'kpis'        && <KpisTab output={output} />}
        {activeTab === 'cenarios'    && <CenariosTab baseAssumptions={assumptions} currentOutput={output} currentScenario={scenario} />}
      </div>
    </div>
  )
}