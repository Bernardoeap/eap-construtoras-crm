"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function EnrichBtn({ cnpj }: { cnpj: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => {
          setMsg(null);
          start(async () => {
            const r = await fetch(`/api/enrich/cnpj/${encodeURIComponent(cnpj)}`, { method: "POST" });
            if (r.ok) {
              const d = await r.json();
              if (d.ok) {
                const extra = d.decisoresCriados ? ` · ${d.decisoresCriados} sócios adicionados como decisores` : "";
                setMsg(`Enriquecido com sucesso.${extra}`);
              } else {
                setMsg(d.erro ?? "Falhou");
              }
              router.refresh();
            } else {
              setMsg("Erro ao chamar BrasilAPI.");
            }
          });
        }}
        disabled={pending}
        className="px-3 py-2 rounded-md border bg-white text-sm hover:bg-slate-100 disabled:opacity-50"
      >
        {pending ? "Buscando…" : "↗ Enriquecer (BrasilAPI)"}
      </button>
      {msg && <span className="text-xs text-slate-600">{msg}</span>}
    </div>
  );
}
