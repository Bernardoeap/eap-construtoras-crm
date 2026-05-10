"use client";

import { useState, useTransition } from "react";
import { criarDecisor } from "@/server-actions/decisores";
import { CARGOS } from "@/lib/linkedin-search";

const CARGOS_SUGESTAO = Array.from(new Set(CARGOS.map((c) => c.cargo)));

export function AdicionarDecisorBtn({ construtoraId }: { construtoraId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [tier, setTier] = useState<"A" | "B" | "C" | "">("");
  const [linkedin, setLinkedin] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  function reset() {
    setNome("");
    setCargo("");
    setTier("");
    setLinkedin("");
    setTelefone("");
    setEmail("");
    setErro(null);
  }

  function salvar() {
    if (!nome.trim()) {
      setErro("Nome obrigatório");
      return;
    }
    setErro(null);
    start(async () => {
      try {
        await criarDecisor(construtoraId, {
          nome,
          cargo,
          tier: tier || undefined,
          linkedin,
          telefone,
          email,
        });
        reset();
        setOpen(false);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Erro ao salvar");
      }
    });
  }

  async function colarLinkedIn() {
    try {
      const txt = await navigator.clipboard.readText();
      if (txt.includes("linkedin.com")) setLinkedin(txt.trim());
    } catch {
      // ignora — clipboard pode não estar acessível
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 font-medium"
      >
        + Adicionar decisor
      </button>
    );
  }

  return (
    <div className="bg-slate-50 border rounded p-3 space-y-2 mt-2">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold">Novo decisor encontrado no LinkedIn</h3>
        <button onClick={() => { reset(); setOpen(false); }} className="text-xs text-slate-500 hover:text-slate-700">
          fechar
        </button>
      </div>

      <Field label="Nome*" value={nome} setValue={setNome} placeholder="Ex: João Silva" />

      <div>
        <label className="text-[10px] uppercase tracking-wider text-slate-500">Cargo</label>
        <input
          value={cargo}
          onChange={(e) => setCargo(e.target.value)}
          placeholder="Ex: Diretor Comercial"
          list="cargos-sugestao"
          className="w-full px-2 py-1 border rounded text-xs"
        />
        <datalist id="cargos-sugestao">
          {CARGOS_SUGESTAO.map((c) => <option key={c} value={c} />)}
        </datalist>
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-wider text-slate-500">Tier</label>
        <div className="flex gap-2 mt-1">
          {(["A", "B", "C"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTier(tier === t ? "" : t)}
              className={`px-2 py-1 text-xs rounded border ${
                tier === t
                  ? t === "A"
                    ? "bg-emerald-100 border-emerald-400 text-emerald-800"
                    : t === "B"
                      ? "bg-blue-100 border-blue-400 text-blue-800"
                      : "bg-slate-200 border-slate-400 text-slate-700"
                  : "bg-white border-slate-200 text-slate-500"
              }`}
            >
              Tier {t} {t === "A" && "— Decisor"}{t === "B" && "— Influenciador"}{t === "C" && "— Gatekeeper"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] uppercase tracking-wider text-slate-500">LinkedIn URL</label>
          <button type="button" onClick={colarLinkedIn} className="text-[10px] text-brand-600 hover:underline">
            colar do clipboard
          </button>
        </div>
        <input
          value={linkedin}
          onChange={(e) => setLinkedin(e.target.value)}
          placeholder="https://linkedin.com/in/..."
          className="w-full px-2 py-1 border rounded text-xs"
        />
      </div>

      <Field label="Telefone" value={telefone} setValue={setTelefone} placeholder="+55 11 9..." />
      <Field label="E-mail" value={email} setValue={setEmail} placeholder="nome@empresa.com" />

      {erro && <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-1">{erro}</div>}

      <div className="flex gap-2 pt-1">
        <button
          onClick={salvar}
          disabled={pending}
          className="px-3 py-1 rounded bg-emerald-600 text-white text-xs disabled:opacity-50 font-medium"
        >
          {pending ? "Salvando…" : "Salvar decisor"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  setValue,
  placeholder,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full px-2 py-1 border rounded text-xs"
      />
    </label>
  );
}
