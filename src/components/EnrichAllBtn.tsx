"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Cnpj {
  cnpj: string;
  razaoSocial: string;
}

export function EnrichAllBtn() {
  const [pending, start] = useTransition();
  const [progresso, setProgresso] = useState<{ done: number; total: number; atual: string } | null>(null);
  const [resumo, setResumo] = useState<{ ok: number; erro: number; decisoresCriados: number } | null>(null);
  const [cancelado, setCancelado] = useState(false);
  const router = useRouter();

  function rodar() {
    if (
      !confirm(
        "Vai enriquecer TODAS as construtoras (não-arquivadas) consultando a Receita Federal. Demora alguns minutos. Pode continuar usando outras abas. Confirma?"
      )
    )
      return;

    setProgresso(null);
    setResumo(null);
    setCancelado(false);

    start(async () => {
      const lista: Cnpj[] = await fetch("/api/construtoras/cnpjs").then((r) => r.json());
      let ok = 0;
      let erro = 0;
      let decisoresCriados = 0;

      for (let i = 0; i < lista.length; i++) {
        if (cancelado) break;
        const c = lista[i];
        setProgresso({ done: i, total: lista.length, atual: c.razaoSocial });
        try {
          const r = await fetch(`/api/enrich/cnpj/${encodeURIComponent(c.cnpj)}`, { method: "POST" });
          const d = await r.json();
          if (d.ok) {
            ok++;
            decisoresCriados += d.decisoresCriados ?? 0;
          } else {
            erro++;
          }
        } catch {
          erro++;
        }
        // delay anti-rate-limit
        await new Promise((res) => setTimeout(res, 600));
      }

      setProgresso(null);
      setResumo({ ok, erro, decisoresCriados });
      router.refresh();
    });
  }

  const pct = progresso ? Math.round((progresso.done / progresso.total) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={rodar}
          disabled={pending}
          className="px-5 py-2 rounded-md bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-50"
        >
          {pending ? "Enriquecendo…" : "↗ Enriquecer todas as construtoras"}
        </button>
        {pending && (
          <button
            type="button"
            onClick={() => setCancelado(true)}
            className="px-3 py-2 rounded-md border border-rose-300 text-rose-700 text-sm hover:bg-rose-50"
          >
            Cancelar
          </button>
        )}
      </div>

      {progresso && (
        <div className="space-y-1">
          <div className="text-xs text-slate-600">
            {progresso.done}/{progresso.total} · {progresso.atual.slice(0, 50)}
            {progresso.atual.length > 50 ? "…" : ""}
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div className="bg-brand-500 h-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {resumo && (
        <div className="text-sm">
          ✓ {resumo.ok} enriquecidas · {resumo.erro} falharam ·{" "}
          <strong>{resumo.decisoresCriados}</strong> sócios adicionados como decisores
        </div>
      )}
    </div>
  );
}
