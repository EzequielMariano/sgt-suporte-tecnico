import Link from "next/link";
import { exigirUtilizador } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CaseCard, SectionHeader, Pill } from "@/components/ui";
import type { Caso } from "@/lib/supabase/types";

export default async function MembroPage() {
  const membro = await exigirUtilizador();
  const supabase = createClient();

  const { data: casos } = await supabase.from("casos").select("*").order("criado_em", { ascending: false });
  const lista = (casos ?? []) as Caso[];

  const meus = lista.filter(
    (c) => c.responsavel_id === membro.id && ["EM_ATENDIMENTO", "DEVOLVIDO", "AGUARDANDO_VALIDACAO"].includes(c.estado)
  );
  const fila = lista.filter((c) => c.estado === "NA_FILA");

  return (
    <div className="p-5 sm:p-8 max-w-5xl mx-auto">
      <p className="font-display font-bold text-2xl text-graphite mb-1">Central de Suporte</p>
      <p className="text-graySecondary text-sm mb-8">Olá, {membro.nome}</p>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <SectionHeader title="Meus casos" count={meus.length} />
          <div className="space-y-3">
            {meus.length === 0 && <p className="text-graySecondary text-sm">Sem casos atribuídos no momento.</p>}
            {meus.map((c) => (
              <Link key={c.id} href={`/casos/${c.id}`}>
                <CaseCard
                  caso={c}
                  right={
                    c.estado === "DEVOLVIDO" ? (
                      <Pill className="bg-amber/20 text-amber">Devolvido</Pill>
                    ) : c.estado === "AGUARDANDO_VALIDACAO" ? (
                      <Pill className="bg-mint text-petrol">Em validação</Pill>
                    ) : null
                  }
                />
              </Link>
            ))}
          </div>
        </div>

        <div>
          <SectionHeader title="Fila disponível" count={fila.length} />
          <div className="space-y-3">
            {fila.length === 0 && <p className="text-graySecondary text-sm">A fila está vazia.</p>}
            {fila.map((c) => (
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
