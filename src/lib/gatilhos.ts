// Análise de gatilho técnico-comercial baseada em vigência e valor do contrato.
// Objetivo: dar pra cada contrato um "ângulo de abordagem" pra reunião comercial.

export type GatilhoTipo =
  | "REEQUILIBRIO"        // Contrato antigo (>12m): inflação corrói margem, oportunidade de pleito
  | "IMPLANTACAO"         // Contrato novo (<3m): fase de setup, instalar controles
  | "ACOMPANHAMENTO"      // Contrato em meio de execução (3-12m): consultoria pontual
  | "ENCERRAMENTO";       // Contrato vencendo (<6m de vigência restante): suporte de fechamento / aditivo

export interface Gatilho {
  tipo: GatilhoTipo;
  label: string;
  descricao: string;
  cor: string;            // Tailwind classes
  mesesExecucao: number;  // meses desde início (negativo se ainda vai começar)
  mesesRestantes: number | null; // meses até vigência fim (null se sem fim)
}

// Diferença em meses entre 2 datas
function diffMeses(de: Date, ate: Date): number {
  const ms = ate.getTime() - de.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24 * 30.44));
}

export function calcularGatilho(opts: {
  vigenciaInicio?: Date | null;
  vigenciaFim?: Date | null;
  agora?: Date;
}): Gatilho | null {
  const agora = opts.agora ?? new Date();
  if (!opts.vigenciaInicio) return null;

  const mesesExecucao = diffMeses(opts.vigenciaInicio, agora);
  const mesesRestantes = opts.vigenciaFim ? diffMeses(agora, opts.vigenciaFim) : null;

  // Contrato já encerrado — sem gatilho
  if (mesesRestantes !== null && mesesRestantes < 0) {
    return null;
  }

  // Contrato vencendo (<= 6 meses pra acabar) E já em execução: encerramento/aditivo
  if (mesesRestantes !== null && mesesRestantes <= 6 && mesesExecucao > 0) {
    return {
      tipo: "ENCERRAMENTO",
      label: "ENCERRAMENTO / ADITIVO",
      descricao: `Contrato com ${mesesRestantes} mês${mesesRestantes !== 1 ? "es" : ""} restantes — janela pra pleito de aditivo de prazo/valor.`,
      cor: "bg-orange-100 text-orange-800 border-orange-300",
      mesesExecucao,
      mesesRestantes,
    };
  }

  // Contrato antigo (>12m em execução): reequilíbrio
  if (mesesExecucao > 12) {
    return {
      tipo: "REEQUILIBRIO",
      label: "REEQUILÍBRIO",
      descricao: `${mesesExecucao} meses de inflação acumulada — margem corroída, abre pleito de reequilíbrio econômico-financeiro.`,
      cor: "bg-rose-100 text-rose-800 border-rose-300",
      mesesExecucao,
      mesesRestantes,
    };
  }

  // Contrato muito recente (<3m): implantação de controles
  if (mesesExecucao >= 0 && mesesExecucao < 3) {
    return {
      tipo: "IMPLANTACAO",
      label: "IMPLANTAÇÃO DE CONTROLES",
      descricao: `Contrato recém-assinado (${mesesExecucao} mês${mesesExecucao !== 1 ? "es" : ""}) — fase certa pra instalar controles de produção e evitar perdas iniciais.`,
      cor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      mesesExecucao,
      mesesRestantes,
    };
  }

  // Meio de execução (3-12m): acompanhamento técnico
  return {
    tipo: "ACOMPANHAMENTO",
    label: "ACOMPANHAMENTO",
    descricao: `${mesesExecucao} meses em execução — momento ideal pra revisar custos reais vs orçado e ajustar produção.`,
    cor: "bg-blue-100 text-blue-800 border-blue-300",
    mesesExecucao,
    mesesRestantes,
  };
}

// "Saúde" do lead: combinação de valor total e recência da assinatura
export type SaudeLead = "verde" | "amarelo" | "vermelho";

export function classificarSaudeLead(opts: {
  valorTotalContratos: number;
  contratoMaisRecente?: Date | null;
}): { saude: SaudeLead; razao: string; cor: string } {
  const valor = opts.valorTotalContratos;
  const recente = opts.contratoMaisRecente;

  // Verde: contrato alto E recente
  if (valor >= 10_000_000 && recente && diffMeses(recente, new Date()) <= 18) {
    return {
      saude: "verde",
      razao: "Contrato alto e recente",
      cor: "bg-emerald-500",
    };
  }

  // Amarelo: contrato médio (R$2-10M) ou contratos altos antigos
  if (valor >= 2_000_000) {
    return {
      saude: "amarelo",
      razao: valor >= 10_000_000 ? "Contrato alto, mas antigo" : "Contrato médio",
      cor: "bg-amber-500",
    };
  }

  // Vermelho: baixo valor
  return {
    saude: "vermelho",
    razao: "Baixo valor — qualificar antes de investir tempo",
    cor: "bg-rose-500",
  };
}
