import { prisma } from "@/lib/db";
import { SyncForm } from "@/components/SyncForm";

export const dynamic = "force-dynamic";

export default async function SyncPage() {
  const logs = await prisma.syncLog.findMany({ orderBy: { iniciadoEm: "desc" }, take: 20 });

  return (
    <div className="space-y-6 max-w-4xl">
      <header>
        <h1 className="text-2xl font-bold">Atualizar do PNCP</h1>
        <p className="text-sm text-slate-500">
          Consulta a API pública do <a href="https://pncp.gov.br" target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">PNCP</a> e
          insere novos contratos cujo objeto contenha palavras-chave de obras públicas (rodovia, saneamento, hospital, UPA, UBS, escola, etc.).
          Construtoras existentes (mesmo CNPJ) não são duplicadas.
        </p>
      </header>

      <section className="bg-white border rounded-lg p-5">
        <SyncForm />
      </section>

      <section className="bg-white border rounded-lg p-5">
        <h2 className="font-semibold mb-3">Últimas sincronizações</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-2 pr-3">Início</th>
                <th className="py-2 pr-3">Fonte</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Novos</th>
                <th className="py-2 pr-3">Já existentes</th>
                <th className="py-2 pr-3">Mensagem</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-t">
                  <td className="py-2 pr-3 whitespace-nowrap">{new Date(l.iniciadoEm).toLocaleString("pt-BR")}</td>
                  <td className="py-2 pr-3">{l.fonte}</td>
                  <td className="py-2 pr-3">{l.status}</td>
                  <td className="py-2 pr-3">{l.registrosNovos}</td>
                  <td className="py-2 pr-3">{l.registrosAtualizados}</td>
                  <td className="py-2 pr-3 text-slate-600">{l.mensagem}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={6} className="py-4 text-center text-slate-500">Nenhuma sincronização ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
