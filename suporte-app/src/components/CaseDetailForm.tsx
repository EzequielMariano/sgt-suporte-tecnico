"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Caso, Utilizador, HistoricoCaso } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import {
  assumirCaso,
  atribuirCasoDiretamente,
  enviarResposta,
  aprovarValidacao,
  devolverValidacao,
} from "@/lib/actions";
import { OrigemTag, Pill } from "@/components/ui";

const TIPO_LABEL: Record<string, string> = { ALUNO: "Aluno", PROFESSOR: "Professor", OUTRO: "Outro" };

export default function CaseDetailForm({
  caso,
  utilizador,
  membros,
  temEvidencia,
  historico,
}: {
  caso: Caso;
  utilizador: Utilizador;
  membros: Utilizador[];
  temEvidencia: boolean;
  historico: HistoricoCaso[];
}) {
  const router = useRouter();
  const [resposta, setResposta] = useState(caso.resposta ?? "");
  const [motivo, setMotivo] = useState("");
  const [comentarioEvidencia, setComentarioEvidencia] = useState("");
  const [pendente, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarAtribuir, setMostrarAtribuir] = useState(false);

  const ehLider = utilizador.perfil === "LIDER";
  const ehResponsavel = caso.responsavel_id === utilizador.id;
  const podeConcluir = resposta.trim().length > 0 && (!caso.evidencia_obrigatoria || temEvidencia);

  function executar(fn: () => Promise<void>) {
    setErro(null);
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Ocorreu um erro.");
      }
    });
  }

  async function registarEvidencia() {
    const supabase = createClient();
    const { error } = await supabase.from("evidencias").insert({
      caso_id: caso.id,
      tipo: "confirmacao_texto",
      comentario: comentarioEvidencia,
      criado_por: utilizador.id,
    });
    if (error) throw new Error(error.message);
    setComentarioEvidencia("");
  }

  return (
    <div className="p-5 sm:p-8 max-w-2xl mx-auto">
      <button onClick={() => router.back()} className="text-sm text-graySecondary mb-4">
        ← Voltar
      </button>

      <div className="flex items-center gap-2 flex-wrap mb-4">
        <OrigemTag origem={caso.origem} />
        {caso.modo_atribuicao === "DIRETA" && <Pill className="bg-mint text-petrol">Atribuído diretamente</Pill>}
        {caso.codigo && <Pill className="bg-grayLight text-graySecondary">{caso.codigo}</Pill>}
      </div>

      <h1 className="font-display font-bold text-2xl text-graphite">{caso.titulo}</h1>
      {caso.descricao && <p className="mt-2 text-graySecondary text-sm">{caso.descricao}</p>}

      <div className="mt-4 rounded-xl p-3 bg-white border border-grayLight">
        <p className="text-xs text-graySecondary">Solicitante</p>
        <p className="text-graphite font-medium">
          {caso.solicitante_nome} — {caso.solicitante_tipo ? TIPO_LABEL[caso.solicitante_tipo] : "não informado"}
        </p>
        <p className="text-graySecondary text-sm">{caso.solicitante_contacto}</p>
      </div>

      {caso.checklist && caso.checklist.length > 0 && (
        <div className="mt-5">
          <p className="font-medium text-sm text-graphite mb-2">Checklist</p>
          <div className="space-y-2">
            {caso.checklist.map((item, i) => (
              <label key={i} className="flex items-center gap-2 text-sm text-graphite">
                <input type="checkbox" className="accent-emerald" /> {item}
              </label>
            ))}
          </div>
        </div>
      )}

      {caso.evidencia_obrigatoria && !ehLider && (
        <div className="mt-5 rounded-xl p-3 bg-mint">
          <p className="text-petrol text-sm font-medium mb-2">
            {temEvidencia ? "Evidência já registada." : "Este caso exige evidência antes de concluir."}
          </p>
          {!temEvidencia && (
            <div className="flex gap-2">
              <input
                value={comentarioEvidencia}
                onChange={(e) => setComentarioEvidencia(e.target.value)}
                placeholder="Descreve a evidência (ex.: print conferido, ficheiro enviado por email...)"
                className="flex-1 rounded-lg border border-grayLight px-3 py-2 text-sm outline-none"
              />
              <button
                disabled={!comentarioEvidencia.trim() || pendente}
                onClick={() => executar(registarEvidencia)}
                className="rounded-lg bg-petrol text-white px-3 py-2 text-sm font-medium disabled:opacity-50"
              >
                Registar
              </button>
            </div>
          )}
        </div>
      )}

      {caso.estado === "DEVOLVIDO" && (
        <div className="mt-5 rounded-xl p-3 bg-amber/20">
          <p className="text-sm font-semibold text-graphite">
            Este caso foi devolvido pelo líder — o motivo está registado em "validações" e no histórico abaixo.
          </p>
        </div>
      )}

      {/* Atribuição direta pelo líder, quando o caso está na fila */}
      {ehLider && caso.estado === "NA_FILA" && (
        <div className="mt-5">
          <button
            onClick={() => setMostrarAtribuir((v) => !v)}
            className="w-full rounded-xl py-3 border border-dashed border-petrol text-petrol font-medium"
          >
            Atribuir diretamente a um membro
          </button>
          {mostrarAtribuir && (
            <div className="mt-2 flex flex-col gap-2">
              {membros.map((m) => (
                <button
                  key={m.id}
                  disabled={pendente}
                  onClick={() => executar(() => atribuirCasoDiretamente(caso.id, m.id))}
                  className="w-full text-left rounded-xl px-3 py-2 bg-mint text-petrol text-sm"
                >
                  {m.nome}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Campo de resposta — núcleo da execução (membro responsável) */}
      {!ehLider && ehResponsavel && ["EM_ATENDIMENTO", "DEVOLVIDO"].includes(caso.estado) && (
        <div className="mt-5">
          <p className="font-medium text-sm text-graphite">
            Resposta ao solicitante <span className="text-amber">*</span>
          </p>
          <p className="text-xs text-graySecondary mb-1.5">
            Esta mensagem passa novamente pela IA para manter o padrão de tom antes de ser enviada por WhatsApp.
          </p>
          <textarea
            value={resposta}
            onChange={(e) => setResposta(e.target.value)}
            rows={4}
            placeholder="Escreve aqui o que vais responder ao solicitante..."
            className="w-full rounded-xl border border-grayLight p-3 text-sm outline-none focus:border-petrol"
          />
        </div>
      )}

      {/* Resposta já escrita, visível ao líder em validação */}
      {ehLider && caso.estado === "AGUARDANDO_VALIDACAO" && (
        <div className="mt-5">
          <p className="font-medium text-sm text-graphite mb-2">Resposta escrita pelo membro</p>
          <div className="rounded-xl p-3 bg-white border border-grayLight text-sm text-graphite">{caso.resposta}</div>

          <label className="block text-sm font-medium text-graphite mt-4 mb-1">Motivo (só se for devolver)</label>
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="w-full rounded-xl border border-grayLight px-3 py-2 text-sm outline-none"
          />
        </div>
      )}

      {erro && <p className="mt-4 text-sm text-amber-700">{erro}</p>}

      <div className="mt-6 flex flex-col gap-2">
        {!ehLider && caso.estado === "NA_FILA" && (
          <button
            disabled={pendente}
            onClick={() => executar(() => assumirCaso(caso.id))}
            className="w-full rounded-xl py-3 bg-lime text-graphite font-semibold disabled:opacity-60"
          >
            Pegar este caso
          </button>
        )}

        {!ehLider && ehResponsavel && ["EM_ATENDIMENTO", "DEVOLVIDO"].includes(caso.estado) && (
          <button
            disabled={!podeConcluir || pendente}
            onClick={() => executar(() => enviarResposta(caso.id, resposta))}
            className="w-full rounded-xl py-3 font-semibold disabled:opacity-50"
            style={{
              background: podeConcluir ? "#0F4C42" : "#E4EAE8",
              color: podeConcluir ? "#FFFFFF" : "#5B6B67",
            }}
          >
            {caso.validacao_obrigatoria ? "Enviar resposta para validação" : "Confirmar e enviar resposta"}
          </button>
        )}

        {ehLider && caso.estado === "AGUARDANDO_VALIDACAO" && (
          <>
            <button
              disabled={pendente}
              onClick={() => executar(() => aprovarValidacao(caso.id))}
              className="w-full rounded-xl py-3 bg-emerald text-white font-semibold disabled:opacity-60"
            >
              Aprovar e enviar
            </button>
            <button
              disabled={pendente || !motivo.trim()}
              onClick={() => executar(() => devolverValidacao(caso.id, motivo))}
              className="w-full rounded-xl py-3 border border-grayLight text-graphite font-semibold disabled:opacity-50"
            >
              Devolver com motivo
            </button>
          </>
        )}
      </div>

      {historico.length > 0 && (
        <div className="mt-8">
          <p className="font-medium text-sm text-graphite mb-2">Histórico deste caso</p>
          <div className="space-y-1">
            {historico.map((h) => (
              <p key={h.id} className="text-xs text-graySecondary">
                {new Date(h.criado_em).toLocaleString("pt-PT")} — {h.evento}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
