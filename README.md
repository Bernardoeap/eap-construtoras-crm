# EAP · CRM Construtoras

Mini-CRM web para prospecção de **construtoras vencedoras de licitações públicas**
(PNCP / Portal Nacional de Contratações Públicas), com foco em obras de infraestrutura
em SP, SC e grandes contratos federais (rodovias, saneamento, UPA/UBS, hospitais,
edificações). Tudo com **dados reais** — nada inventado.

## O que ele faz

1. **Importa como semente** os CSVs reais que você já tem (`contratos_ba_sp_sc.csv` +
   `decisores_batch1.csv`).
2. **Sincroniza** com a API pública do PNCP sob demanda (botão "Atualizar agora").
3. **Enriquece** cada construtora via BrasilAPI (sócios/QSA, CNAE, capital, e-mail,
   telefone — tudo da Receita Federal, gratuito, sem auth).
4. **Vira pipeline**: status do lead, notas, reuniões, tags, filtros.
5. **Reporta**: funil, reuniões marcadas vs realizadas, leads qualificados vs perdidos,
   distribuições por UF/tipo de obra, top 10 por valor.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind 3
- Prisma + SQLite (dev) / Turso ou Neon Postgres (prod)
- Recharts

## Pré-requisito

**Node.js 20+** instalado (não detectei Node nesta máquina). Baixe em
<https://nodejs.org> (LTS recomendada). Após instalar, abra um **novo** PowerShell
para o `npm` aparecer no PATH.

## Setup local

```powershell
cd C:\Users\berna\iCloudDrive\Documents\EAP\eap-construtoras-crm
npm install
npx prisma migrate dev --name init
npm run seed                # importa os 2 CSVs reais
npm run dev                 # http://localhost:3000
```

Os scripts de seed procuram os CSVs em duas localizações, na ordem:
1. `./data-import/contratos_ba_sp_sc.csv` e `./data-import/decisores_batch1.csv`
2. `C:\Users\berna\iCloudDrive\Documents\EAP\contratos_ba_sp_sc.csv` (path original)

Se você quiser que o repo seja totalmente self-contained, copie os CSVs para
`./data-import/` antes de rodar o seed.

## Páginas

| Rota | O que mostra |
|---|---|
| `/` | Dashboard: cards, funil, top construtoras, próximas reuniões |
| `/construtoras` | Lista com filtros (UF, tipo de obra, status, faixa, busca) |
| `/construtoras/[id]` | Dossiê completo: contratos, decisores, interações, reuniões, enriquecer |
| `/relatorios` | 6 gráficos: funil, reuniões, qualificados/perdidos, distribuições, top 10 |
| `/sync` | Configura UFs/dias/valor → puxa do PNCP em tempo real |

## API routes

- `POST /api/sync/pncp` — body: `{ ufs: ["SP","SC"], diasAtras: 30, valorMin, valorMax, paginasMax }`
- `POST /api/enrich/cnpj/:cnpj` — preenche dados da Receita via BrasilAPI

## Deploy

### Vercel + Turso (libSQL) — gratuito

1. **Crie banco no Turso** (<https://turso.tech>): Database → New → região `gru` (SP).
   Copie a URL (`libsql://...turso.io`) e gere um auth token.
2. **Localmente, popule o banco Turso uma vez**:
   ```powershell
   $env:TURSO_DATABASE_URL = "libsql://<seu-db>.turso.io"
   $env:TURSO_AUTH_TOKEN   = "<seu-token>"
   $env:DATABASE_URL = "file:./dev.db"

   # Cria as tabelas no Turso (script aplica o schema via libsql client)
   npm run db:push:turso

   # Importa CSVs (Prisma usa o adaptador libsql automaticamente)
   npm run seed
   ```
3. **No Vercel** (<https://vercel.com/new>): importe o repo. Em Environment Variables:
   - `TURSO_DATABASE_URL` = a URL libsql
   - `TURSO_AUTH_TOKEN` = o token
   - `DATABASE_URL` = `file:./dev.db` (placeholder, o adaptador toma a frente em runtime)
4. Deploy.

## Como o "só dados reais" é garantido

- Seed vem 100% dos seus CSVs (que vieram da API PNCP oficial).
- Decisores com `country != "brazil"` são **descartados** no import (resolve o noise
  tipo Lam Research / Kendric Todi vindo de matches errôneos do Vibe).
- BrasilAPI valida CNPJ na Receita Federal.
- Construtoras cujo nome não bate com perfil de empresa de obras (ex.: "G4F
  SOLUÇÕES CORPORATIVAS") entram com tag `revisar` para você triar — o app não
  chuta classificação.

## Não está incluído (fase 2)

- Auth multi-usuário
- Disparo direto de e-mail / WhatsApp (apenas botões "copiar")
- Cron de sync automático
- Integração Pipedrive
- Exportar dossiê em PDF
