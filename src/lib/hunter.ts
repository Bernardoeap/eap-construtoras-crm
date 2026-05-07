export interface HunterResult {
  email: string;
  score: number;
  firstName?: string;
  lastName?: string;
}

function extractDomain(site: string): string {
  try {
    const url = site.startsWith("http") ? site : `https://${site}`;
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return site.replace(/^https?:\/\/(?:www\.)?/, "").split("/")[0];
  }
}

function splitName(nome: string): { firstName: string; lastName: string } {
  const parts = nome.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? nome,
    lastName: parts.slice(1).join(" ") || "",
  };
}

export async function findEmail(opts: {
  nome: string;
  site?: string | null;
  razaoSocial?: string;
  apiKey: string;
}): Promise<HunterResult | null> {
  const { nome, site, razaoSocial, apiKey } = opts;
  const { firstName, lastName } = splitName(nome);

  const params = new URLSearchParams({ api_key: apiKey, first_name: firstName });
  if (lastName) params.set("last_name", lastName);

  if (site) {
    params.set("domain", extractDomain(site));
  } else if (razaoSocial) {
    params.set("company", razaoSocial);
  } else {
    return null;
  }

  const res = await fetch(
    `https://api.hunter.io/v2/email-finder?${params.toString()}`,
    { headers: { Accept: "application/json" } }
  );

  if (!res.ok) return null;

  const json = (await res.json()) as {
    data?: { email?: string; score?: number; first_name?: string; last_name?: string };
    errors?: Array<{ details?: string }>;
  };

  const email = json.data?.email;
  const score = json.data?.score ?? 0;

  if (!email || score < 50) return null;

  return { email, score, firstName: json.data?.first_name, lastName: json.data?.last_name };
}
