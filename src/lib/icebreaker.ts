// Geração de mensagem de abordagem LinkedIn (icebreaker) baseada em gatilho técnico.
// Objetivo: cada mensagem cita um dado real do contrato (objeto, órgão, meses de execução)
// e termina pedindo o WhatsApp pra continuar a conversa.

import type { Gatilho } from "./gatilhos";
import { nomeDistintivo } from "./linkedin-search";

const MAX_CHARS = 300;

export interface IcebreakerInput {
  decisorNome: string;
  construtoraRazao: string;
  contratoObjeto?: string | null;
  contratoOrgao?: string | null;
  contratoMunicipio?: string | null;
  gatilho: Gatilho | null;
}

export interface IcebreakerOutput {
  mensagem: string;
  chars: number;
  template: string;
  whatsappUrl?: (telefone: string) => string;
}

function primeiroNome(nomeCompleto: string): string {
  return nomeCompleto.trim().split(/\s+/)[0] ?? nomeCompleto;
}

function objetoCurto(s: string | null | undefined, max: number): string {
  if (!s) return "";
  const limpo = s.replace(/\s+/g, " ").trim();
  if (limpo.length <= max) return limpo;
  return limpo.slice(0, max - 1).trim() + "…";
}

function nomeEmpresaCurto(razao: string, max = 30): string {
  const distintivo = nomeDistintivo(razao);
  if (distintivo.length <= max) return distintivo;
  return distintivo.slice(0, max - 1) + "…";
}

function orgaoCurto(o: string | null | undefined, max = 35): string {
  if (!o) return "";
  const limpo = o.replace(/\s+/g, " ").trim();
  if (limpo.length <= max) return limpo;
  return limpo.slice(0, max - 1) + "…";
}

export function gerarIcebreaker(input: IcebreakerInput): IcebreakerOutput {
  const nome = primeiroNome(input.decisorNome);
  const empresa = nomeEmpresaCurto(input.construtoraRazao);
  const orgao = orgaoCurto(input.contratoOrgao);
  const municipio = input.contratoMunicipio ?? "";
  const tipoGatilho = input.gatilho?.tipo ?? "GENERICO";
  const meses = input.gatilho?.mesesExecucao ?? 0;

  let mensagem = "";
  let template = tipoGatilho;

  // Calcula quanto de objeto cabe baseado no template
  const tentarConstruir = (objMax: number): string => {
    const objeto = objetoCurto(input.contratoObjeto, objMax);

    if (tipoGatilho === "REEQUILIBRIO") {
      const partes = [`Olá ${nome}, vi que a ${empresa} executa`];
      if (objeto) partes[0] += ` "${objeto}"`;
      if (orgao) partes[0] += ` via ${orgao}`;
      partes[0] += ".";
      partes.push(
        `Sou eng. de produção na EAP — esse contrato já passou por ${meses} meses de inflação.`,
        "Tenho um PDF técnico sobre reequilíbrio dessa margem. Qual seu WhatsApp pra eu te mandar?"
      );
      return partes.join(" ");
    }

    if (tipoGatilho === "IMPLANTACAO") {
      const partes = [`Olá ${nome}, parabéns pela ${empresa} ter assinado`];
      if (objeto) partes[0] += ` "${objeto}"`;
      if (orgao) partes[0] += ` com ${orgao}`;
      partes[0] += ".";
      partes.push(
        "Sou eng. de produção EAP — tenho um checklist dos 6 controles que evitam perda de margem nos primeiros meses.",
        "Qual seu WhatsApp pra eu te mandar?"
      );
      return partes.join(" ");
    }

    if (tipoGatilho === "ENCERRAMENTO") {
      const partes = [`Olá ${nome}, vi que a ${empresa} está finalizando`];
      if (objeto) partes[0] += ` "${objeto}"`;
      if (orgao) partes[0] += ` com ${orgao}`;
      partes[0] += ".";
      partes.push(
        "Sou eng. EAP — tenho material sobre como compor pleito de aditivo de prazo/valor antes do encerramento.",
        "Quer que eu mande no WhatsApp?"
      );
      return partes.join(" ");
    }

    if (tipoGatilho === "ACOMPANHAMENTO") {
      const partes = [`Olá ${nome}, vi a obra da ${empresa}`];
      if (municipio) partes[0] += ` em ${municipio}`;
      if (orgao) partes[0] += ` via ${orgao}`;
      partes[0] += ".";
      partes.push(
        "Sou eng. de produção EAP — temos um diagnóstico rápido de custo real vs orçado pro tipo de obra de vocês.",
        "Posso te mandar pelo WhatsApp?"
      );
      return partes.join(" ");
    }

    // Genérico (sem gatilho calculável — falta vigência, contrato muito antigo, etc.)
    const partesG = [`Olá ${nome}, vi a ${empresa} no PNCP com obras públicas em andamento.`];
    partesG.push(
      "Sou eng. de produção na EAP — ajudamos construtoras a controlar custo de obra e abrir pleitos de reequilíbrio.",
      "Pode me passar seu WhatsApp pra eu mandar um material técnico?"
    );
    return partesG.join(" ");
  };

  // Tenta com objeto de 60 chars; se passar de 300, reduz progressivamente
  for (const tentativa of [60, 50, 40, 30, 20, 0]) {
    const candidata = tentarConstruir(tentativa);
    if (candidata.length <= MAX_CHARS) {
      mensagem = candidata;
      break;
    }
  }

  // Fallback final — se ainda não couber, hard-truncate
  if (!mensagem || mensagem.length > MAX_CHARS) {
    mensagem = (mensagem || tentarConstruir(0)).slice(0, MAX_CHARS - 1) + "…";
  }

  return {
    mensagem,
    chars: mensagem.length,
    template,
    whatsappUrl: (telefone: string) => {
      const limpo = telefone.replace(/\D/g, "");
      // Adiciona 55 (Brasil) se ainda não tem
      const comDDI = limpo.startsWith("55") ? limpo : `55${limpo}`;
      return `https://wa.me/${comDDI}?text=${encodeURIComponent(mensagem)}`;
    },
  };
}
