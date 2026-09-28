"use server";

import { createClient } from "@/lib/supabase/server";
import { exigirUtilizador, exigirLider } from "@/lib/auth";
import { notificarCasoConcluido } from "@/lib/n8n";
import { revalidatePath } from "next/cache";
import type { EventoHistorico } from "@/lib/supabase/types";

async function registarHistorico(
  casoId: string,
  evento: EventoHistorico,
  utilizadorId: string | null,
  dados: Record<string, unknown> = {}
) {
  const supabase = createClient();
  await supabase.from("historico_casos").insert({
    caso_id: casoId,
    evento,
    utilizador_id: utilizadorId,
    dados,
  });
}

// Membro assume um caso que está na fila (sem dono).
export async function assumirCaso(casoId: string) {
  const utilizador = await exigirUtilizador();
  const supabase = createClient();

  const { error } = await supabase
    .from("casos")
    .update({ estado: "EM_ATENDIMENTO", responsavel_id: utilizador.id })
    .eq("id", casoId)
    .eq("estado", "NA_FILA"); // evita corrida: só assume se ainda estiver na fila

  if (error) throw new Error(error.message);

  await registarHistorico(casoId, "ASSUMIDO", utilizador.id);
  revalidatePath("/membro");
  revalidatePath("/dashboard");
}

// Líder atribui um caso diretamente a um membro específico.
export async function atribuirCasoDiretamente(casoId: string, membroId: string) {
  const lider = await exigirLider();
  const supabase = createClient();

  const { error } = await supabase
    .from("casos")
    .update({
      estado: "EM_ATENDIMENTO",
      responsavel_id: membroId,
      modo_atribuicao: "DIRETA",
    })
    .eq("id", casoId);

  if (error) throw new Error(error.message);

  await registarHistorico(casoId, "ATRIBUIDO", lider.id, { membro_id: membroId });
  revalidatePath("/dashboard");
  revalidatePath("/membro");
}

// Membro cria/edita a resposta e conclui (ou envia para validação).
// Regras (herdadas da spec): resposta obrigatória; se validacao_obrigatoria = true,
// vai para AGUARDANDO_VALIDACAO em vez de CONCLUIDO.
export async function enviarResposta(casoId: string, resposta: string) {
  if (!resposta.trim()) {
    throw new Error("A resposta ao solicitante não pode estar vazia.");
  }

  const utilizador = await exigirUtilizador();
  const supabase = createClient();

  const { data: caso, error: erroLeitura } = await supabase
    .from("casos")
    .select("*")
    .eq("id", casoId)
    .single();
  if (erroLeitura || !caso) throw new Error("Caso não encontrado.");

  if (caso.evidencia_obrigatoria) {
    const { count } = await supabase
      .from("evidencias")
      .select("id", { count: "exact", head: true })
      .eq("caso_id", casoId);
    if (!count) {
      throw new Error("Este caso exige evidência antes de poder ser concluído.");
    }
  }

  const novoEstado = caso.validacao_obrigatoria ? "AGUARDANDO_VALIDACAO" : "CONCLUIDO";
  const agora = new Date().toISOString();

  const { error } = await supabase
    .from("casos")
    .update({
      resposta,
      estado: novoEstado,
      atualizado_em: agora,
      ...(novoEstado === "CONCLUIDO" ? { concluido_em: agora } : {}),
    })
    .eq("id", casoId);

  if (error) throw new Error(error.message);

  await registarHistorico(casoId, "RESPOSTA_ESCRITA", utilizador.id, { resposta });

  if (novoEstado === "AGUARDANDO_VALIDACAO") {
    await registarHistorico(casoId, "ENVIADO_VALIDACAO", utilizador.id);
  } else {
    await registarHistorico(casoId, "CONCLUIDO", utilizador.id);
    const entrega = await notificarCasoConcluido({
      caso_id: caso.id,
      resposta,
      solicitante_nome: caso.solicitante_nome,
      solicitante_contacto: caso.solicitante_contacto,
    });
    if (entrega.entregue) {
      await supabase
        .from("casos")
        .update({ resposta_enviada_em: new Date().toISOString() })
        .eq("id", casoId);
    }
  }

  revalidatePath("/membro");
  revalidatePath("/dashboard");
}

