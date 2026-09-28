// Tipos que espelham a estrutura REAL do Supabase (schema enviado pelo utilizador).
// Não inventar colunas fora desta lista — se faltar algo, avisar em vez de adivinhar.

export type Perfil = "LIDER" | "MEMBRO";
export type SolicitanteTipo = "ALUNO" | "PROFESSOR" | "OUTRO";
export type Origem = "IA" | "MANUAL";
export type ModoAtribuicao = "FILA" | "DIRETA";
export type EstadoCaso =
  | "NA_FILA"
  | "EM_ATENDIMENTO"
  | "CONCLUIDO"
  | "AGUARDANDO_VALIDACAO"
  | "DEVOLVIDO"
  | "ATRASADO";

// Valores exatos de prioridade não vieram especificados no schema (só o padrão
// NORMAL) — assumido este conjunto; ajustar aqui se a base de dados usar outros.
export type Prioridade = "BAIXA" | "NORMAL" | "ALTA" | "URGENTE";

export type EventoHistorico =
  | "CRIADO"
  | "ATRIBUIDO"
  | "ASSUMIDO"
  | "RESPOSTA_ESCRITA"
  | "ENVIADO_VALIDACAO"
  | "APROVADO"
  | "DEVOLVIDO"
  | "CONCLUIDO";

export interface Grupo {
  id: string;
  nome: string;
  codigo_convite: string;
  created_at: string;
}

export interface Utilizador {
  id: string;
  auth_user_id: string | null;
  grupo_id: string;
  nome: string;
  email: string;
  password_hash: string | null; // legado — autenticação real é via Supabase Auth
  perfil: Perfil;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Caso {
  id: string;
  codigo: string | null;
  titulo: string;
  descricao: string | null;
  contexto: string | null;
  solicitante_nome: string;
  solicitante_tipo: SolicitanteTipo | null;
  solicitante_contacto: string;
  solicitante_identificador: string | null;
  origem: Origem;
  responsavel_id: string | null;
  modo_atribuicao: ModoAtribuicao;
  criador_id: string | null;
  prioridade: Prioridade;
  prazo: string | null;
  estado: EstadoCaso;
  checklist: string[] | null;
  evidencia_obrigatoria: boolean;
  tipo_evidencia: string | null;
  validacao_obrigatoria: boolean;
  resposta: string | null;
  conversation_id: string | null;
  whatsapp_id: string | null;
  mensagem_original: string | null;
  metadata: Record<string, unknown> | null;
  criado_em: string;
  atualizado_em: string;
  concluido_em: string | null;
  resposta_enviada_em: string | null;
}

export interface Evidencia {
  id: string;
  caso_id: string;
  tipo: string;
  ficheiro_ref: string | null;
  comentario: string | null;
  criado_por: string;
  criado_em: string;
}

export interface Validacao {
  id: string;
  caso_id: string;
  lider_id: string;
  estado: "PENDENTE" | "APROVADO" | "DEVOLVIDO";
  comentario: string | null;
  criado_em: string;
}

export interface HistoricoCaso {
  id: string;
  caso_id: string;
  evento: EventoHistorico;
  utilizador_id: string | null;
  dados: Record<string, unknown> | null;
  criado_em: string;
}

export interface Database {
  public: {
    Tables: {
      grupos: { Row: Grupo; Insert: Partial<Grupo>; Update: Partial<Grupo> };
      utilizadores: { Row: Utilizador; Insert: Partial<Utilizador>; Update: Partial<Utilizador> };
      casos: { Row: Caso; Insert: Partial<Caso>; Update: Partial<Caso> };
      evidencias: { Row: Evidencia; Insert: Partial<Evidencia>; Update: Partial<Evidencia> };
      validacoes: { Row: Validacao; Insert: Partial<Validacao>; Update: Partial<Validacao> };
      historico_casos: { Row: HistoricoCaso; Insert: Partial<HistoricoCaso>; Update: Partial<HistoricoCaso> };
    };
  };
}
