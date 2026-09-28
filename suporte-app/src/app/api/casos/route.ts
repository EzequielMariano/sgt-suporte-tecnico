import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Endpoint de ENTRADA para a IA/n8n. Autenticado por chave fixa no header
// "x-api-key" (variável de ambiente CASOS_API_KEY) — nunca por sessão de utilizador,
// porque quem chama é o workflow n8n, não uma pessoa autenticada.
//
// Corpo esperado (campos ausentes ficam null — nunca inventados):
// {
//   "titulo": "string",
//   "descricao": "string",
//   "solicitante": { "nome", "tipo": "ALUNO|PROFESSOR|OUTRO", "contacto", "identificador"? },
//   "prioridade"?: "BAIXA|NORMAL|ALTA|URGENTE",
//   "conversation_id"?, "whatsapp_id"?, "mensagem_original"?
// }
export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.CASOS_API_KEY) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.titulo || !body.solicitante?.nome || !body.solicitante?.contacto) {
    return NextResponse.json(
      { erro: "Campos obrigatórios em falta: titulo, solicitante.nome, solicitante.contacto." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("casos")
    .insert({
      titulo: body.titulo,
      descricao: body.descricao ?? null,
      solicitante_nome: body.solicitante.nome,
      solicitante_tipo: body.solicitante.tipo ?? null,
      solicitante_contacto: body.solicitante.contacto,
      solicitante_identificador: body.solicitante.identificador ?? null,
      origem: "IA",
      modo_atribuicao: "FILA",
      estado: "NA_FILA",
      prioridade: body.prioridade ?? "NORMAL",
      conversation_id: body.conversation_id ?? null,
      whatsapp_id: body.whatsapp_id ?? null,
      mensagem_original: body.mensagem_original ?? null,
    })
    .select("id, codigo")
    .single();

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  await supabase.from("historico_casos").insert({
    caso_id: data.id,
    evento: "CRIADO",
    utilizador_id: null,
    dados: { origem: "IA" },
  });

  return NextResponse.json({ id: data.id, codigo: data.codigo }, { status: 201 });
}
