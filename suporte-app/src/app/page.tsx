import { redirect } from "next/navigation";
import { getUtilizadorAtual } from "@/lib/auth";

export default async function Home() {
  const utilizador = await getUtilizadorAtual();
  if (!utilizador) redirect("/login");
  redirect(utilizador.perfil === "LIDER" ? "/dashboard" : "/membro");
}
