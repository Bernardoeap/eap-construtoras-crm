"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function TriagemForm() {
  const [pending, start] = useTransition();
  const [resultado, setResultado] = useState<string | null>(null);
  const router = useRouter();

  function rodar() {
    setResultado(null);
    start(async () => {
      const r = await fetch("/api/triagem/validar-carteira", { method: "POST" });
      const d = await r.json();
      if (d.ok) {
        setResultado(`✓ ${d.mensagem}`);
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
        {pending ? "Validando…" : "↗ Validar carteira por contratos"}
      </button>
      {resultado && <div className="text-sm">{resultado}</div>}
    </div>
  );
}