// Líder aprova a resposta — segue para conclusão e notifica o n8n.
export async function aprovarValidacao(casoId: string) {
  const lider = await exigirLider();
  const supabase = createClient();

  const { data: caso, error: erroLeitura } = await supabase
    .from("casos")
    .select("*")
    .eq("id", casoId)
    .single();
  if (erroLeitura || !caso) throw new Error("Caso não encontrado.");

  const agora = new Date().toISOString();
  const { error } = await supabase
    .from("casos")
    .update({ estado: "CONCLUIDO", concluido_em: agora, atualizado_em: agora })
    .eq("id", casoId);
  if (error) throw new Error(error.message);

  await supabase.from("validacoes").insert({
    caso_id: casoId,
    lider_id: lider.id,
    estado: "APROVADO",
  });
  await registarHistorico(casoId, "APROVADO", lider.id);
  await registarHistorico(casoId, "CONCLUIDO", lider.id);

  const entrega = await notificarCasoConcluido({
    caso_id: caso.id,
    resposta: caso.resposta ?? "",
    solicitante_nome: caso.solicitante_nome,
    solicitante_contacto: caso.solicitante_contacto,
  });
  if (entrega.entregue) {
    await supabase
      .from("casos")
      .update({ resposta_enviada_em: new Date().toISOString() })
      .eq("id", casoId);
  }

  revalidatePath("/dashboard");
}

// Líder devolve com motivo obrigatório — o caso volta para o membro reescrever.
export async function devolverValidacao(casoId: string, motivo: string) {
  if (!motivo.trim()) {
    throw new Error("É obrigatório indicar o motivo da devolução.");
  }
  const lider = await exigirLider();
  const supabase = createClient();

  const { error } = await supabase
    .from("casos")
    .update({ estado: "DEVOLVIDO", atualizado_em: new Date().toISOString() })
    .eq("id", casoId);
  if (error) throw new Error(error.message);

  await supabase.from("validacoes").insert({
    caso_id: casoId,
    lider_id: lider.id,
    estado: "DEVOLVIDO",
    comentario: motivo,
  });
  await registarHistorico(casoId, "DEVOLVIDO", lider.id, { motivo });

  revalidatePath("/dashboard");
  revalidatePath("/membro");
}

// Líder cria um caso manualmente — pode deixar na fila ou atribuir logo a alguém.
export async function criarCasoManual(input: {
  titulo: string;
  descricao?: string;
  solicitante_nome: string;
  solicitante_tipo: "ALUNO" | "PROFESSOR" | "OUTRO";
  solicitante_contacto: string;
  solicitante_identificador?: string;
  prioridade?: "BAIXA" | "NORMAL" | "ALTA" | "URGENTE";
  responsavel_id?: string; // se vier preenchido -> atribuição direta
  checklist?: string[];
  evidencia_obrigatoria?: boolean;
  validacao_obrigatoria?: boolean;
}) {
  const lider = await exigirLider();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("casos")
    .insert({
      titulo: input.titulo,
      descricao: input.descricao ?? null,
      solicitante_nome: input.solicitante_nome,
      solicitante_tipo: input.solicitante_tipo,
      solicitante_contacto: input.solicitante_contacto,
      solicitante_identificador: input.solicitante_identificador ?? null,
      origem: "MANUAL",
      criador_id: lider.id,
      responsavel_id: input.responsavel_id ?? null,
      modo_atribuicao: input.responsavel_id ? "DIRETA" : "FILA",
      prioridade: input.prioridade ?? "NORMAL",
      estado: input.responsavel_id ? "EM_ATENDIMENTO" : "NA_FILA",
      checklist: input.checklist ?? null,
      evidencia_obrigatoria: input.evidencia_obrigatoria ?? false,
      validacao_obrigatoria: input.validacao_obrigatoria ?? false,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await registarHistorico(data.id, "CRIADO", lider.id, { origem: "MANUAL" });
  if (input.responsavel_id) {
    await registarHistorico(data.id, "ATRIBUIDO", lider.id, { membro_id: input.responsavel_id });
  }

  revalidatePath("/dashboard");
  return data.id;
}
