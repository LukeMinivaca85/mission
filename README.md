# Lukintosh Mission Control

Sistema operacional para desenvolver, monitorar, entender, depurar e controlar agentes de IA com OpenRouter.

Slogan: **Observe, controle e confie nos seus agentes de IA.**

## Stack

- Frontend em HTML, CSS e JavaScript puro.
- Backend em Node.js + Express.
- Persistência local no navegador com `localStorage`.
- Chave do OpenRouter somente no servidor via `OPENROUTER_API_KEY`.

## Como configurar OpenRouter

1. Crie uma conta no OpenRouter.
2. Crie uma chave de API.
3. Crie um arquivo `.env` na raiz do projeto:

```env
OPENROUTER_API_KEY=sua_chave_aqui
OPENROUTER_MODEL=openrouter/free
OPENROUTER_FALLBACK_MODELS=openrouter/free
PORT=3000

# Opcional: conectores reais
GITHUB_TOKEN=
SLACK_BOT_TOKEN=
GOOGLE_ACCESS_TOKEN=
GOOGLE_REFRESH_TOKEN=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_SHEET_ID=
NOTION_TOKEN=
HTTP_API_BASE_URL=
HTTP_API_TOKEN=
CONNECTOR_WORKSPACE_ROOT=
DATABASE_URL=sqlite://./data/mission-control.db
MCP_SERVER_URL=http://localhost:3000/api/mcp
MCP_SERVER_TOKEN=
DISCORD_WEBHOOK_URL=
LINEAR_API_KEY=
TRELLO_KEY=
TRELLO_TOKEN=
HUBSPOT_ACCESS_TOKEN=

# Opcional: Stripe Billing
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO=
STRIPE_PRICE_BUSINESS=
```

4. Instale as dependências:

```bash
npm install
```

5. Rode o servidor:

```bash
npm start
```

6. Abra:

```text
http://localhost:3000
```

## Modelos

O modelo padrão é:

```env
OPENROUTER_MODEL=openrouter/free
```

No Lukintosh, `openrouter/free` funciona como um alias local. O backend resolve esse alias para uma fila de modelos grátis reais disponíveis no OpenRouter, por exemplo:

- `poolside/laguna-xs-2.1:free`
- `cohere/north-mini-code:free`
- `meta-llama/llama-3.3-70b-instruct:free`
- `google/gemma-4-26b-a4b-it:free`
- `nvidia/nemotron-3-super-120b-a12b:free`

Você pode configurar fallbacks separados por vírgula:

```env
OPENROUTER_FALLBACK_MODELS=openrouter/free,outro/modelo-gratis
```

O app também consulta `/api/models` para listar modelos visíveis pela API do OpenRouter e permitir selecionar modelos no cadastro de agentes. Modelos externos podem ficar indisponíveis, mudar de preço ou falhar por limite da conta; por isso o servidor tenta o modelo escolhido e depois os fallbacks configurados.

## Endpoint principal

```http
POST /api/agent-run
```

O frontend envia:

```json
{
  "agentName": "Atlas Research",
  "agentRole": "Analista de sinais",
  "task": "Preparar missão",
  "tools": ["pesquisar_web", "ler_arquivo", "enviar_email"],
  "model": "openrouter/free"
}
```

O servidor chama:

```text
POST https://openrouter.ai/api/v1/chat/completions
```

Headers usados:

- `Authorization: Bearer process.env.OPENROUTER_API_KEY`
- `Content-Type: application/json`
- `HTTP-Referer: http://localhost:3000`
- `X-Title: Lukintosh Mission Control`

## Segurança

- A chave nunca vai para o frontend.
- Tokens de conectores também nunca vão para o frontend.
- A chave secreta do Stripe fica apenas no servidor via `STRIPE_SECRET_KEY`.
- O checkout real acontece no Stripe Checkout; o Mission Control não recebe dados de cartão.
- O servidor nunca executa ações externas automaticamente.
- A IA só planeja e responde JSON.
- Se `required_approval` vier como `true`, o frontend pausa a missão.
- Aprovar ou negar apenas registra a decisão; nenhuma ação real é executada.
- Tudo fica registrado nos logs do `localStorage`.

