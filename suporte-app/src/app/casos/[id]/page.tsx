import { exigirUtilizador } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import CaseDetailForm from "@/components/CaseDetailForm";
import type { Caso, Utilizador, HistoricoCaso } from "@/lib/supabase/types";

export default async function CasoPage({ params }: { params: { id: string } }) {
  const utilizador = await exigirUtilizador();
  const supabase = createClient();

  const { data: caso } = await supabase.from("casos").select("*").eq("id", params.id).single();
  if (!caso) notFound();

  const { data: membros } = await supabase
    .from("utilizadores")
    .select("*")
    .eq("grupo_id", utilizador.grupo_id)
    .eq("perfil", "MEMBRO")
    .eq("ativo", true);

  const { data: evidencias } = await supabase.from("evidencias").select("*").eq("caso_id", params.id);
  const { data: historico } = await supabase
    .from("historico_casos")
    .select("*")
    .eq("caso_id", params.id)
    .order("criado_em", { ascending: true });

  return (
    <CaseDetailForm
      caso={caso as Caso}
      utilizador={utilizador}
      membros={(membros ?? []) as Utilizador[]}
      temEvidencia={(evidencias ?? []).length > 0}
      historico={(historico ?? []) as HistoricoCaso[]}
    />
  );
}
