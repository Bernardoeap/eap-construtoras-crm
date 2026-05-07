// Enriquecimento por CNPJ — BrasilAPI (gratuito, sem auth).
// Endpoint: https://brasilapi.com.br/api/cnpj/v1/{cnpj}

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

export async function enrichCNPJ(cnpjFormatted: string, timeoutMs = 15_000): Promise<BrasilApiCNPJ | null> {
  const cnpj = cnpjFormatted.replace(/\D/g, "");
  if (cnpj.length !== 14) return null;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
    });
    if (!r.ok) return null;
    return (await r.json()) as BrasilApiCNPJ;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}
