// Cliente PNCP — porta de contratos_pncp 2.py para TS.
// API pública de consulta: https://pncp.gov.br/api/consulta/v1/contratos
// Sem autenticação. Sem rate-limit oficial documentado; usamos delay defensivo.

export interface PNCPContrato {
  numeroControlePNCP: string;
  numeroContratoEmpenho?: string;
  nomeRazaoSocialFornecedor?: string;
  niFornecedor?: string;
  objetoContrato?: string;
  valorGlobal?: number;
  unidadeOrgao?: {
    nomeUnidade?: string;
    ufSigla?: string;
    municipioNome?: string;
  };
  orgaoEntidade?: { razaoSocial?: string };
  dataVigenciaInicio?: string;
  dataVigenciaFim?: string;
  modalidadeNome?: string;
  tipoPessoa?: string;
}

export interface PNCPResponse {
  data: PNCPContrato[];
  totalRegistros?: number;
  totalPaginas?: number;
  numeroPagina?: number;
  paginasRestantes?: number;
}

export interface SyncOptions {
  ufs: string[];
  dataInicial: string; // YYYYMMDD
  dataFinal: string; // YYYYMMDD
  valorMin?: number;
  valorMax?: number;
  paginasMax?: number;
  delayMs?: number;
}

const BASE_URL = "https://pncp.gov.br/api/consulta/v1/contratos";

async function fetchWithRetry(url: string, retries = 3, timeoutMs = 45_000): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
      clearTimeout(t);
      if (r.ok) return r;
      if (r.status === 429 || r.status >= 500) {
        await new Promise((res) => setTimeout(res, 2 ** attempt * 1000));
        continue;
      }
      return r;
    } catch (e) {
      clearTimeout(t);
      lastErr = e;
      await new Promise((res) => setTimeout(res, 1500 * attempt));
    }
  }
  throw lastErr ?? new Error("fetch failed");
}

export async function fetchContratos(opts: SyncOptions): Promise<PNCPContrato[]> {
  const {
    ufs,
    dataInicial,
    dataFinal,
    valorMin = 0,
    valorMax = Number.POSITIVE_INFINITY,
    paginasMax = 20,
    delayMs = 700,
  } = opts;

  const seen = new Set<string>();
  const out: PNCPContrato[] = [];

  for (const uf of ufs) {
    for (let pagina = 1; pagina <= paginasMax; pagina++) {
      const params = new URLSearchParams({
        dataInicial,
        dataFinal,
        ufSigla: uf,
        pagina: String(pagina),
        tamanhoPagina: "50",
      });
      const url = `${BASE_URL}?${params.toString()}`;

      let r: Response;
      try {
        r = await fetchWithRetry(url);
      } catch {
        break;
      }
      if (!r.ok) break;

      const json = (await r.json()) as PNCPResponse;
      const items = json.data ?? [];
      if (items.length === 0) break;

      for (const item of items) {
        const id = item.numeroControlePNCP;
        if (!id || seen.has(id)) continue;
        seen.add(id);
        const v = item.valorGlobal ?? 0;
        if (v < valorMin || v > valorMax) continue;
        out.push(item);
      }

      if (delayMs > 0) await new Promise((res) => setTimeout(res, delayMs));
    }
  }

  return out;
}

export function pncpDateToISO(s?: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatCNPJ(ni?: string | null): string {
  if (!ni) return "";
  const digits = String(ni).replace(/\D/g, "");
  if (digits.length !== 14) return digits;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}
