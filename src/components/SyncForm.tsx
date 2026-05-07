"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const UFS_PADRAO = ["SP", "SC"];
const UFS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

export function SyncForm() {
  const [ufs, setUfs] = useState<string[]>(UFS_PADRAO);
  const [diasAtras, setDiasAtras] = useState(30);
  const [valorMin, setValorMin] = useState(2_000_000);
  const [valorMax, setValorMax] = useState(50_000_000);
  const [paginasMax, setPaginasMax] = useState(10);
  const [pending, start] = useTransition();
  const [resultado, setResultado] = useState<string | null>(null);
  const router = useRouter();

  function toggleUf(uf: string) {
    setUfs((cur) => (cur.includes(uf) ? cur.filter((u) => u !== uf) : [...cur, uf]));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setResultado(null);
    start(async () => {
      const r = await fetch("/api/sync/pncp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ufs, diasAtras, valorMin, valorMax, paginasMax }),
      });
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
    <form onSubmit={submit} className="space-y-4">
      <div>
        <div className="text-sm font-medium mb-1">UFs</div>
        <div className="flex flex-wrap gap-1">
          {UFS.map((u) => (
            <button
              type="button"
              key={u}
              onClick={() => toggleUf(u)}
              className={`px-2 py-1 text-xs rounded border ${ufs.includes(u) ? "bg-brand-500 text-white border-brand-500" : "bg-white border-slate-300 text-slate-700"}`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Field label="Período (dias atrás)">
          <input type="number" min={1} max={365} value={diasAtras} onChange={(e) => setDiasAtras(Number(e.target.value))} className="px-3 py-2 border rounded-md text-sm w-full" />
        </Field>
        <Field label="Valor mín (R$)">
          <input type="number" step={100_000} value={valorMin} onChange={(e) => setValorMin(Number(e.target.value))} className="px-3 py-2 border rounded-md text-sm w-full" />
        </Field>
        <Field label="Valor máx (R$)">
          <input type="number" step={100_000} value={valorMax} onChange={(e) => setValorMax(Number(e.target.value))} className="px-3 py-2 border rounded-md text-sm w-full" />
        </Field>
        <Field label="Páginas máx (50/pg)">
          <input type="number" min={1} max={50} value={paginasMax} onChange={(e) => setPaginasMax(Number(e.target.value))} className="px-3 py-2 border rounded-md text-sm w-full" />
        </Field>
      </div>

      <button type="submit" disabled={pending || ufs.length === 0} className="px-5 py-2 rounded-md bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-50">
        {pending ? "Sincronizando…" : "↻ Atualizar agora"}
      </button>
      {resultado && <div className="text-sm text-slate-700">{resultado}</div>}
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-slate-500">{label}</span>
      {children}
    </label>
  );
}
