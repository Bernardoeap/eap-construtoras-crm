"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStatus } from "@/server-actions/construtoras";

export function MarcarPerdidoBtn({
  construtoraId,
  proximaId,
  tab,
  variant = "default",
}: {
  construtoraId: string;
  proximaId?: string;
  tab: "pesquisar" | "confirmar";
  variant?: "default" | "compact";
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function clicar() {
    if (!window.confirm("Marcar como PERDIDA? A construtora vai sair da prospecção e da lista principal.")) return;
    start(async () => {
      await updateStatus(construtoraId, "perdido");
      if (proximaId) {
        router.push(`/prospeccao?tab=${tab}&id=${proximaId}`);
      } else {
        router.push(`/prospeccao?tab=${tab}`);
      }
      router.refresh();
    });
  }

  if (variant === "compact") {
    return (
      <button
        onClick={clicar}
        disabled={pending}
        className="px-3 py-1.5 rounded text-xs border border-rose-300 text-rose-700 hover:bg-rose-50 disabled:opacity-50 font-medium"
      >
        {pending ? "..." : "❌ Sem perfil (perdido)"}
      </button>
    );
  }

  return (
    <button
      onClick={clicar}
      disabled={pending}
      className="px-4 py-2 rounded-md border border-rose-300 text-rose-700 hover:bg-rose-50 disabled:opacity-50 text-sm font-medium"
    >
      {pending ? "..." : "❌ Sem perfil (Perdido)"}
    </button>
  );
}
