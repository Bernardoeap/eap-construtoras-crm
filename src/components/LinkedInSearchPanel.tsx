import {
  CARGOS,
  TIER_LABEL,
  TIER_COLOR,
  TIER_DESC,
  type Tier,
  linkedinUrlPorCargo,
  googleUrlPorCargo,
  linkedinUrlEmpresa,
  linkedinUrlPaginaEmpresa,
  googleUrlEmpresa,
  nomeDistintivo,
} from "@/lib/linkedin-search";

export function LinkedInSearchPanel({ empresa }: { empresa: string }) {
  const tiers: Tier[] = ["A", "B", "C"];
  const nomeUsado = nomeDistintivo(empresa);

  return (
    <section className="bg-white border rounded-lg p-5 space-y-4">
      <div>
        <h2 className="font-semibold">Encontrar decisores no LinkedIn</h2>
        <p className="text-xs text-slate-500 mt-1">
          Buscando por <span className="font-mono font-semibold text-slate-700">{nomeUsado}</span>
          {" "}(extraído de "{empresa}").
        </p>
      </div>

      {/* Caminho recomendado: achar a empresa → aba Funcionários */}
      <div className="bg-emerald-50 border-2 border-emerald-300 rounded p-3">
        <div className="text-sm font-bold mb-1 text-emerald-900">
          ✅ Caminho que funciona melhor
        </div>
        <p className="text-xs text-emerald-900 mb-3">
          Clica abaixo → acha a empresa na busca → entra nela → clica na aba <strong>"Funcionários"</strong>.
          O LinkedIn lista todos os funcionários ali, mesmo os que não aparecem na busca de pessoas.
        </p>
        <a
          href={linkedinUrlPaginaEmpresa(empresa)}
          target="_blank"
          rel="noreferrer"
          className="inline-block px-4 py-2 bg-emerald-600 text-white rounded font-medium text-sm hover:bg-emerald-700"
        >
          🏢 Achar empresa no LinkedIn →
        </a>
      </div>

      {/* Alternativas: pessoa direta + Google */}
      <div>
        <div className="text-xs font-semibold mb-2 text-slate-700">Buscas alternativas</div>
        <div className="flex flex-wrap gap-2">
          <a
            href={linkedinUrlEmpresa(empresa)}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded hover:bg-slate-50"
            title="Busca pessoas que mencionam o nome — pode trazer noise"
          >
            👥 Pessoas com o nome (LinkedIn)
          </a>
          <a
            href={googleUrlEmpresa(empresa)}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded hover:bg-slate-50"
            title="Google: site:linkedin.com/in"
          >
            🔍 Google (linkedin.com/in)
          </a>
        </div>
      </div>

      {/* Chips por cargo (busca direta cargo + nome) */}
      <div className="border-t pt-4">
        <div className="text-xs font-semibold mb-3 text-slate-700">
          Ou busca direto por cargo + empresa (LinkedIn ↗ ou Google 🔍)
        </div>
        <div className="space-y-3">
          {tiers.map((tier) => {
            const cargosTier = CARGOS.filter((c) => c.tier === tier);
            return (
              <div key={tier}>
                <div className="text-xs font-medium mb-1.5 flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded border ${TIER_COLOR[tier]}`}>
                    Tier {tier} — {TIER_LABEL[tier]}
                  </span>
                  <span className="text-slate-500 font-normal">{TIER_DESC[tier]}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cargosTier.map((c) => (
                    <div
                      key={c.cargo}
                      className={`flex items-stretch border rounded ${TIER_COLOR[c.tier]} text-xs`}
                    >
                      <span className="px-2 py-1 font-medium">{c.label}</span>
                      <a
                        href={linkedinUrlPorCargo(c.cargo, empresa)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 hover:bg-white/60 border-l border-current/20"
                        title={`LinkedIn: ${c.cargo} ${nomeUsado}`}
                      >
                        in/
                      </a>
                      <a
                        href={googleUrlPorCargo(c.cargo, empresa)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 hover:bg-white/60 border-l border-current/20"
                        title={`Google: site:linkedin.com/in "${nomeUsado}" ${c.cargo}`}
                      >
                        🔍
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
