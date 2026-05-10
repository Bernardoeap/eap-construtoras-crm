"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { marcarProspeccaoTrabalhada } from "@/server-actions/interacoes";

export function MarcarTrabalhadaBtn({
  construtoraId,
  proximaId,
}: {
  construtoraId: string;
  proximaId?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function clicar() {
    start(async () => {
      await marcarProspeccaoTrabalhada(construtoraId);
      if (proximaId) {
        router.push(`/prospeccao?id=${proximaId}`);
      } else {
        router.push("/prospeccao");
      }
      router.refresh();
    });
  }

  return (
    <button
      onClick={clicar}
      disabled={pending}
      className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
    >
      {pending ? "..." : "✓ Trabalhada → Próxima"}
    </button>
  );
}
