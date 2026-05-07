"use client";

import { agendarReuniao, marcarReuniaoStatus } from "@/server-actions/reunioes";
import { useState, useTransition } from "react";

export function ReuniaoForm({ construtoraId }: { construtoraId: string }) {
  const [titulo, setTitulo] = useState("Reunião comercial");
  const [dataHora, setDataHora] = useState("");
  const [notas, setNotas] = useState("");
  const [pending, start] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!dataHora) return;
        start(async () => {
          await agendarReuniao(construtoraId, titulo, dataHora, notas);
          setNotas("");
        });
      }}
      className="space-y-2"
    >
      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        className="w-full px-3 py-2 border rounded-md text-sm"
        placeholder="Título"
      />
      <input
        type="datetime-local"
        value={dataHora}
        onChange={(e) => setDataHora(e.target.value)}
        className="w-full px-3 py-2 border rounded-md text-sm"
      />
      <textarea
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
        rows={2}
        placeholder="Notas / pauta (opcional)"
        className="w-full px-3 py-2 border rounded-md text-sm"
      />
      <button type="submit" disabled={pending || !dataHora} className="px-4 py-2 rounded-md bg-brand-500 text-white text-sm disabled:opacity-50">
        {pending ? "Agendando…" : "Agendar reunião"}
      </button>
    </form>
  );
}

export function MarcarStatusBtn({ reuniaoId, status }: { reuniaoId: string; status: "realizada" | "cancelada" | "no-show" }) {
  const [pending, start] = useTransition();
  const labels: Record<string, string> = { realizada: "✓ realizada", cancelada: "✗ cancelar", "no-show": "⊘ no-show" };
  return (
    <button
      onClick={() => start(() => marcarReuniaoStatus(reuniaoId, status))}
      disabled={pending}
      className="px-2 py-1 text-xs rounded border hover:bg-slate-100 disabled:opacity-50"
    >
      {labels[status]}
    </button>
  );
}
