# Central de Suporte — backend ligado ao Supabase real

Nome do produto ainda não definido (por indicação explícita) — "Central de
Suporte" é só um rótulo de trabalho, fácil de substituir em `src/app/layout.tsx`
e nos textos das páginas.

## O que mudou nesta etapa

Esta etapa liga a interface (antes um protótipo com dados fictícios num único
ficheiro) a um backend real em Next.js, falando diretamente com as tabelas
reais do Supabase (`grupos`, `utilizadores`, `casos`, `evidencias`,
`validacoes`, `historico_casos`), com os mesmos nomes de campos que enviaste.
Não foram criadas tabelas novas nem usado SQLite/mock — os dados de exemplo do
protótipo anterior foram todos removidos.

As tabelas antigas `tarefas` e `tarefas_suporte` não são tocadas em lado
nenhum do código.

## Limitação importante deste ambiente

Este projeto foi escrito num sandbox sem acesso de rede ao domínio do
Supabase — por isso **não consegui testar a ligação em direto** com o vosso
projeto real (`zyxgultkdkfhruddhbgx`). O código está escrito de forma
consistente com o schema que enviaste, mas o primeiro teste real (`npm run
dev` com as chaves verdadeiras) tem de ser feito do vosso lado.

## Antes de correr

1. `cp .env.example .env.local` e preencher:
   - `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Settings → API no Supabase)
   - `SUPABASE_SERVICE_ROLE_KEY` — só usada em `src/lib/supabase/server.ts` (`createAdminClient`) e no endpoint `/api/casos`; nunca é exposta ao browser
   - `CASOS_API_KEY` — chave arbitrária que tu escolhes; o n8n deve enviá-la no header `x-api-key` ao chamar `POST /api/casos`
   - `N8N_CASO_CONCLUIDO_WEBHOOK_URL` — URL do workflow n8n que vai receber a resposta pronta
2. `npm install`
3. `npm run dev`

## Row Level Security (verificar no Supabase)

O cliente do browser/servidor usa a chave anónima + a sessão do utilizador —
ou seja, depende de haver políticas RLS nas tabelas `casos`, `evidencias`,
`validacoes` e `historico_casos` que permitam a um utilizador autenticado
(via `utilizadores.auth_user_id`) ler e atualizar os casos do seu grupo. Isto
não foi configurado aqui porque exige acesso direto ao projeto Supabase — só
o endpoint `/api/casos` usa a service role key (que ignora RLS), porque quem
chama é o n8n, não uma pessoa com sessão.

## Assunções que fiz (por não estarem 100% especificadas)

- `prioridade`: `BAIXA | NORMAL | ALTA | URGENTE` (só o padrão NORMAL estava definido).
- Autenticação real = Supabase Auth (`auth_user_id`); `utilizadores.password_hash` fica sem uso.
- `ATRASADO` é calculado no dashboard comparando `prazo` com a data atual — não é escrito na coluna `estado` (que continua `EM_ATENDIMENTO`, por exemplo). Se preferires que um job atualize mesmo a coluna `estado` para `ATRASADO`, isso passa por uma função agendada no Supabase (Edge Function + cron), que não está incluída aqui.
- O registo/convite de novos membros (via `codigo_convite` do grupo) ainda não tem página própria — só o login foi feito. É o próximo passo lógico.

## O que ainda falta (não incluído por não ter sido pedido nesta etapa)

- Página de registo de líder/grupo e de entrada de membros por código de convite.
- Formulário de criação manual de caso pelo líder (a `server action` `criarCasoManual` já existe em `src/lib/actions.ts`, só falta a tela).
- Upload real de ficheiro para evidência (hoje só regista um comentário de texto).
- RLS no Supabase (ver secção acima).

## Estrutura

```
src/
  app/
    login/page.tsx
    dashboard/page.tsx            (painel do líder)
    dashboard/historico/page.tsx  (histórico filtrável)
    membro/page.tsx               (painel do membro)
    casos/[id]/page.tsx           (detalhe/execução do caso)
    api/casos/route.ts            (entrada da IA — POST autenticado por x-api-key)
  components/
    ui.tsx                (CaseCard, Pill, BigStat, SectionHeader — mesmo visual do protótipo)
    CaseDetailForm.tsx    (ações: pegar, atribuir, responder, aprovar/devolver)
  lib/
    supabase/{client,server,types}.ts
    auth.ts       (utilizador atual, exigir líder/membro)
    actions.ts    (regras de negócio — server actions)
    n8n.ts        (saída: webhook quando o caso conclui)
  middleware.ts   (sessão Supabase Auth)
```
