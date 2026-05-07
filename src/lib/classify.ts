export type TipoObra =
  | "rodovia"
  | "ponte"
  | "saneamento"
  | "saude"
  | "educacao"
  | "edificacao"
  | "outro";

export type FaixaFaturamento =
  | "pequena"
  | "media"
  | "media-grande"
  | "grande"
  | "mega";

const PATTERNS: Array<{ tipo: TipoObra; regex: RegExp }> = [
  { tipo: "ponte", regex: /\b(ponte|viaduto)s?\b/i },
  { tipo: "saneamento", regex: /(\b(esgoto|saneamento|adutora|drenagem|ete|eta)\b|estação\s+de\s+tratamento|rede\s+de\s+água|abastecimento\s+de\s+água)/i },
  { tipo: "saude", regex: /\b(hospital|hospitalar|upa|ubs|unidade\s+básica|unidade\s+de\s+pronto|posto\s+de\s+saúde|caps)\b/i },
  { tipo: "educacao", regex: /\b(escola|emef|emei|cei|ceu|creche|universidade|faculdade)\b/i },
  { tipo: "rodovia", regex: /\b(rodovia|asfalt|pavimenta|recape|estrada|via\s+pública|sinaliza)/i },
  { tipo: "edificacao", regex: /\b(edificação|prédio|sede|reforma|construção\s+de)\b/i },
];

export function classificarTipoObra(objeto: string | null | undefined): TipoObra {
  if (!objeto) return "outro";
  for (const { tipo, regex } of PATTERNS) {
    if (regex.test(objeto)) return tipo;
  }
  return "outro";
}

const RAZAO_CONSTRUTORA = /(construtora|construções|construcoes|engenharia|obras|infraestrutura|pavimenta|empreiteira|edificações|edificacoes|terraplenagem)/i;
const CNAE_CONSTRUCAO = /^4[123]/;

// Razoes que claramente NAO sao construtoras de obras
const RAZAO_FORA_ICP = /(soluç|solucoes|tecnologia|inform[áa]tica|sistemas|software|consultoria|com[ée]rcio|comercial|distribuidora|servi[çc]os terceiriz|seguran[çc]a|limp|m[ãa]o de obra|telecomunic|alimenta|agropec|associa[çc][ãa]o|sindicato|cooperativa|tribunal|prefeitura)/i;

// Objetos puramente de servico (sem nenhuma obra fisica) — usados so como sinal fraco
const OBJETO_FORA_ICP = /^(fiscaliza[çc][ãa]o|consultoria|assessoria|elabora[çc][ãa]o de projeto|gerenciamento|supervis[ãa]o|software|licen[çc]a de uso|aluguel|loca[çc][ãa]o de equipamento|m[ãa]o de obra terceirizada|vigil[âa]ncia|limpeza|alimenta[çc][ãa]o)/i;

// Whitelist ampla: qualquer coisa que envolva construir/reformar/intervir fisicamente em obra
const OBJETO_OBRA = /(constru[çc][ãa]o|construir|construindo|construtivo|edifica[çc][ãa]o|edificar|reforma(r|s|ndo)?|amplia[çc][ãa]o|ampliar|moderniza[çc][ãa]o|modernizar|reabilita[çc][ãa]o|requalifica[çc][ãa]o|recupera[çc][ãa]o|adequa[çc][ãa]o|implanta[çc][ãa]o|implantar|execu[çc][ãa]o (da|de) obra|obras? (de|civil|p[úu]blica|complementar|de engenharia)|servi[çc]os? de engenharia|pavimenta|repavimenta|recape|asfalt|tapa-buraco|terraplenagem|urbaniza[çc][ãa]o|drenagem|galeria|saneamento|adutora|esgoto|estação? de tratamento|ete\b|eta\b|abastecimento de [áa]gua|hidr[áa]ulica|el[ée]trica predial|estrutura(l|s)|alvenaria|concreto|cobertura|telhado|funda[çc][ãa]o|pintura predial|revestimento|impermeabiliza|prote[çc][ãa]o de talude|conten[çc][ãa]o|muro|passarela|cal[çc]ada|cal[çc]amento|estrada|rodovia|via p[úu]blica|ponte|viaduto|t[úu]nel|hospital|upa|ubs|unidade b[áa]sica|unidade de pronto|posto de sa[úu]de|escola|emef|emei|cei|ceu|creche|universidade|pra[çc]a|parque|gin[áa]sio|quadra (poliesportiva|esportiva)|est[áa]dio|cemit[ée]rio)/i;

export function pareceConstrutora(razaoSocial: string, cnae?: string | null): boolean {
  if (cnae && CNAE_CONSTRUCAO.test(cnae)) return true;
  return RAZAO_CONSTRUTORA.test(razaoSocial);
}

export function razaoForaIcp(razaoSocial: string): boolean {
  return RAZAO_FORA_ICP.test(razaoSocial) && !RAZAO_CONSTRUTORA.test(razaoSocial);
}

