// Geracao de mailto links pre-preenchidos para outreach manual.
// Cada link abre o cliente de e-mail padrao (Gmail web, se configurado) com
// destinatario, assunto e corpo prontos. O usuario revisa e clica enviar.

export interface EmailContext {
  nome: string;
  empresa: string;
  email: string;
  contratoObjeto?: string | null;
  contratoOrgao?: string | null;
  contratoMunicipio?: string | null;
  contratoValor?: number | null;
}

function formatValorMi(v: number): string {
  const mi = v / 1_000_000;
  if (mi >= 1) return `R$ ${mi.toFixed(1).replace(".", ",")} milhões`;
  return `R$ ${(v / 1_000).toFixed(0)}k`;
}

function objetoResumido(s: string, max = 80): string {
  const limpo = s.replace(/\s+/g, " ").trim();
  if (limpo.length <= max) return limpo;
  return limpo.slice(0, max - 1).trim() + "…";
}

export function gerarEmailMailto(c: EmailContext): { url: string; assunto: string; corpo: string } {
  const primeiroNome = c.nome.split(/\s+/)[0];
  const valorTxt = c.contratoValor ? formatValorMi(c.contratoValor) : null;

  const assunto = c.contratoObjeto
    ? `${c.empresa} — sobre a obra contratada`
    : `Contato comercial — ${c.empresa}`;

  const linhas: string[] = [];
  linhas.push(`Olá ${primeiroNome}, tudo bem?`);
  linhas.push("");

  if (c.contratoObjeto) {
    const partes: string[] = [`Vi que a ${c.empresa} foi contratada`];
    if (c.contratoOrgao) partes.push(`pela ${c.contratoOrgao}`);
    if (c.contratoMunicipio) partes.push(`em ${c.contratoMunicipio}`);
    partes.push(`para "${objetoResumido(c.contratoObjeto)}"`);
    if (valorTxt) partes.push(`(${valorTxt})`);
    linhas.push(partes.join(" ") + ".");
    linhas.push("");
  }

  linhas.push(
    `Sou da EAP, e ajudamos construtoras como a ${c.empresa} a [PERSONALIZAR PITCH] — facilitando processos, aumentando margem, e organizando a operação de obra.`
  );
  linhas.push("");
  linhas.push("Faz sentido conversarmos 15 minutos essa semana? Posso adaptar à sua agenda.");
  linhas.push("");
  linhas.push("Abraço,");
  linhas.push("[Seu nome]");
  linhas.push("EAP");

  const corpo = linhas.join("\n");

  const params = `subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
  const url = `mailto:${encodeURIComponent(c.email)}?${params}`;

  return { url, assunto, corpo };
}
