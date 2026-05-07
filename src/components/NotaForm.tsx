"use client";

import { addInteracao } from "@/server-actions/interacoes";
import { useState, useTransition } from "react";

export function NotaForm({ construtoraId }: { construtoraId: string }) {
  const [tipo, setTipo] = useState("nota");
  const [texto, setTexto] = useState("");
  const [pending, start] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!texto.trim()) return;
        start(async () => {
          await addInteracao(construtoraId, tipo, texto);
          setTexto("");
        });
      }}
      className="space-y-2"
    >
      <div className="flex gap-2">
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="px-3 py-2 border rounded-md text-sm">
          <option value="nota">Nota</option>
          <option value="ligacao">Ligação</option>
          <option value="email">E-mail</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
        <button type="submit" disabled={pending || !texto.trim()} className="px-4 py-2 rounded-md bg-brand-500 text-white text-sm disabled:opacity-50">
          {pending ? "Salvando…" : "Adicionar"}
        </button>
      </div>
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={3}
        placeholder="Escreva uma nota, log de ligação, etc."
        className="w-full px-3 py-2 border rounded-md text-sm"
      />
    </form>
  );
}
