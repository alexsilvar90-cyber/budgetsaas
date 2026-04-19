'use client'

import type { Assumptions } from '@/lib/fpa/types'

interface InputGroupProps {
  title: string
  children: React.ReactNode
}

function InputGroup({ title, children }: InputGroupProps) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-white mb-4 pb-2 border-b border-surface-border">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {children}
      </div>
    </div>
  )
}

interface FieldProps {
  label: string
  value: number
  onChange: (v: number) => void
  format?: 'brl' | 'pct' | 'num' | 'days'
  step?: number
  min?: number
  max?: number
  hint?: string
}

function Field({ label, value, onChange, format = 'num', step, hint }: FieldProps) {
  // Convert to display format
  const displayValue = format === 'pct' ? +(value * 100).toFixed(4) : value

  const handleChange = (raw: string) => {
    const n = parseFloat(raw)
    if (isNaN(n)) return
    onChange(format === 'pct' ? n / 100 : n)
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-surface-muted font-medium">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={displayValue}
          step={step ?? (format === 'pct' ? 0.1 : format === 'brl' ? 10000 : 1)}
          onChange={e => handleChange(e.target.value)}
          className="w-full bg-brand-900/20 border border-brand-700/40 text-brand-300 text-sm rounded-lg px-3 py-2 
                     focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500
                     [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {format === 'pct' && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-surface-muted">%</span>
        )}
        {format === 'brl' && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-surface-muted pointer-events-none">R$</span>
        )}
        {format === 'days' && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-surface-muted">dias</span>
        )}
      </div>
      {hint && <p className="text-xs text-surface-muted/60 italic">{hint}</p>}
    </div>
  )
}

interface PremissasTabProps {
  assumptions: Assumptions
  onChange: (a: Assumptions) => void
}