## Stripe Billing

O Mission Control usa Stripe Checkout Sessions para assinar planos recorrentes. O frontend chama o backend em vez de falar com Stripe diretamente.

Endpoints:

```http
POST /api/billing/checkout
GET /api/billing/session?session_id=...
POST /api/billing/webhook
```

Variáveis:

- `STRIPE_SECRET_KEY`: chave secreta do Stripe, começando com `sk_test_` ou `sk_live_`.
- `STRIPE_PRICE_PRO`: Price ID recorrente do plano Pro.
- `STRIPE_PRICE_BUSINESS`: Price ID recorrente do plano Business.
- `STRIPE_WEBHOOK_SECRET`: segredo do webhook para validar eventos localmente no Express.

Fluxo:

1. Crie produtos e preços recorrentes no Stripe para Pro e Business.
2. Configure os Price IDs no `.env` local e nas variáveis do Cloudflare Pages.
3. O usuário clica em **Assinar Pro** ou **Assinar Business**.
4. O backend cria uma Checkout Session com `mode: subscription`.
5. O Stripe redireciona de volta para o app com `session_id`.
6. O app confirma `/api/billing/session` e ativa o plano no `localStorage`.

Sem `STRIPE_SECRET_KEY` ou Price ID, o app mostra um fallback de desenvolvimento para simular assinatura localmente.

## Camada Enterprise

O backend Express inclui uma camada Enterprise incremental e auditável em `enterprise-store.js`.

Funciona hoje:

- Organização padrão com `id`, `slug`, proprietário, membros e workspaces.
- RBAC no servidor para `Owner`, `Admin`, `Operator`, `Analyst` e `Viewer`.
- Autorização central por permissão antes de operações sensíveis.
- Políticas de governança por organização: modelos, ferramentas, custos, retenção, exportação e compartilhamento.
- Aprovações humanas com decisão, justificativa, usuário e horário.
- Auditoria append-only no fluxo comum da interface.
- API keys por organização com hash SHA-256, prefixo visível, escopos, revogação e último uso.
- Leads comerciais Enterprise via `POST /api/enterprise/sales-leads`.
- Rate limit básico para rotas `/api` e headers de segurança no Express.

Endpoints locais:

```http
GET /api/enterprise/context
POST /api/enterprise/members
PATCH /api/enterprise/members/:memberId
DELETE /api/enterprise/members/:memberId
POST /api/enterprise/policies
POST /api/enterprise/approvals
POST /api/enterprise/approvals/:approvalId/decision
POST /api/enterprise/api-keys
DELETE /api/enterprise/api-keys/:keyId
GET /api/enterprise/usage.csv
POST /api/enterprise/sales-leads
```

Headers usados para tenant e usuário no desenvolvimento:

```http
x-org-id: org_lukintosh
x-user-email: owner@lukintosh.com
x-api-key: lm_... opcional
```

Em Cloudflare Pages Functions, `/api/enterprise/context` e `/api/enterprise/sales-leads` existem em modo piloto. Para persistência Enterprise em produção, conecte um banco/serviço de dados e armazenamento de secrets. Não há afirmação de LGPD, GDPR, SOC 2, ISO 27001 ou SLA sem evidência/contrato.

SSO e SCIM estão marcados como **Disponível em piloto**. A interface, políticas e endpoints-base estão preparados, mas a ativação real depende de provedor externo, domínio verificado, armazenamento seguro de configuração e testes de autenticação.

## Early Access

O Early Access é a campanha principal de aquisição do Mission. Ele é aberto, imediato e não exige login, candidatura, aprovação manual, cartão ou conta.

Mensagem principal:

> Mission Early Access is live. Run AI agents. See what they’re doing. Stay in control. Start now — no account or credit card required.

