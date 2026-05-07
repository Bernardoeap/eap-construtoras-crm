"use client";

import { useState, useTransition } from "react";
import { updateDecisorLinkedIn, updateDecisorContato, deleteDecisor } from "@/server-actions/decisores";
import { gerarEmailMailto } from "@/lib/email-template";

export interface DecisorView {
  id: string;
  nome: string;
  cargo?: string | null;
  email?: string | null;
  telefone?: string | null;
  linkedin?: string | null;
  senioridade?: string | null;
  fonte?: string | null;
}

export interface EmpresaCtx {
  razaoSocial: string;
  site?: string | null;
  contratoPrincipal?: {
    objeto?: string | null;
    orgaoContratante?: string | null;
    municipio?: string | null;
    valorGlobal?: number | null;
  } | null;
}

export function DecisorCard({ decisor, empresa }: { decisor: DecisorView; empresa?: EmpresaCtx }) {
  const [linkedin, setLinkedin] = useState(decisor.linkedin ?? "");
  const [email, setEmail] = useState(decisor.email ?? "");
  const [telefone, setTelefone] = useState(decisor.telefone ?? "");
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [hunting, setHunting] = useState(false);
  const [huntMsg, setHuntMsg] = useState<string | null>(null);

  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(`"${decisor.nome}" linkedin`)}`;
  const linkedinSearchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(decisor.nome)}`;

  const linkedinUrl =
    linkedin && linkedin.length > 0
      ? linkedin.startsWith("http")
        ? linkedin
        : `https://${linkedin}`
      : null;

  async function huntEmail() {
    setHunting(true);
    setHuntMsg(null);
    try {
      const res = await fetch(`/api/decisores/${decisor.id}/find-email`, { method: "POST" });
      const json = await res.json();
      if (json.found) {
        setEmail(json.email);
        setHuntMsg(`✓ ${json.email} (score ${json.score})`);
      } else {
        setHuntMsg("Não encontrado");
      }
    } catch {
      setHuntMsg("Erro ao buscar");
    } finally {
      setHunting(false);
    }
  }

  function save() {
    start(async () => {
      await Promise.all([
        linkedin !== (decisor.linkedin ?? "") ? updateDecisorLinkedIn(decisor.id, linkedin) : null,
        email !== (decisor.email ?? "") ? updateDecisorContato(decisor.id, "email", email) : null,
        telefone !== (decisor.telefone ?? "") ? updateDecisorContato(decisor.id, "telefone", telefone) : null,
      ]);
      setEditing(false);
    });
  }

  return (
    <li className="py-3">
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-medium">{decisor.nome}</div>
          <div className="text-xs text-slate-500">
            {decisor.cargo ?? "—"}
            {decisor.fonte && (
              <span className="ml-2 text-[10px] uppercase tracking-wider text-slate-400">
                · {decisor.fonte === "receita-federal" ? "Receita" : decisor.fonte}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setEditing((e) => !e)}
          className="text-xs text-brand-600 hover:underline"
        >
          {editing ? "fechar" : "editar"}
        </button>
      </div>

      <div className="text-xs mt-2 flex flex-wrap gap-2">
        {decisor.email && (
          <>
            <a href={`mailto:${decisor.email}`} className="text-brand-600 hover:underline">
              ✉ {decisor.email}
            </a>
            {empresa && (
              <a
                href={
                  gerarEmailMailto({
                    nome: decisor.nome,
                    empresa: empresa.razaoSocial,
                    email: decisor.email,
                    contratoObjeto: empresa.contratoPrincipal?.objeto ?? null,
                    contratoOrgao: empresa.contratoPrincipal?.orgaoContratante ?? null,
                    contratoMunicipio: empresa.contratoPrincipal?.municipio ?? null,
                    contratoValor: empresa.contratoPrincipal?.valorGlobal ?? null,
                  }).url
                }
                className="text-emerald-700 font-medium hover:underline"
                title="Abre Gmail/cliente de e-mail com modelo já preenchido"
              >
                📧 Compor e-mail
              </a>
            )}
          </>
        )}
        {decisor.telefone && (
          <a href={`tel:${decisor.telefone}`} className="text-brand-600 hover:underline">
            ☎ {decisor.telefone}
          </a>
        )}
        {linkedinUrl ? (
          <a href={linkedinUrl} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">
            in/ LinkedIn ↗
          </a>
        ) : (
          <>
            <a
              href={googleUrl}
              target="_blank"
              rel="noreferrer"
              className="text-slate-600 hover:text-brand-600 hover:underline"
              title="Busca no Google"
            >
              🔍 Google
            </a>
            <a
              href={linkedinSearchUrl}
              target="_blank"
              rel="noreferrer"
              className="text-slate-600 hover:text-brand-600 hover:underline"
              title="Busca direto no LinkedIn (precisa estar logado)"
            >
              in/ LinkedIn search
            </a>
          </>
        )}
      </div>

      {editing && (
        <div className="mt-2 space-y-2 bg-slate-50 border rounded p-2">
          <Field label="LinkedIn URL" value={linkedin} setValue={setLinkedin} placeholder="https://linkedin.com/in/..." />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">E-mail</span>
              <button
                type="button"
                onClick={huntEmail}
                disabled={hunting}
                className="text-[10px] px-2 py-0.5 rounded bg-amber-50 border border-amber-300 text-amber-700 hover:bg-amber-100 disabled:opacity-50"
              >
                {hunting ? "Buscando…" : "🔍 Buscar via Hunter.io"}
              </button>
              {huntMsg && (
                <span className={`text-[10px] ${huntMsg.startsWith("✓") ? "text-emerald-700" : "text-slate-500"}`}>
                  {huntMsg}
                </span>
              )}
            </div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@empresa.com.br"
              className="w-full px-2 py-1 border rounded text-xs"
            />
          </div>
          <Field label="Telefone" value={telefone} setValue={setTelefone} placeholder="+55 11 9..." />
          <div className="flex gap-2 pt-1">
            <button
              onClick={save}
              disabled={pending}
              className="px-3 py-1 rounded bg-brand-500 text-white text-xs disabled:opacity-50"
            >
              {pending ? "Salvando…" : "Salvar"}
            </button>
            <button
              onClick={() => start(() => deleteDecisor(decisor.id))}
              disabled={pending}
              className="px-3 py-1 rounded border border-rose-300 text-rose-700 text-xs disabled:opacity-50 ml-auto"
            >
              Remover
            </button>
          </div>
        </div>
      )}
    </li>
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