export default function PremissasTab({ assumptions: a, onChange }: PremissasTabProps) {
  function patch<K extends keyof Assumptions>(section: K, update: Partial<Assumptions[K]>) {
    onChange({ ...a, [section]: { ...a[section], ...update } })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 bg-brand-900/10 border border-brand-800/30 rounded-xl">
        <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
        <p className="text-sm text-brand-300 font-medium">Células editáveis — altere os inputs abaixo e veja o modelo atualizar em tempo real</p>
      </div>

      {/* Volume */}
      <InputGroup title="🏪 Volume e Operação">
        <Field
          label="Clientes Ativos (inicial)"
          value={a.volume.clientesAtivos}
          format="num"
          step={1000}
          onChange={v => patch('volume', { clientesAtivos: v })}
          hint="Base ativa no mês 1"
        />
        <Field
          label="Crescimento Mensal de Clientes"
          value={a.volume.crescimentoClientes}
          format="pct"
          step={0.1}
          onChange={v => patch('volume', { crescimentoClientes: v })}
          hint="Novos clientes / base ativa"
        />
        <Field
          label="Churn Mensal"
          value={a.volume.churnMensal}
          format="pct"
          step={0.05}
          onChange={v => patch('volume', { churnMensal: v })}
          hint="Cancelamentos / base ativa"
        />
        <Field
          label="Ticket Médio (R$)"
          value={a.volume.ticketMedio}
          format="num"
          step={10}
          onChange={v => patch('volume', { ticketMedio: v })}
          hint="Valor médio por transação"
        />
        <Field
          label="Frequência Mensal"
          value={a.volume.frequenciaMensal}
          format="num"
          step={0.1}
          onChange={v => patch('volume', { frequenciaMensal: v })}
          hint="Transações por cliente/mês"
        />
      </InputGroup>

      {/* Receita */}
      <InputGroup title="💰 Receita">
        <Field
          label="Comissão sobre TPV"
          value={a.receita.txComissaoTPV}
          format="pct"
          step={0.05}
          onChange={v => patch('receita', { txComissaoTPV: v })}
          hint="MDR / taxa de desconto"
        />
        <Field
          label="Taxa de Antecipação (a.m.)"
          value={a.receita.txAntecipacaoMensal}
          format="pct"
          step={0.05}
          onChange={v => patch('receita', { txAntecipacaoMensal: v })}
          hint="Receita de antecipação de recebíveis"
        />
        <Field
          label="Taxa de Financiamento (a.m.)"
          value={a.receita.txFinanciamentoMensal}
          format="pct"
          step={0.1}
          onChange={v => patch('receita', { txFinanciamentoMensal: v })}
          hint="Rotativo + parcelado com juros"
        />
        <Field
          label="Receita de Serviços (R$/mês)"
          value={a.receita.receitaServicos}
          format="brl"
          step={10000}
          onChange={v => patch('receita', { receitaServicos: v })}
          hint="Seguros, tarifas, anuidades"
        />
      </InputGroup>

      {/* Carteira */}
      <InputGroup title="📋 Carteira de Crédito">
        <Field
          label="% TPV que vira Carteira"
          value={a.carteira.pctTPVCarteira}
          format="pct"
          step={0.5}
          onChange={v => patch('carteira', { pctTPVCarteira: v })}
          hint="Penetração na carteira de recebíveis"
        />
        <Field
          label="Prazo Médio (dias)"
          value={a.carteira.prazoMedioDias}
          format="days"
          step={1}
          onChange={v => patch('carteira', { prazoMedioDias: v })}
          hint="Dias médios de giro da carteira"
        />
        <Field
          label="% Carteira Rotativo"
          value={a.carteira.pctRotativo}
          format="pct"
          step={0.5}
          onChange={v => patch('carteira', { pctRotativo: v })}
          hint="Restante é parcelado"
        />
      </InputGroup>

      {/* Risco */}
      <InputGroup title="⚠️ Risco e Perdas">
        <Field
          label="% Inadimplência"
          value={a.risco.pctInadimplencia}
          format="pct"
          step={0.1}
          onChange={v => patch('risco', { pctInadimplencia: v })}
          hint="Atraso > 30 dias / carteira"
        />
        <Field
          label="% Write-off (perdas)"
          value={a.risco.pctPerdasWriteOff}
          format="pct"
          step={0.1}
          onChange={v => patch('risco', { pctPerdasWriteOff: v })}
          hint="Baixa definitiva / carteira"
        />
        <Field
          label="% Recuperação de Crédito"
          value={a.risco.pctRecuperacao}
          format="pct"
          step={1}
          onChange={v => patch('risco', { pctRecuperacao: v })}
          hint="Recuperação sobre perdas"
        />
        <Field
          label="% PCLD (provisão)"
          value={a.risco.pctPCLD}
          format="pct"
          step={0.1}
          onChange={v => patch('risco', { pctPCLD: v })}
          hint="Provisão para devedores duvidosos"
        />
      </InputGroup>

      {/* Funding */}
      <InputGroup title="🏦 Funding e Financeiro">
        <Field
          label="Custo de Funding (a.m.)"
          value={a.funding.custoFundingMensal}
          format="pct"
          step={0.05}
          onChange={v => patch('funding', { custoFundingMensal: v })}
          hint="CDI + spread de captação"
        />
        <Field
          label="Rendimento de Aplicações (a.m.)"
          value={a.funding.rendimentoAplicacoes}
          format="pct"
          step={0.05}
          onChange={v => patch('funding', { rendimentoAplicacoes: v })}
          hint="Yield do caixa investido"
        />
        <Field
          label="Capital Inicial (R$)"
          value={a.funding.capitalInicial}
          format="num"
          step={500000}
          onChange={v => patch('funding', { capitalInicial: v })}
          hint="Patrimônio líquido / equity"
        />
      </InputGroup>

      {/* Despesas */}
      <InputGroup title="📊 Custos e Despesas">
        <Field
          label="Pessoal (R$/mês)"
          value={a.despesas.pessoal}
          format="brl"
          step={50000}
          onChange={v => patch('despesas', { pessoal: v })}
        />
        <Field
          label="Marketing (R$/mês)"
          value={a.despesas.marketing}
          format="brl"
          step={10000}
          onChange={v => patch('despesas', { marketing: v })}
        />
        <Field
          label="Tecnologia (R$/mês)"
          value={a.despesas.tecnologia}
          format="brl"
          step={10000}
          onChange={v => patch('despesas', { tecnologia: v })}
        />
        <Field
          label="Administrativo (R$/mês)"
          value={a.despesas.administrativo}
          format="brl"
          step={10000}
          onChange={v => patch('despesas', { administrativo: v })}
        />
        <Field
          label="Inflação de Custos (a.a.)"
          value={a.despesas.crescimentoDespesas}
          format="pct"
          step={0.5}
          onChange={v => patch('despesas', { crescimentoDespesas: v })}
          hint="Reajuste anual de despesas"
        />
        <Field
          label="Custo Variável sobre TPV"
          value={a.despesas.pctCustoVariavelTPV}
          format="pct"
          step={0.05}
          onChange={v => patch('despesas', { pctCustoVariavelTPV: v })}
          hint="Processamento, fraude, bandeira"
        />
      </InputGroup>
    </div>
  )
}