export function objetoEhObra(objeto: string | null | undefined): boolean {
  if (!objeto) return false;
  if (OBJETO_OBRA.test(objeto)) return true;
  if (OBJETO_FORA_ICP.test(objeto)) return false;
  return false;
}

export function cnaeEhConstrucao(cnae: string | null | undefined): boolean {
  if (!cnae) return false;
  return CNAE_CONSTRUCAO.test(cnae);
}

export function classificarFaixaFaturamento(valorAcumulado: number | null | undefined): FaixaFaturamento | null {
  if (valorAcumulado == null || valorAcumulado <= 0) return null;
  if (valorAcumulado < 10_000_000) return "pequena";
  if (valorAcumulado < 50_000_000) return "media";
  if (valorAcumulado < 200_000_000) return "media-grande";
  if (valorAcumulado < 1_000_000_000) return "grande";
  return "mega";
}

// Heuristica de faturamento anual estimado.
// Combina: porte da Receita (CAP duro p/ ME e EPP), soma de contratos PNCP nos
// ultimos 24 meses (anualizada e ajustada por receita privada), e capital social
// (proxy fraco, usado como piso).
export function estimarFaturamento(opts: {
  porte?: string | null; // "ME" | "EPP" | "DEMAIS" | "MEI"
  somaContratos24m?: number | null; // BRL
  capitalSocial?: number | null; // BRL
}): { valor: number | null; faixa: FaixaFaturamento | null; explicacao: string } {
  const porte = (opts.porte ?? "").toUpperCase();
  const soma = opts.somaContratos24m ?? 0;
  const capital = opts.capitalSocial ?? 0;

  // PNCP: soma de 24 meses / 2 = receita publica anual; * 1,5 cobre receita privada (assume ~2/3 publico)
  const dePNCP = soma > 0 ? (soma / 2) * 1.5 : 0;

  // Capital social como piso fraco (~5x capital declarado e tipico de construtora ativa)
  const deCapital = capital > 0 ? capital * 5 : 0;

  let valor = Math.max(dePNCP, deCapital);

  // Caps duros por porte (oficial Receita)
  let cap: number | null = null;
  if (porte === "MEI") cap = 81_000;
  else if (porte === "ME") cap = 360_000;
  else if (porte === "EPP") cap = 4_800_000;
  // "DEMAIS": sem cap (>R$4,8mi, vai do que a heuristica disser)

  if (cap !== null) valor = Math.min(valor || cap, cap);

  if (valor <= 0) {
    return { valor: null, faixa: null, explicacao: "sem dados suficientes" };
  }

  // Monta string explicativa
  const partes: string[] = [];
  if (porte) partes.push(`porte Receita: ${porte}`);
  if (dePNCP > 0) partes.push(`contratos PNCP 24m → ~${(dePNCP / 1_000_000).toFixed(1)}mi/ano`);
  if (deCapital > 0) partes.push(`capital social → piso ~${(deCapital / 1_000_000).toFixed(1)}mi`);

  return {
    valor,
    faixa: classificarFaixaFaturamento(valor),
    explicacao: partes.join(" · "),
  };
}

export const FAIXAS_LABEL: Record<FaixaFaturamento, string> = {
  pequena: "Pequena (< R$ 10mi)",
  media: "Média (R$ 10–50mi)",
  "media-grande": "Média-grande (R$ 50–200mi)",
  grande: "Grande (R$ 200mi–1bi)",
  mega: "Mega (> R$ 1bi)",
};

export const TIPO_OBRA_LABEL: Record<TipoObra, string> = {
  rodovia: "Rodovias / pavimentação",
  ponte: "Pontes / viadutos",
  saneamento: "Saneamento / água",
  saude: "Saúde (UPA/UBS/hospital)",
  educacao: "Educação",
  edificacao: "Edificações",
  outro: "Outro",
};

export const STATUS_ORDEM = [
  "novo",
  "contatado",
  "qualificado",
  "reuniao_marcada",
  "reuniao_realizada",
  "ganho",
  "perdido",
] as const;

export const STATUS_LABEL: Record<string, string> = {
  novo: "Novo",
  contatado: "Contatado",
  qualificado: "Qualificado",
  reuniao_marcada: "Reunião marcada",
  reuniao_realizada: "Reunião realizada",
  ganho: "Ganho",
  perdido: "Perdido",
};

export const STATUS_COLOR: Record<string, string> = {
  novo: "bg-slate-200 text-slate-800",
  contatado: "bg-blue-100 text-blue-800",
  qualificado: "bg-amber-100 text-amber-800",
  reuniao_marcada: "bg-purple-100 text-purple-800",
  reuniao_realizada: "bg-indigo-100 text-indigo-800",
  ganho: "bg-emerald-100 text-emerald-800",
  perdido: "bg-rose-100 text-rose-800",
};
