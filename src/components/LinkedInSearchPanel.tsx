import {
  CARGOS,
  TIER_LABEL,
  TIER_COLOR,
  TIER_DESC,
  type Tier,
  linkedinUrlPorCargo,
  googleUrlPorCargo,
  normalizarRazaoSocial,
} from "@/lib/linkedin-search";

export function LinkedInSearchPanel({ empresa }: { empresa: string }) {
  const tiers: Tier[] = ["A", "B", "C"];
  const empresaLimpa = normalizarRazaoSocial(empresa);

  return (
    <section className="bg-white border rounded-lg p-5 space-y-4">
      <div>
        <h2 className="font-semibold">Encontrar decisores no LinkedIn</h2>
        <p className="text-xs text-slate-500 mt-1">
          Busca por cargo + <span className="font-mono">{empresaLimpa}</span>. Cada chip tem 2 links: LinkedIn (busca direta) e Google (acha mais perfis via <span className="font-mono">site:linkedin.com/in</span>).
        </p>
      </div>

      {tiers.map((tier) => {
        const cargosTier = CARGOS.filter((c) => c.tier === tier);
        return (
          <div key={tier}>
            <div className="text-xs font-semibold mb-2 flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded border ${TIER_COLOR[tier]}`}>
                Tier {tier} — {TIER_LABEL[tier]}
              </span>
              <span className="text-slate-500 font-normal">{TIER_DESC[tier]}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {cargosTier.map((c) => (
                <div
                  key={c.cargo}
                  className={`flex items-center border rounded ${TIER_COLOR[c.tier]}`}
                >
                  <span className="px-2 py-1 text-xs font-medium border-r border-current/20">
                    {c.label}
                  </span>
                  <a
                    href={linkedinUrlPorCargo(c.cargo, empresa)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-1 text-xs hover:bg-white/50"
                    title="Buscar no LinkedIn"
                  >
                    in/
                  </a>
                  <a
                    href={googleUrlPorCargo(c.cargo, empresa)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-1 text-xs hover:bg-white/50 border-l border-current/20"
                    title="Buscar no Google (site:linkedin.com/in)"
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
