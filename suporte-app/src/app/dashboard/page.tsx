import Link from "next/link";
import { exigirLider } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CaseCard, SectionHeader, BigStat } from "@/components/ui";
import type { Caso, Utilizador } from "@/lib/supabase/types";

export default async function DashboardPage() {
  const lider = await exigirLider();
  const supabase = createClient();

  const { data: membros } = await supabase
    .from("utilizadores")
    .select("*")
    .eq("grupo_id", lider.grupo_id)
    .eq("perfil", "MEMBRO")
    .eq("ativo", true);

  const { data: casos } = await supabase
    .from("casos")
    .select("*")
    .order("criado_em", { ascending: false });

  const lista = (casos ?? []) as Caso[];
  const listaMembros = (membros ?? []) as Utilizador[];

  const fila = lista.filter((c) => c.estado === "NA_FILA");
  const aguardando = lista.filter((c) => c.estado === "AGUARDANDO_VALIDACAO");
  const devolvidos = lista.filter((c) => c.estado === "DEVOLVIDO");
  const atrasados = lista.filter(
    (c) =>
      c.prazo &&
      new Date(c.prazo) < new Date() &&
      !["CONCLUIDO"].includes(c.estado)
  );

  const cargaPorMembro = listaMembros.map((m) => ({
    membro: m,
    total: lista.filter(
      (c) =>
        c.responsavel_id === m.id &&
        ["EM_ATENDIMENTO", "DEVOLVIDO", "AGUARDANDO_VALIDACAO"].includes(c.estado)
    ).length,
  }));

  return (
    <div className="p-5 sm:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <p className="font-display font-bold text-2xl text-graphite">Central de Suporte</p>
          <p className="text-graySecondary text-sm">Painel do líder</p>
        </div>
        <Link href="/dashboard/historico" className="text-sm font-medium text-petrol underline">
          Ver histórico
        </Link>
      </div>

      <SectionHeader title="Carga da equipa" count={cargaPorMembro.length} />
      <div className="flex gap-4 flex-wrap mb-8">
        {cargaPorMembro.map(({ membro, total }) => (
          <BigStat key={membro.id} label={membro.nome} value={total} />
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <SectionHeader title="Na fila" count={fila.length} />
          <div className="space-y-3">
            {fila.map((c) => (
              <Link key={c.id} href={`/casos/${c.id}`}>
                <CaseCard caso={c} />
              </Link>
            ))}
          </div>

          <div className="mt-8">
            <SectionHeader title="Atrasados" count={atrasados.length} />
            <div className="space-y-3">
              {atrasados.map((c) => (
                <Link key={c.id} href={`/casos/${c.id}`}>
                  <CaseCard caso={c} />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div>
          <SectionHeader title="Aguardando validação" count={aguardando.length} />
          <div className="space-y-3 mb-8">
            {aguardando.map((c) => (
              <Link key={c.id} href={`/casos/${c.id}`}>
                <CaseCard caso={c} />
              </Link>
            ))}
          </div>

          <SectionHeader title="Devolvidos" count={devolvidos.length} />
          <div className="space-y-3">
            {devolvidos.map((c) => (
              <Link key={c.id} href={`/casos/${c.id}`}>
                <CaseCard caso={c} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
