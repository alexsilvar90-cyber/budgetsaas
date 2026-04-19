import type { Assumptions, ModelOutput, MonthlyRow, ScenarioKey } from './types'
import { SCENARIOS } from './defaults'

// Month label helper
function monthLabel(monthIndex: number): string {
  const startYear = 2026
  const m = ((monthIndex - 1) % 12) + 1
  const y = startYear + Math.floor((monthIndex - 1) / 12)
  return `${String(m).padStart(2, '0')}/${String(y).slice(-2)}`
}

// Apply scenario multipliers on top of base assumptions
function applyScenario(base: Assumptions, scenario: ScenarioKey): Assumptions {
  const s = SCENARIOS[scenario]
  return {
    ...base,
    volume: {
      ...base.volume,
      ticketMedio: base.volume.ticketMedio * s.tpvMultiplier,
      frequenciaMensal: base.volume.frequenciaMensal * s.tpvMultiplier,
    },
    receita: {
      ...base.receita,
      txFinanciamentoMensal: base.receita.txFinanciamentoMensal * s.txJurosMultiplier,
    },
    risco: {
      ...base.risco,
      pctInadimplencia: base.risco.pctInadimplencia * s.inadimplenciaMultiplier,
      pctPerdasWriteOff: base.risco.pctPerdasWriteOff * s.inadimplenciaMultiplier,
      pctPCLD: base.risco.pctPCLD * s.inadimplenciaMultiplier,
    },
    funding: {
      ...base.funding,
      custoFundingMensal: base.funding.custoFundingMensal * s.custoFundingMultiplier,
    },
    despesas: {
      ...base.despesas,
      pessoal: base.despesas.pessoal * s.despesasMultiplier,
      marketing: base.despesas.marketing * s.despesasMultiplier,
      tecnologia: base.despesas.tecnologia * s.despesasMultiplier,
      administrativo: base.despesas.administrativo * s.despesasMultiplier,
    },
  }
}

// Annual cost inflation multiplier for a given month
function costMultiplier(month: number, annualRate: number): number {
  const yearsElapsed = (month - 1) / 12
  return Math.pow(1 + annualRate, yearsElapsed)
}

// Simulate "actual" vs "budget" with small random variation (±8%) for demo
function simulateActual(value: number, month: number): number {
  // Deterministic pseudo-random using month as seed
  const seed = Math.sin(month * 127.1) * 0.08
  return value * (1 + seed)
}

