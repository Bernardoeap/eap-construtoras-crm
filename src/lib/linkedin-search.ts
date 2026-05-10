// Gera URLs de busca LinkedIn + Google (site:linkedin.com/in) por cargo + empresa.
// O Google frequentemente surge perfis melhores que a busca nativa do LinkedIn.

export type Tier = "A" | "B" | "C";

export interface CargoChip {
  label: string;
  cargo: string;
  tier: Tier;
}

export const CARGOS: CargoChip[] = [
  // Tier A — Decisores
  { label: "CEO / Diretor Geral", cargo: "Diretor Geral", tier: "A" },
  { label: "Diretor Comercial", cargo: "Diretor Comercial", tier: "A" },
  { label: "Diretor de Operações", cargo: "Diretor de Operações", tier: "A" },
  { label: "Diretor de Engenharia", cargo: "Diretor de Engenharia", tier: "A" },
  { label: "Sócio Administrador", cargo: "Sócio Administrador", tier: "A" },

  // Tier B — Influenciadores
  { label: "Gerente Comercial", cargo: "Gerente Comercial", tier: "B" },
  { label: "Gerente de Suprimentos", cargo: "Gerente de Suprimentos", tier: "B" },
  { label: "Gerente de Obras", cargo: "Gerente de Obras", tier: "B" },
  { label: "Diretor de TI", cargo: "Diretor de TI", tier: "B" },

  // Tier C — Gatekeepers
  { label: "Coordenador Comercial", cargo: "Coordenador Comercial", tier: "C" },
  { label: "Compras", cargo: "Compras", tier: "C" },
  { label: "Assistente de Diretoria", cargo: "Assistente de Diretoria", tier: "C" },
];

const SUFIXOS_JURIDICOS = /\s+(LTDA|LTDA\.|S\/A|S\.A\.|SA|EIRELI|ME|EPP|MEI|EPC|SPE|CIA|COMPANHIA)\.?$/i;

export function normalizarRazaoSocial(razao: string): string {
  let limpo = razao.trim();
  // Remove sufixos jurídicos repetidamente (alguns nomes têm 2: "X CONSTRUÇÕES LTDA ME")
  for (let i = 0; i < 3; i++) {
    const novo = limpo.replace(SUFIXOS_JURIDICOS, "").trim();
    if (novo === limpo) break;
    limpo = novo;
  }
  return limpo;
}

export function linkedinUrlPorCargo(cargo: string, empresa: string): string {
  const empresaLimpa = normalizarRazaoSocial(empresa);
  const q = `"${cargo}" "${empresaLimpa}"`;
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(q)}&origin=GLOBAL_SEARCH_HEADER`;
}

export function googleUrlPorCargo(cargo: string, empresa: string): string {
  const empresaLimpa = normalizarRazaoSocial(empresa);
  const q = `site:linkedin.com/in "${cargo}" "${empresaLimpa}"`;
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
  B: "Quem encaminha pra cima — gerência",
  C: "Quem faz a ponte — analista/assistente",
};
