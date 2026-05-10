"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmarDecisor, deleteDecisor } from "@/server-actions/decisores";

export function ConfirmarDescartarBtns({ decisorId, nome }: { decisorId: string; nome: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function confirmar() {
    start(async () => {
      await confirmarDecisor(decisorId);
      router.refresh();
    });
  }

  function descartar() {
    if (!window.confirm(`Descartar "${nome}"? O decisor será removido.`)) return;
    start(async () => {
      await deleteDecisor(decisorId);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2 shrink-0">
      <button
        onClick={confirmar}
        disabled={pending}
        className="px-3 py-1.5 text-xs rounded bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50"
      >
        ✓ Confirmar
      </button>
      <button
        onClick={descartar}
        disabled={pending}
        className="px-3 py-1.5 text-xs rounded border border-rose-300 text-rose-700 hover:bg-rose-50 disabled:opacity-50"
      >
        ✗ Descartar
      </button>
    </div>
  );
}
