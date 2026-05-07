async function getAccessToken(clientId: string, clientSecret: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.snov.io/v1/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret }),
    });
    if (!res.ok) return null;
    const json = await res.json() as { access_token?: string };
    return json.access_token ?? null;
  } catch {
    return null;
  }
}

export async function findEmailSnov(opts: {
  nome: string;
  site?: string | null;
  razaoSocial?: string;
  clientId: string;
  clientSecret: string;
}): Promise<{ email: string; score: number } | null> {
  const { nome, site, razaoSocial, clientId, clientSecret } = opts;

  const token = await getAccessToken(clientId, clientSecret);
  if (!token) return null;

  const parts = nome.trim().split(/\s+/);
  const firstName = parts[0] ?? nome;
  const lastName = parts.slice(1).join(" ") || "";

  let domain: string | null = null;
  if (site) {
    try {
      const url = site.startsWith("http") ? site : `https://${site}`;
      domain = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      domain = site.replace(/^https?:\/\/(?:www\.)?/, "").split("/")[0];
    }
  }

  if (!domain && !razaoSocial) return null;

  const params = new URLSearchParams({
    access_token: token,
    first_name: firstName,
    ...(lastName ? { last_name: lastName } : {}),
    ...(domain ? { domain } : { company_name: razaoSocial ?? "" }),
  });

  try {
    const res = await fetch(`https://api.snov.io/v1/get-emails-from-name?${params.toString()}`);
    if (!res.ok) return null;
    const json = await res.json() as { data?: Array<{ email?: string; emailQuality?: number }> };
    const first = json.data?.[0];
    if (!first?.email) return null;
    return { email: first.email, score: Math.round((first.emailQuality ?? 0.5) * 100) };
  } catch {
    return null;
  }
}
