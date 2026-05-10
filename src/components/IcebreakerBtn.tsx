"use client";

import { useState } from "react";
import { gerarIcebreaker, type IcebreakerInput } from "@/lib/icebreaker";

export interface IcebreakerCtx {
  decisorNome: string;
  decisorTelefone?: string | null;
  decisorLinkedin?: string | null;
  construtoraRazao: string;
  contratoObjeto?: string | null;
  contratoOrgao?: string | null;
  contratoMunicipio?: string | null;
  contratoVigenciaInicio?: Date | string | null;
  contratoVigenciaFim?: Date | string | null;
}

import { calcularGatilho } from "@/lib/gatilhos";

export function IcebreakerBtn(ctx: IcebreakerCtx) {
  const [aberto, setAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const inicio = ctx.contratoVigenciaInicio
    ? typeof ctx.contratoVigenciaInicio === "string"
      ? new Date(ctx.contratoVigenciaInicio)
      : ctx.contratoVigenciaInicio
    : null;
  const fim = ctx.contratoVigenciaFim
    ? typeof ctx.contratoVigenciaFim === "string"
      ? new Date(ctx.contratoVigenciaFim)
      : ctx.contratoVigenciaFim
    : null;

  const gatilho = calcularGatilho({ vigenciaInicio: inicio, vigenciaFim: fim });

  const input: IcebreakerInput = {
    decisorNome: ctx.decisorNome,
    construtoraRazao: ctx.construtoraRazao,
    contratoObjeto: ctx.contratoObjeto,
    contratoOrgao: ctx.contratoOrgao,
    contratoMunicipio: ctx.contratoMunicipio,
    gatilho,
  };

  const { mensagem, chars, template } = gerarIcebreaker(input);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensagem);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // ignora — pode não ter permissão
    }
  }

  function abrirWhatsapp() {
    if (!ctx.decisorTelefone) return;
    const limpo = ctx.decisorTelefone.replace(/\D/g, "");
    const comDDI = limpo.startsWith("55") ? limpo : `55${limpo}`;
    window.open(`https://wa.me/${comDDI}?text=${encodeURIComponent(mensagem)}`, "_blank");
  }

  function abrirLinkedin() {
    if (!ctx.decisorLinkedin) return;
    const url = ctx.decisorLinkedin.startsWith("http") ? ctx.decisorLinkedin : `https://${ctx.decisorLinkedin}`;
    window.open(url, "_blank");
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="text-xs px-2 py-1 rounded bg-violet-100 text-violet-800 border border-violet-300 hover:bg-violet-200 font-medium"
        title={`Gera mensagem ≤300 chars com gatilho ${template}`}
      >
        💬 Gerar mensagem LinkedIn
      </button>
    );
  }

  const corBadge = chars > 300 ? "text-rose-700 bg-rose-100" : chars > 250 ? "text-amber-700 bg-amber-100" : "text-emerald-700 bg-emerald-100";

  return (
    <div className="mt-2 bg-violet-50 border border-violet-200 rounded p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider font-bold text-violet-800">
            Mensagem · template {template}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${corBadge}`}>
            {chars}/300
          </span>
        </div>
        <button
          onClick={() => setAberto(false)}
          className="text-xs text-slate-500 hover:text-slate-700"
        >
          fechar
        </button>
      </div>

      <textarea
        value={mensagem}
        readOnly
        rows={5}
        className="w-full text-xs p-2 border border-violet-200 rounded bg-white font-mono"
      />

      <div className="flex flex-wrap gap-2">
        <button
          onClick={copiar}
          className="text-xs px-3 py-1.5 rounded bg-violet-600 text-white hover:bg-violet-700 font-medium"
        >
          {copiado ? "✓ Copiado!" : "📋 Copiar texto"}
        </button>

        {ctx.decisorTelefone && (
          <button
            onClick={abrirWhatsapp}
            className="text-xs px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 font-medium"
          >
            💚 WhatsApp ({ctx.decisorTelefone})
          </button>
        )}

        {ctx.decisorLinkedin && (
          <button
            onClick={abrirLinkedin}
            className="text-xs px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 font-medium"
          >
            🔗 Abrir LinkedIn
          </button>
        )}
      </div>

      {!ctx.contratoObjeto && (
        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
          ⚠ Sem contrato com vigência preenchida — mensagem usa template genérico.
          Rode <strong>Buscar valores e vigências no PNCP</strong> em /sync pra ter dado real.
        </p>
      )}
    </div>
  );
}
