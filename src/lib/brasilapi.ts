// Enriquecimento por CNPJ — BrasilAPI com fallback para CNPJá Open.
// Ambos sao gratuitos, sem auth, e refletem dados publicos da Receita Federal.

export interface BrasilApiCNPJ {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  cnae_fiscal?: number;
  cnae_fiscal_descricao?: string;
  cnaes_secundarios?: Array<{ codigo: number; descricao: string }>;
  capital_social?: number | string;
  email?: string;
  ddd_telefone_1?: string;
  ddd_telefone_2?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  qsa?: Array<{
    nome_socio?: string;
    qualificacao_socio?: string;
    cnpj_cpf_do_socio?: string;
    faixa_etaria?: string;
  }>;
  descricao_situacao_cadastral?: string;
}

interface CNPJaOpenResponse {
  taxId: string;
  company?: { name?: string; members?: Array<{ person?: { name?: string }; role?: { text?: string } }> };
  alias?: string;
  mainActivity?: { id?: number; text?: string };
  sideActivities?: Array<{ id?: number; text?: string }>;
  emails?: Array<{ address?: string }>;
  phones?: Array<{ area?: string; number?: string }>;
  address?: { city?: string; state?: string; street?: string; number?: string; district?: string; zip?: string };
  status?: { text?: string };
}

async function fetchJSON<T>(url: string, timeoutMs = 15_000): Promise<{ data: T | null; status: number }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
    if (!r.ok) return { data: null, status: r.status };
    return { data: (await r.json()) as T, status: r.status };
  } catch {
    return { data: null, status: 0 };
  } finally {
    clearTimeout(t);
  }
}

function mapCnpjaToBrasilApi(d: CNPJaOpenResponse): BrasilApiCNPJ {
  const phone1 = d.phones?.[0];
  const phone2 = d.phones?.[1];
  return {
    cnpj: d.taxId,
    razao_social: d.company?.name ?? "",
    nome_fantasia: d.alias,
    cnae_fiscal: d.mainActivity?.id,
    cnae_fiscal_descricao: d.mainActivity?.text,
    cnaes_secundarios: d.sideActivities?.map((a) => ({ codigo: a.id ?? 0, descricao: a.text ?? "" })),
    email: d.emails?.[0]?.address,
    ddd_telefone_1: phone1 ? `(${phone1.area}) ${phone1.number}` : undefined,
    ddd_telefone_2: phone2 ? `(${phone2.area}) ${phone2.number}` : undefined,
    municipio: d.address?.city,
    uf: d.address?.state,
    descricao_situacao_cadastral: d.status?.text,
    qsa: d.company?.members?.map((m) => ({
      nome_socio: m.person?.name,
      qualificacao_socio: m.role?.text,
    })),
  };
}

export async function enrichCNPJ(cnpjFormatted: string): Promise<{ data: BrasilApiCNPJ | null; fonte: string }> {
  const cnpj = cnpjFormatted.replace(/\D/g, "");
  if (cnpj.length !== 14) return { data: null, fonte: "cnpj-invalido" };

  // 1a tentativa: BrasilAPI
  const a = await fetchJSON<BrasilApiCNPJ>(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
  if (a.data) return { data: a.data, fonte: "brasilapi" };

  // 2a tentativa: CNPJa Open
  const b = await fetchJSON<CNPJaOpenResponse>(`https://open.cnpja.com/office/${cnpj}`);
  if (b.data) return { data: mapCnpjaToBrasilApi(b.data), fonte: "cnpja-open" };

  return { data: null, fonte: `falhou (brasilapi:${a.status} cnpja:${b.status})` };
}
