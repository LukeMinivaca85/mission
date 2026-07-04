# Lukintosh Mission Control

MVP local para desenvolver, monitorar, entender, depurar e controlar agentes de IA com OpenRouter.

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
- O servidor nunca executa ações externas automaticamente.
- A IA só planeja e responde JSON.
- Se `required_approval` vier como `true`, o frontend pausa a missão.
- Aprovar ou negar apenas registra a decisão; nenhuma ação real é executada.
- Tudo fica registrado nos logs do `localStorage`.

## Funcionalidades atuais

- Dashboard com métricas, custos, tokens, latência, gráfico de atividade e heatmap operacional.
- Agentes com criação, edição, duplicação, exclusão, permissões e seleção de modelo.
- Missões com previsão antes da execução, progresso, risco, benchmark, timeline e aprovação humana.
- Agent Inspector com Trust Score, Agent DNA, memória viva, ferramentas, timeline inteligente, Time Machine, Prompt Diff, investigação e explicação da decisão.
- Agent Universe com agentes como esferas animadas e conexões visuais.
- Marketplace local de agentes instaláveis.
- Logs auditáveis com filtros por agente, missão, ferramenta/ação e status.

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
```

Nunca publique `.env`. A chave deve ficar como secret/env var do Cloudflare Pages.

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
