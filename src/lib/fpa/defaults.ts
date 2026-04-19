import type { Assumptions, ScenarioKey, ScenarioOverride } from './types'

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  volume: {
    clientesAtivos:       50_000,
    crescimentoClientes:  0.025,  // +2.5%/month
    churnMensal:          0.008,  // 0.8%/month
    ticketMedio:          350,    // R$ 350 per transaction
    frequenciaMensal:     4.2,    // 4.2 transactions/month
  },
  receita: {
    txComissaoTPV:          0.022,  // 2.2% MDR/commission
    txAntecipacaoMensal:    0.018,  // 1.8% p.m. anticipation
    txFinanciamentoMensal:  0.079,  // 7.9% p.m. revolving credit
    receitaServicos:        120_000, // R$ 120k fixed/month (insurance, fees)
  },
  carteira: {
    pctTPVCarteira: 0.65,   // 65% of TPV becomes receivable
    prazoMedioDias: 28,     // 28-day avg term
    pctRotativo:    0.18,   // 18% revolving, 82% installment
  },
  risco: {
    pctInadimplencia:  0.048,  // 4.8% delinquency
    pctPerdasWriteOff: 0.032,  // 3.2% write-off over portfolio
    pctRecuperacao:    0.18,   // 18% recovery on losses
    pctPCLD:           0.055,  // 5.5% PCLD provision
  },
  funding: {
    custoFundingMensal:    0.0095, // ~1.0% p.m. (≈CDI)
    rendimentoAplicacoes:  0.0082, // ~0.82% p.m. Treasury
    capitalInicial:        15_000_000, // R$ 15M initial capital
  },
  despesas: {
    pessoal:              1_800_000,  // R$ 1.8M/month payroll
    marketing:            350_000,   // R$ 350k/month
    tecnologia:           420_000,   // R$ 420k/month (cloud, licenses)
    administrativo:       280_000,   // R$ 280k/month G&A
    crescimentoDespesas:  0.08,      // 8% annual cost inflation
    pctCustoVariavelTPV:  0.004,     // 0.4% of TPV (processing, fraud, scheme fees)
  },
}

// Scenario multipliers applied on top of base assumptions
export const SCENARIOS: Record<ScenarioKey, ScenarioOverride> = {
  base: {
    label: 'Base',
    color: '#6081f7',
    tpvMultiplier:             1.0,
    inadimplenciaMultiplier:   1.0,
    txJurosMultiplier:         1.0,
    custoFundingMultiplier:    1.0,
    despesasMultiplier:        1.0,
  },
  pessimista: {
    label: 'Pessimista',
    color: '#f87171',
    tpvMultiplier:             0.75,  // -25% TPV
    inadimplenciaMultiplier:   1.60,  // +60% delinquency
    txJurosMultiplier:         0.90,  // -10% interest rate (repricing pressure)
    custoFundingMultiplier:    1.30,  // +30% funding cost
    despesasMultiplier:        1.10,  // +10% costs
  },
  otimista: {
    label: 'Otimista',
    color: '#34d399',
    tpvMultiplier:             1.30,  // +30% TPV
    inadimplenciaMultiplier:   0.70,  // -30% delinquency
    txJurosMultiplier:         1.05,  // +5% rate
    custoFundingMultiplier:    0.90,  // -10% funding
    despesasMultiplier:        0.95,  // -5% costs
  },
}
