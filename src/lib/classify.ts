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

// Objetos que NAO sao obras civis
const OBJETO_FORA_ICP = /(fiscaliza[çc][ãa]o|apoio (à|a) execu[çc][ãa]o|apoio t[ée]cnico|consultoria|assessoria|gerenciamento|supervis[ãa]o|elabora[çc][ãa]o de projeto|projeto b[áa]sico|projeto executivo|manuten[çc][ãa]o de software|licen[çc]a de uso|software|sistema (de )?inform|aluguel|loca[çc][ãa]o|fornecimento de equipamentos? de (ti|inform)|terceiriza|m[ãa]o de obra|vigil[âa]ncia|portaria|limpeza|alimenta[çc][ãa]o|coffee|combust[íi]vel|gen[ée]ricos)/i;

// Objetos que SAO obras civis (whitelist forte)
const OBJETO_OBRA = /(constru[çc][ãa]o (de|da|do)|execu[çc][ãa]o (de )?obra|obras de engenharia|pavimenta|recape|asfalt|drenagem|saneamento|adutora|esgoto|abastecimento de [áa]gua|estação de tratamento|ete |eta |reforma (de|da|do)|amplia[çc][ãa]o (de|da|do)|moderniza[çc][ãa]o (de|da|do)|reabilita[çc][ãa]o (de|da|do)|requalifica[çc][ãa]o|implanta[çc][ãa]o de|edifica[çc][ãa]o|infraestrutura urbana|terraplenagem|urbaniza[çc][ãa]o|ponte |viaduto|t[úu]nel|hospital |upa |ubs |unidade b[áa]sica|unidade de pronto|escola |emef|cei |ceu |creche|pra[çc]a |muro |passarela|cal[çc]ada)/i;

export function pareceConstrutora(razaoSocial: string, cnae?: string | null): boolean {
  if (cnae && CNAE_CONSTRUCAO.test(cnae)) return true;
  return RAZAO_CONSTRUTORA.test(razaoSocial);
}

export function razaoForaIcp(razaoSocial: string): boolean {
  return RAZAO_FORA_ICP.test(razaoSocial) && !RAZAO_CONSTRUTORA.test(razaoSocial);
}

export function objetoEhObra(objeto: string | null | undefined): boolean {
  if (!objeto) return false;
  if (OBJETO_FORA_ICP.test(objeto)) return false;
  return OBJETO_OBRA.test(objeto);
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
