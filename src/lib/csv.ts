// Parser CSV simples — suporta separador `;` e `,`, aspas duplas com escape ("").
// Usado pelos scripts de seed para os CSVs já existentes em ../EAP/.

export function parseCSV(text: string, sep = ";"): Record<string, string>[] {
  // remove BOM
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQ = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') inQ = true;
      else if (ch === sep) {
        row.push(cur);
        cur = "";
      } else if (ch === "\r") {
        // ignore
      } else if (ch === "\n") {
        row.push(cur);
        rows.push(row);
        row = [];
        cur = "";
      } else cur += ch;
    }
  }
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }

  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).filter((r) => r.some((c) => c.length)).map((r) => {
    const o: Record<string, string> = {};
    header.forEach((k, idx) => (o[k] = r[idx] ?? ""));
    return o;
  });
}

export function parseValorBR(s: string | undefined | null): number | null {
  if (!s) return null;
  // "R$ 12.345,67" → 12345.67
  const m = s.replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", ".");
  const v = Number(m);
  return Number.isFinite(v) ? v : null;
}

export function parseDateBR(s: string | undefined | null): Date | null {
  if (!s) return null;
  // ISO já?
  const iso = new Date(s);
  if (!Number.isNaN(iso.getTime())) return iso;
  // dd/mm/yyyy
  const m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(s);
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00`);
  return null;
}