Funciona hoje:

- Página `/early-access` com CTAs `Start Free`, `Get Pro`, `Get Business` e `See Mission in Action`.
- `Start Free` gera um identificador anônimo local, ativa `Free Early Access` e prepara a primeira missão.
- O plano gratuito do piloto não cobra automaticamente ao fim do piloto e preserva os dados locais.
- O usuário pode fazer upgrade para Pro ou Business usando o Stripe Checkout já existente.
- Pagamentos continuam validados pelo backend e pelo Stripe; privilégios pagos não dependem apenas de `localStorage`.
- O Early Access local não libera privilégios Business/Enterprise sensíveis.
- Eventos de funil são registrados sem dados pessoais desnecessários.

Endpoints:

```http
POST /api/early-access/start
POST /api/funnel/events
GET /api/funnel/summary
```

Limites do Free Early Access:

- 3 agentes.
- 10 missões por mês.
- Inspector completo durante o piloto.
- Replay completo durante o piloto.
- Templates premium selecionados.
- Badge `Early Access Member`.

Cloudflare Pages Functions também expõe essas rotas em modo runtime. Para persistência durável de analytics, conecte D1/KV/Postgres ou mantenha o backend Express como origem das APIs.

Para sincronizar os secrets com o Cloudflare Pages depois de preencher o `.env` local:

```bash
npm run cloudflare:secrets
```

Esse comando envia para o projeto Pages `mission` os secrets preenchidos localmente. Stripe é obrigatório para monetização:

- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_BUSINESS`
- `STRIPE_WEBHOOK_SECRET`

Além disso, sincroniza conectores presentes no `.env`, como `GITHUB_TOKEN`, `SLACK_BOT_TOKEN`, `GOOGLE_REFRESH_TOKEN`, `NOTION_TOKEN`, `LINEAR_API_KEY`, `TRELLO_TOKEN` e `HUBSPOT_ACCESS_TOKEN`.

Os valores não são impressos no terminal.

## Conectores reais

Os conectores aparecem em **Configurações > Conectores**. O frontend consulta o servidor e mostra se cada integração está sem configuração, configurada, conectada ou com erro.

Endpoints:

```http
GET /api/connectors
POST /api/connectors
POST /api/connectors/action
```

Payload de teste:

```json
{ "id": "github" }
```

Payload de prévia real:

```json
{ "id": "google-calendar", "action": "preview" }
```

Variáveis suportadas:

- `GITHUB_TOKEN`: testa `https://api.github.com/user`.
- `SLACK_BOT_TOKEN`: testa `https://slack.com/api/auth.test`.
- `GOOGLE_ACCESS_TOKEN`: testa Gmail, Google Drive, Google Agenda e Google Sheets, dependendo dos escopos OAuth concedidos.
- `GOOGLE_REFRESH_TOKEN`, `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`: modo recomendado para Google. O backend renova o access token automaticamente quando ele expira.
- `GOOGLE_SHEET_ID`: habilita a prévia de uma planilha específica.
- `NOTION_TOKEN`: testa `https://api.notion.com/v1/users/me`.
- `HTTP_API_BASE_URL` e opcionalmente `HTTP_API_TOKEN`: testa uma API HTTP.
- `MCP_SERVER_URL` e opcionalmente `MCP_SERVER_TOKEN`: testa um servidor MCP remoto ou o MCP local em `/api/mcp`.
- `CONNECTOR_WORKSPACE_ROOT`: habilita o conector de arquivos locais no servidor.
- `DATABASE_URL`: habilita o conector SQL em modo protegido. No desenvolvimento local, `sqlite://./data/mission-control.db` é suficiente para marcar o conector como pronto sem executar mutações.
- `DISCORD_WEBHOOK_URL`: valida o webhook Discord. Envio real deve exigir aprovação humana.
- `LINEAR_API_KEY`: consulta usuário e times do Linear.
- `TRELLO_KEY` e `TRELLO_TOKEN`: consulta usuário e boards do Trello.
- `HUBSPOT_ACCESS_TOKEN`: consulta contatos do HubSpot CRM.

