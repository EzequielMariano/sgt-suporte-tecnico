import { exigirLider } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Caso, Utilizador } from "@/lib/supabase/types";

const TIPO_LABEL: Record<string, string> = { ALUNO: "Aluno", PROFESSOR: "Professor", OUTRO: "Outro" };

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: { solicitante?: string; periodo?: string };
}) {
  await exigirLider();
  const supabase = createClient();

  let query = supabase.from("casos").select("*").eq("estado", "CONCLUIDO").order("concluido_em", { ascending: false });

  if (searchParams.solicitante) {
    query = query.ilike("solicitante_nome", `%${searchParams.solicitante}%`);
  }
  if (searchParams.periodo) {
    // formato esperado: AAAA-MM
    query = query.gte("concluido_em", `${searchParams.periodo}-01`).lt("concluido_em", `${searchParams.periodo}-32`);
  }

  const { data: casos } = await query;
  const { data: membros } = await supabase.from("utilizadores").select("*");
  const lista = (casos ?? []) as Caso[];
  const mapaMembros = new Map(((membros ?? []) as Utilizador[]).map((m) => [m.id, m.nome]));

  return (
    <div className="p-5 sm:p-8 max-w-4xl mx-auto">
      <p className="font-display font-bold text-2xl text-graphite mb-1">Histórico de casos</p>
      <p className="text-graySecondary text-sm mb-6">Filtra por solicitante e por período (AAAA-MM)</p>

      <form className="flex flex-wrap gap-3 mb-6" method="get">
        <input
          name="solicitante"
          defaultValue={searchParams.solicitante ?? ""}
          placeholder="Filtrar por solicitante..."
          className="rounded-xl border border-grayLight px-3 py-2 flex-1 min-w-[200px] outline-none"
        />
        <input
          name="periodo"
          defaultValue={searchParams.periodo ?? ""}
          placeholder="AAAA-MM"
          className="rounded-xl border border-grayLight px-3 py-2 outline-none w-32"
        />
        <button className="rounded-xl bg-petrol text-white px-4 py-2 text-sm font-medium">Filtrar</button>
      </form>

      <div className="space-y-3">
        {lista.length === 0 && <p className="text-graySecondary text-sm">Sem resultados para este filtro.</p>}
        {lista.map((c) => (
          <div key={c.id} className="rounded-2xl p-4 bg-white border border-grayLight">
            <p className="font-semibold text-graphite text-[15px]">{c.titulo}</p>
            <p className="text-graySecondary text-sm">
              {c.solicitante_nome} · {c.solicitante_tipo ? TIPO_LABEL[c.solicitante_tipo] : "não informado"} · concluído em{" "}
              {c.concluido_em?.slice(0, 10)} · por {c.responsavel_id ? mapaMembros.get(c.responsavel_id) : "—"}
            </p>
            <div className="mt-3 rounded-xl p-3 bg-mint">
              <p className="text-petrol text-sm">{c.resposta}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
