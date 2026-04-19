// ─── Assumptions (Premissas) ────────────────────────────────────────────────

export interface VolumeAssumptions {
  clientesAtivos: number        // starting active clients
  crescimentoClientes: number   // monthly client growth rate (decimal, e.g. 0.02)
  churnMensal: number           // monthly churn rate (decimal)
  ticketMedio: number           // avg transaction ticket in BRL
  frequenciaMensal: number      // avg transactions per client per month
}

export interface ReceitaAssumptions {
  txComissaoTPV: number         // commission % on TPV (decimal)
  txAntecipacaoMensal: number   // receivable anticipation rate % p.m. (decimal)
  txFinanciamentoMensal: number // revolving/installment financing rate % p.m. (decimal)
  receitaServicos: number       // fixed monthly services revenue (BRL) — insurance, fees
}

export interface CarteiraAssumptions {
  pctTPVCarteira: number        // % of TPV that becomes receivable portfolio (decimal)
  prazoMedioDias: number        // avg portfolio term in days
  pctRotativo: number           // % of portfolio that is revolving (decimal)
  // pctParcelado = 1 - pctRotativo
}

export interface RiscoAssumptions {
  pctInadimplencia: number      // delinquency rate (decimal)
  pctPerdasWriteOff: number     // write-off rate over portfolio (decimal)
  pctRecuperacao: number        // recovery rate over losses (decimal)
  pctPCLD: number               // PCLD provisioning rate over portfolio (decimal)
}

export interface FundingAssumptions {
  custoFundingMensal: number    // funding cost % p.m. (decimal)
  rendimentoAplicacoes: number  // yield on cash investments % p.m. (decimal)
  capitalInicial: number        // starting equity/capital (BRL)
}

export interface DespesasAssumptions {
  pessoal: number               // monthly payroll (BRL)
  marketing: number             // monthly marketing (BRL)
  tecnologia: number            // monthly tech/infra (BRL)
  administrativo: number        // monthly G&A (BRL)
  crescimentoDespesas: number   // annual cost inflation rate (decimal, e.g. 0.08)
  pctCustoVariavelTPV: number   // variable cost % of TPV (processing, fraud, etc.)
}

export interface Assumptions {
  volume: VolumeAssumptions
  receita: ReceitaAssumptions
  carteira: CarteiraAssumptions
  risco: RiscoAssumptions
  funding: FundingAssumptions
  despesas: DespesasAssumptions
}

// ─── Model Outputs ───────────────────────────────────────────────────────────

export interface MonthlyRow {
  month: number                 // 1..36
  label: string                 // e.g. "Jan/26"

  // Volume
  clientesAtivos: number
  novosClientes: number
  churn: number
  numTransacoes: number
  tpv: number                   // Total Payment Volume (BRL)

  // Carteira
  carteira: number              // Total portfolio (BRL)
  carteiraRotativo: number
  carteiraParcelada: number

  // Receitas
  receitaComissao: number
  receitaAntecipacao: number
  receitaFinanciamento: number
  receitaServicos: number
  receitaOutras: number
  receitaTotal: number

  // Risco
  pcld: number
  perdas: number
  recuperacao: number
  perdasLiquidas: number
  pctInadimplenciaEfetiva: number

  // DRE
  deducoes: number
  receitaLiquida: number
  custoVariavel: number
  margemBruta: number
  despesasPessoal: number
  despesasMarketing: number
  despesasTecnologia: number
  despesasAdmin: number
  despesasOperacionais: number
  ebitda: number
  resultadoFinanceiro: number
  lucroLiquido: number

  // Caixa
  caixaOperacional: number
  variacaoCarteira: number
  necessidadeFunding: number
  investimentos: number
  caixaFinal: number

  // Budget vs Actual
  orcado: BudgetActualRow
  realizado: BudgetActualRow

  // KPIs
  taxaReceita: number           // receita / TPV (take rate)
  margemEbitdaPct: number
  perdasLiquidasCarteira: number // net losses / portfolio
}

export interface BudgetActualRow {
  receita: number
  despesas: number
  ebitda: number
  tpv: number
  inadimplencia: number
}

export interface ModelOutput {
  rows: MonthlyRow[]
  summary: ModelSummary
}

export interface ModelSummary {
  totalTPV: number
  totalReceita: number
  totalEbitda: number
  margemEbitdaMedia: number
  totalPerdasLiquidas: number
  totalClientes: number
  takeRateMedio: number
}

// ─── Scenarios ───────────────────────────────────────────────────────────────

export type ScenarioKey = 'base' | 'pessimista' | 'otimista'

export interface ScenarioOverride {
  label: string
  color: string
  // multipliers applied on top of base assumptions
  tpvMultiplier: number
  inadimplenciaMultiplier: number
  txJurosMultiplier: number
  custoFundingMultiplier: number
  despesasMultiplier: number
}

// ─── Chart helpers ───────────────────────────────────────────────────────────

export interface ChartDataPoint {
  label: string
  [key: string]: number | string
}
