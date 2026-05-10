// Gera URLs de busca LinkedIn + Google (site:linkedin.com/in) por cargo + empresa.
// Estratégia: usar nome DISTINTIVO da empresa (só a marca, sem palavras genéricas
// como "construtora", "engenharia", "ltda") e cargo SEM aspas — o LinkedIn faz
// match fuzzy melhor assim.

export type Tier = "A" | "B" | "C";

export interface CargoChip {
  label: string;
  cargo: string;
  tier: Tier;
}

export const CARGOS: CargoChip[] = [
  // Tier A — Decisores
  { label: "Diretor", cargo: "Diretor", tier: "A" },
  { label: "CEO", cargo: "CEO", tier: "A" },
  { label: "Presidente", cargo: "Presidente", tier: "A" },
  { label: "Sócio", cargo: "Sócio", tier: "A" },
  { label: "Diretor Comercial", cargo: "Diretor Comercial", tier: "A" },
  { label: "Diretor de Engenharia", cargo: "Diretor de Engenharia", tier: "A" },
  { label: "Diretor de Operações", cargo: "Diretor de Operações", tier: "A" },

  // Tier B — Influenciadores
  { label: "Gerente Comercial", cargo: "Gerente Comercial", tier: "B" },
  { label: "Gerente Suprimentos", cargo: "Gerente Suprimentos", tier: "B" },
  { label: "Gerente Obras", cargo: "Gerente Obras", tier: "B" },
  { label: "Engenheiro", cargo: "Engenheiro", tier: "B" },

  // Tier C — Gatekeepers
  { label: "Coordenador", cargo: "Coordenador", tier: "C" },
  { label: "Compras", cargo: "Compras", tier: "C" },
  { label: "Suprimentos", cargo: "Suprimentos", tier: "C" },
];

const SUFIXOS_JURIDICOS = /\s+(LTDA|LTDA\.|S\/A|S\.A\.|SA|EIRELI|ME|EPP|MEI|EPC|SPE|CIA|COMPANHIA)\.?$/i;

// Palavras genéricas do setor que poluem buscas LinkedIn (todas construtoras têm)
const PALAVRAS_GENERICAS = /\b(CONSTRUTORA|CONSTRUTORAS|CONSTRUÇÕES|CONSTRUCOES|CONSTRUCAO|CONSTRUÇÃO|ENGENHARIA|INCORPORADORA|INCORPORADORAS|EMPREENDIMENTOS|OBRAS|INFRAESTRUTURA|PAVIMENTAÇÃO|PAVIMENTACAO|EMPREITEIRA|TERRAPLENAGEM|EMPRESA|GRUPO|HOLDING|PARTICIPAÇÕES|PARTICIPACOES|COMÉRCIO|COMERCIO|INDÚSTRIA|INDUSTRIA|SERVIÇOS|SERVICOS|DE|DA|DO|DAS|DOS|E)\b/gi;

export function normalizarRazaoSocial(razao: string): string {
  let limpo = razao.trim();
  for (let i = 0; i < 3; i++) {
    const novo = limpo.replace(SUFIXOS_JURIDICOS, "").trim();
    if (novo === limpo) break;
    limpo = novo;
  }
  return limpo;
}

// Extrai o nome distintivo (só a marca) — remove palavras genéricas e pega as
// primeiras 1-2 palavras significativas que sobram. Ex:
// "TROPICO CONSTRUTORA E INCORPORADORA LTDA" → "TROPICO"
// "FERREIRA E IRMÃOS CONSTRUÇÕES LTDA" → "FERREIRA IRMÃOS"
// "ABC OBRAS E SERVIÇOS LTDA" → "ABC"
export function nomeDistintivo(razao: string): string {
  const semSufixo = normalizarRazaoSocial(razao);
  const semGenericas = semSufixo
    .replace(PALAVRAS_GENERICAS, " ")
    .replace(/\s+/g, " ")
    .trim();

  const palavras = semGenericas.split(/\s+/).filter((w) => w.length > 1);

  if (palavras.length === 0) return semSufixo;
  if (palavras.length === 1) return palavras[0];
  // Se a primeira palavra tem 4+ letras, ela sozinha já é distintiva
  if (palavras[0].length >= 4) return palavras[0];
  // Senão pega as 2 primeiras
  return palavras.slice(0, 2).join(" ");
}

// Buscas primárias (sem cargo) — pra achar a empresa toda no LinkedIn
export function linkedinUrlEmpresa(empresa: string): string {
  const nome = nomeDistintivo(empresa);
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(nome)}&origin=GLOBAL_SEARCH_HEADER`;
}

export function linkedinUrlPaginaEmpresa(empresa: string): string {
  const nome = nomeDistintivo(empresa);
  return `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(nome)}&origin=GLOBAL_SEARCH_HEADER`;
}

export function googleUrlEmpresa(empresa: string): string {
  const nome = nomeDistintivo(empresa);
  const q = `site:linkedin.com/in "${nome}"`;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

// Buscas com cargo — usa nome distintivo + cargo SEM aspas (match fuzzy).
// Para cargos "âncora" (Diretor, CEO, Sócio, Presidente), adiciona filtro
// titleFreeText pra forçar LinkedIn a filtrar por cargo atual = mais preciso.
const CARGOS_ANCORA = ["Diretor", "CEO", "Sócio", "Presidente"];

export function linkedinUrlPorCargo(cargo: string, empresa: string): string {
  const nome = nomeDistintivo(empresa);
  const q = `${cargo} ${nome}`;
  const params = new URLSearchParams({
    keywords: q,
    origin: "GLOBAL_SEARCH_HEADER",
  });
  // titleFreeText filtra cargo atual — só usa para cargos âncora pra não ficar restritivo demais
  const isAncora = CARGOS_ANCORA.some((a) => cargo.toLowerCase().startsWith(a.toLowerCase()));
  if (isAncora) {
    params.set("titleFreeText", cargo);
  }
  return `https://www.linkedin.com/search/results/people/?${params.toString()}`;
}

export function googleUrlPorCargo(cargo: string, empresa: string): string {
  const nome = nomeDistintivo(empresa);
  // Empresa em aspas (precisa ser exata) + cargo livre (Google entende sinônimos)
  const q = `site:linkedin.com/in "${nome}" ${cargo}`;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

export const TIER_LABEL: Record<Tier, string> = {
  A: "Decisores",
  B: "Influenciadores",
  C: "Gatekeepers",
};

export const TIER_COLOR: Record<Tier, string> = {
  A: "bg-emerald-50 border-emerald-300 text-emerald-800",
  B: "bg-blue-50 border-blue-300 text-blue-800",
  C: "bg-slate-50 border-slate-300 text-slate-700",
};

export const TIER_DESC: Record<Tier, string> = {
  A: "Quem fecha — diretoria",
  B: "Quem encaminha pra cima — gerência/engenharia",
  C: "Quem faz a ponte — analista/coordenação",
};
