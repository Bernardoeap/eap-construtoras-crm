"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface ItemBackfill {
  id: string;
  numero: string;
  empresa: string;
}

export function BackfillContratosBtn() {
  const [pending, start] = useTransition();
  const [progresso, setProgresso] = useState<{ done: number; total: number; atual: string } | null>(null);
  const [resumo, setResumo] = useState<{ ok: number; erro: number } | null>(null);
  const [cancelado, setCancelado] = useState(false);
  const router = useRouter();

  function rodar() {
    setProgresso(null);
    setResumo(null);
    setCancelado(false);

    start(async () => {
      const lista: ItemBackfill[] = await fetch("/api/contratos/sem-detalhe").then((r) => r.json());
      if (lista.length === 0) {
        setResumo({ ok: 0, erro: 0 });
        return;
      }
      let ok = 0;
      let erro = 0;

      for (let i = 0; i < lista.length; i++) {
        if (cancelado) break;
        const c = lista[i];
        setProgresso({ done: i, total: lista.length, atual: c.empresa });
        try {
          const r = await fetch(`/api/contratos/${c.id}/backfill`, { method: "POST" });
          const d = await r.json();
          if (d.ok) ok++;
          else erro++;
        } catch {
          erro++;
        }
        await new Promise((res) => setTimeout(res, 500));
      }

      setProgresso(null);
      setResumo({ ok, erro });
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
          className="px-5 py-2 rounded-md bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
        >
          {pending ? "Buscando…" : "↗ Buscar valores e vigências no PNCP"}
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
            <div className="bg-amber-500 h-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {resumo && (
        <div className="text-sm">
          {resumo.ok === 0 && resumo.erro === 0
            ? "✓ Nenhum contrato precisava de backfill"
            : `✓ ${resumo.ok} preenchidos · ${resumo.erro} sem retorno do PNCP`}
        </div>
      )}
    </div>
  );
}
