// Ponto de saída: quando um caso é concluído, este sistema entrega a resposta
// pronta ao n8n para a IA reformatar o tom e enviar pelo WhatsApp.
// Não implementa envio direto ao WhatsApp — isso é responsabilidade do n8n/IA.
export async function notificarCasoConcluido(payload: {
  caso_id: string;
  resposta: string;
  solicitante_nome: string;
  solicitante_contacto: string;
}) {
  const url = process.env.N8N_CASO_CONCLUIDO_WEBHOOK_URL;
  if (!url) {
    console.warn(
      "N8N_CASO_CONCLUIDO_WEBHOOK_URL não configurado — resposta não foi entregue ao n8n."
    );
    return { entregue: false as const };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { entregue: res.ok as boolean };
  } catch (err) {
    console.error("Falha ao chamar o webhook do n8n:", err);
    return { entregue: false as const };
  }
}
