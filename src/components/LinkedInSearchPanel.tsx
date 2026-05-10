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
          {" "}(nome distintivo extraído de "{empresa}"). Cargos sem aspas pra match fuzzy.
        </p>
      </div>

      {/* Buscas primárias — sem cargo, achar empresa toda */}
      <div className="bg-amber-50 border border-amber-200 rounded p-3">
        <div className="text-xs font-semibold mb-2 text-amber-900">⭐ Comece por aqui</div>
        <div className="flex flex-wrap gap-2">
          <a
            href={linkedinUrlEmpresa(empresa)}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 text-xs bg-white border border-amber-300 rounded hover:bg-amber-100 font-medium"
            title="Busca pessoas que mencionam o nome da empresa"
          >
            🏢 Pessoas que trabalham aqui (LinkedIn)
          </a>
          <a
            href={linkedinUrlPaginaEmpresa(empresa)}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 text-xs bg-white border border-amber-300 rounded hover:bg-amber-100 font-medium"
            title="Acha a página oficial da empresa pra ver Funcionários"
          >
            📄 Página da empresa
          </a>
          <a
            href={googleUrlEmpresa(empresa)}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 text-xs bg-white border border-amber-300 rounded hover:bg-amber-100 font-medium"
            title="Google: site:linkedin.com/in"
          >
            🔍 Google (linkedin.com/in)
          </a>
        </div>
        <p className="text-[11px] text-amber-800 mt-2">
          O LinkedIn às vezes esconde a empresa atual de não-conexões. <strong>Página da empresa</strong> →
          aba <em>Funcionários</em> tende a achar mais.
        </p>
      </div>

      {/* Chips por cargo */}
      {tiers.map((tier) => {
        const cargosTier = CARGOS.filter((c) => c.tier === tier);
        return (
          <div key={tier}>
            <div className="text-xs font-semibold mb-2 flex items-center gap-2 flex-wrap">
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
    </section>
  );
}
