"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function TriagemForm({ totalConstrutoras }: { totalConstrutoras: number }) {
  const [pending, start] = useTransition();
  const [resultado, setResultado] = useState<string | null>(null);
  const router = useRouter();

  function rodar() {
    if (
      !confirm(
        `Vai consultar a Receita Federal pra ${totalConstrutoras} CNPJs (~500ms cada). Pode levar uns ${Math.ceil(
          (totalConstrutoras * 0.5) / 60
        )} min. Confirma?`
      )
    )
      return;

    setResultado(null);
    start(async () => {
      const r = await fetch("/api/triagem/validar-carteira", { method: "POST" });
      const d = await r.json();
      if (d.ok) {
        setResultado(
          `✓ ${d.processadas} processadas · ${d.construcao} CNAE de construção · ${d.foraIcp} marcadas fora do ICP · ${d.semRetorno} sem retorno`
        );
        router.refresh();
      } else {
        setResultado(`✗ ${d.erro ?? "erro"}`);
      }
    });
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={rodar}
        disabled={pending}
        className="px-5 py-2 rounded-md bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-50"
      >
        {pending ? "Validando…" : "↗ Validar carteira via Receita"}
      </button>
      {resultado && <div className="text-sm">{resultado}</div>}
    </div>
  );
}