Nesta fase, os conectores validam credenciais, status real e prévias de leitura. Ações que alteram dados continuam bloqueadas por aprovação humana e devem ser implementadas como operações auditáveis no backend.

## Funcionalidades atuais

- Dashboard com métricas, custos, tokens, latência, gráfico de atividade e heatmap operacional.
- Agentes com criação, edição, duplicação, exclusão, permissões e seleção de modelo.
- Missões com previsão antes da execução, progresso, risco, benchmark, timeline e aprovação humana.
- Agent Inspector com Trust Score, Agent DNA, memória viva, ferramentas, timeline inteligente, Time Machine, Prompt Diff, investigação e explicação da decisão.
- Agent Universe com agentes como esferas animadas e conexões visuais.
- Marketplace local de agentes instaláveis.
- Teams com workspaces, membros, papéis, convites simulados, permissões por papel e auditoria em logs.
- Governança Business com limite mensal, retenção de auditoria, política de aprovação, canal de incidentes, revisão crítica e conectores de equipe.
- Controles Enterprise com SSO em piloto, domínio permitido, BYOK, região de dados, implantação dedicada sob contrato, auditoria e exportação.
- Logs auditáveis com filtros por agente, missão, ferramenta/ação e status.

## Planos e recursos

- Free: 3 agentes, 10 missões por mês, 1 workspace local, modelos gratuitos, logs básicos, dashboard e aprovação manual.
- Free Early Access: 3 agentes, 10 missões por mês, Inspector completo, Replay completo durante o piloto, templates premium selecionados e badge Early Access Member, sem login e sem cartão.
- Pro: agentes ilimitados, 500 missões por mês, Replay completo, Inspector avançado, exportação PDF/Markdown, Marketplace premium, templates premium e benchmark multi-modelo.
- Business: tudo do Pro, múltiplos workspaces, membros da equipe, papéis `owner/admin/operator/viewer`, auditoria por membro, integrações de equipe, limites de custo, política de aprovação, retenção de auditoria e canal de incidentes.
- Enterprise: tudo do Business, SSO/SCIM em piloto, domínio permitido, logs avançados, BYOK, região de dados, API keys, exportação de auditoria e suporte prioritário sob contrato.

Na versão atual, Teams e Governança são local-first em `localStorage`. O produto já demonstra workspace, convite, permissões, políticas Business e controles Enterprise. Login real, cobrança por assento, SSO real, BYOK real e convites por email ficam como próxima camada de backend.

## Deploy em Cloudflare Pages

O projeto mantém dois runtimes:

- Local: `server.js` com Express.
- Produção: `functions/api/*` com Cloudflare Pages Functions.

No Cloudflare Pages, configure:

```text
Project name: mission
Production domain: mission.Lukintosh.com
Build command: npm install
Build output directory: .
```

Depois configure as variáveis:

```env
OPENROUTER_API_KEY=sua_chave_no_painel_cloudflare
OPENROUTER_MODEL=openrouter/free
OPENROUTER_FALLBACK_MODELS=openrouter/free
GITHUB_TOKEN=opcional
SLACK_BOT_TOKEN=opcional
GOOGLE_ACCESS_TOKEN=opcional
NOTION_TOKEN=opcional
HTTP_API_BASE_URL=opcional
HTTP_API_TOKEN=opcional
MCP_SERVER_URL=opcional
MCP_SERVER_TOKEN=opcional
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_BUSINESS=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Nunca publique `.env`. A chave deve ficar como secret/env var do Cloudflare Pages.

Para publicar sem `pnpm`, use:

```bash
npm run deploy
```

Esse comando executa `npx wrangler@latest pages deploy . --project-name mission`.

## Estrutura

```text
index.html
style.css
app.js
server.js
package.json
.env.example
README.md
```
