"use client";

import { updateStatus } from "@/server-actions/construtoras";
import { STATUS_LABEL, STATUS_ORDEM } from "@/lib/classify";
import { useTransition } from "react";

export function StatusForm({ construtoraId, current }: { construtoraId: string; current: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending || current === "reuniao_marcada"}
        onClick={() => start(() => updateStatus(construtoraId, "reuniao_marcada"))}
        className="px-3 py-2 rounded-md bg-purple-100 text-purple-800 text-sm font-medium hover:bg-purple-200 disabled:opacity-40"
        title="Marcar como Reunião agendada"
      >
        📅 Agendado
      </button>
      <button
        type="button"
        disabled={pending || current === "perdido"}
        onClick={() => start(() => updateStatus(construtoraId, "perdido"))}
        className="px-3 py-2 rounded-md bg-rose-100 text-rose-800 text-sm font-medium hover:bg-rose-200 disabled:opacity-40"
        title="Marcar como Perdido"
      >
        ✗ Perdido
      </button>
      <select
        value={current}
        disabled={pending}
        onChange={(e) => start(() => updateStatus(construtoraId, e.target.value))}
        className="px-3 py-2 border rounded-md text-sm bg-white"
      >
        {STATUS_ORDEM.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </select>
    </div>
  );
}
