import { createClient } from "@/lib/supabase/server";
import type { Utilizador } from "@/lib/supabase/types";
import { redirect } from "next/navigation";

// Devolve o registo da tabela `utilizadores` correspondente à sessão Supabase Auth
// atual. auth_user_id é a ligação entre auth.users e utilizadores.
export async function getUtilizadorAtual(): Promise<Utilizador | null> {
  const supabase = createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;

  const { data, error } = await supabase
    .from("utilizadores")
    .select("*")
    .eq("auth_user_id", authData.user.id)
    .eq("ativo", true)
    .single();

  if (error || !data) return null;
  return data as Utilizador;
}

export async function exigirUtilizador(): Promise<Utilizador> {
  const utilizador = await getUtilizadorAtual();
  if (!utilizador) redirect("/login");
  return utilizador;
}

export async function exigirLider(): Promise<Utilizador> {
  const utilizador = await exigirUtilizador();
  if (utilizador.perfil !== "LIDER") redirect("/membro");
  return utilizador;
}
