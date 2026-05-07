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

export function pareceConstrutora(razaoSocial: string, cnae?: string | null): boolean {
  if (cnae && CNAE_CONSTRUCAO.test(cnae)) return true;
  return RAZAO_CONSTRUTORA.test(razaoSocial);
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