export function runModel(baseAssumptions: Assumptions, scenario: ScenarioKey = 'base'): ModelOutput {
  const a = applyScenario(baseAssumptions, scenario)
  const rows: MonthlyRow[] = []

  let clientesAtivos = a.volume.clientesAtivos
  let caixaAcumulado = a.funding.capitalInicial

  for (let m = 1; m <= 36; m++) {
    const costMult = costMultiplier(m, a.despesas.crescimentoDespesas)

    // ── Volume ──────────────────────────────────────────────────────────────
    const novosClientes = Math.round(clientesAtivos * a.volume.crescimentoClientes)
    const churn = Math.round(clientesAtivos * a.volume.churnMensal)
    const clientesStart = clientesAtivos
    clientesAtivos = clientesAtivos + novosClientes - churn
    const clientesMedio = (clientesStart + clientesAtivos) / 2

    const numTransacoes = clientesMedio * a.volume.frequenciaMensal
    const tpv = clientesMedio * a.volume.ticketMedio * a.volume.frequenciaMensal

    // ── Carteira ─────────────────────────────────────────────────────────────
    const carteira = tpv * a.carteira.pctTPVCarteira * (a.carteira.prazoMedioDias / 30)
    const carteiraRotativo = carteira * a.carteira.pctRotativo
    const carteiraParcelada = carteira * (1 - a.carteira.pctRotativo)

    // ── Receitas ─────────────────────────────────────────────────────────────
    const receitaComissao = tpv * a.receita.txComissaoTPV
    const receitaAntecipacao = carteiraParcelada * a.receita.txAntecipacaoMensal
    const receitaFinanciamento = carteiraRotativo * a.receita.txFinanciamentoMensal
    const receitaServicos = a.receita.receitaServicos
    const receitaOutras = tpv * 0.0008 // 0.08% misc (interchange, fine, etc.)
    const receitaTotal = receitaComissao + receitaAntecipacao + receitaFinanciamento + receitaServicos + receitaOutras

    // ── Risco ─────────────────────────────────────────────────────────────────
    const pcld = carteira * a.risco.pctPCLD
    const perdas = carteira * a.risco.pctPerdasWriteOff
    const recuperacao = perdas * a.risco.pctRecuperacao
    const perdasLiquidas = perdas - recuperacao
    const pctInadimplenciaEfetiva = a.risco.pctInadimplencia

    // ── DRE ──────────────────────────────────────────────────────────────────
    const deducoes = receitaTotal * 0.065 // PIS/COFINS ~6.5% on gross revenue
    const receitaLiquida = receitaTotal - deducoes

    const custoVariavel = tpv * a.despesas.pctCustoVariavelTPV
    const margemBruta = receitaLiquida - custoVariavel - pcld // net of provisions

    const despesasPessoal = a.despesas.pessoal * costMult
    const despesasMarketing = a.despesas.marketing * costMult
    const despesasTecnologia = a.despesas.tecnologia * costMult
    const despesasAdmin = a.despesas.administrativo * costMult
    const despesasOperacionais = despesasPessoal + despesasMarketing + despesasTecnologia + despesasAdmin

    const ebitda = margemBruta - despesasOperacionais

    // ── Resultado Financeiro ──────────────────────────────────────────────────
    const fundingNeeded = Math.max(0, carteira - caixaAcumulado)
    const despesaFunding = fundingNeeded * a.funding.custoFundingMensal
    const rendimentoCaixa = Math.max(0, caixaAcumulado - carteira) * a.funding.rendimentoAplicacoes
    const resultadoFinanceiro = rendimentoCaixa - despesaFunding

    const lucroLiquido = ebitda + resultadoFinanceiro - perdasLiquidas

    // ── Caixa ─────────────────────────────────────────────────────────────────
    const caixaOperacional = ebitda - perdas + recuperacao // cash from ops
    const variacaoCarteira = -(carteira * 0.05) // monthly portfolio change (simplified: net funding)
    const necessidadeFunding = Math.max(0, -caixaOperacional + variacaoCarteira)
    const investimentos = m <= 6 ? -200_000 : -80_000 // capex (heavier in early months)
    caixaAcumulado = caixaAcumulado + caixaOperacional + investimentos
    const caixaFinal = caixaAcumulado

    // ── Budget vs Actual (simulated for demo) ─────────────────────────────────
    // "orçado" = model output; "realizado" has a small random delta
    const orcado = {
      receita: receitaTotal,
      despesas: despesasOperacionais,
      ebitda: ebitda,
      tpv: tpv,
      inadimplencia: pctInadimplenciaEfetiva,
    }
    const realizado = {
      receita: simulateActual(receitaTotal, m),
      despesas: simulateActual(despesasOperacionais, m + 1),
      ebitda: simulateActual(ebitda, m + 2),
      tpv: simulateActual(tpv, m + 3),
      inadimplencia: simulateActual(pctInadimplenciaEfetiva, m + 4),
    }

    // ── KPIs ──────────────────────────────────────────────────────────────────
    const taxaReceita = tpv > 0 ? receitaTotal / tpv : 0
    const margemEbitdaPct = receitaLiquida > 0 ? ebitda / receitaLiquida : 0
    const perdasLiquidasCarteira = carteira > 0 ? perdasLiquidas / carteira : 0

    rows.push({
      month: m,
      label: monthLabel(m),
      clientesAtivos,
      novosClientes,
      churn,
      numTransacoes,
      tpv,
      carteira,
      carteiraRotativo,
      carteiraParcelada,
      receitaComissao,
      receitaAntecipacao,
      receitaFinanciamento,
      receitaServicos,
      receitaOutras,
      receitaTotal,
      pcld,
      perdas,
      recuperacao,
      perdasLiquidas,
      pctInadimplenciaEfetiva,
      deducoes,
      receitaLiquida,
      custoVariavel,
      margemBruta,
      despesasPessoal,
      despesasMarketing,
      despesasTecnologia,
      despesasAdmin,
      despesasOperacionais,
      ebitda,
      resultadoFinanceiro,
      lucroLiquido,
      caixaOperacional,
      variacaoCarteira,
      necessidadeFunding,
      investimentos,
      caixaFinal,
      orcado,
      realizado,
      taxaReceita,
      margemEbitdaPct,
      perdasLiquidasCarteira,
    })
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const totalTPV = rows.reduce((s, r) => s + r.tpv, 0)
  const totalReceita = rows.reduce((s, r) => s + r.receitaTotal, 0)
  const totalEbitda = rows.reduce((s, r) => s + r.ebitda, 0)
  const totalReceitaLiquida = rows.reduce((s, r) => s + r.receitaLiquida, 0)
  const margemEbitdaMedia = totalReceitaLiquida > 0 ? totalEbitda / totalReceitaLiquida : 0
  const totalPerdasLiquidas = rows.reduce((s, r) => s + r.perdasLiquidas, 0)
  const totalClientes = rows[rows.length - 1].clientesAtivos
  const takeRateMedio = totalTPV > 0 ? totalReceita / totalTPV : 0

  return {
    rows,
    summary: { totalTPV, totalReceita, totalEbitda, margemEbitdaMedia, totalPerdasLiquidas, totalClientes, takeRateMedio },
  }
}

// Format BRL currency
export function fmtBRL(value: number, compact = false): string {
  if (compact) {
    if (Math.abs(value) >= 1_000_000_000) return `R$ ${(value / 1_000_000_000).toFixed(1)}B`
    if (Math.abs(value) >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`
    if (Math.abs(value) >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}K`
  }
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

export function fmtPct(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function fmtNum(value: number): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value)
}
