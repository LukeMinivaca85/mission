require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "openrouter/free";
const FREE_MODEL_ALIAS = "openrouter/free";
const BUILT_IN_FREE_MODELS = [
  "poolside/laguna-xs-2.1:free",
  "cohere/north-mini-code:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-4-26b-a4b-it:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
];
const FALLBACK_MODELS = uniqueList([
  DEFAULT_MODEL,
  ...String(process.env.OPENROUTER_FALLBACK_MODELS || "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean),
]);

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname)));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    configured: Boolean(process.env.OPENROUTER_API_KEY),
    model: DEFAULT_MODEL,
    fallback_models: expandModelAliases(FALLBACK_MODELS),
  });
});

app.get("/api/models", async (_req, res) => {
  if (!process.env.OPENROUTER_API_KEY) {
    return res.json({
      configured_model: DEFAULT_MODEL,
      fallback_models: expandModelAliases(FALLBACK_MODELS),
      models: expandModelAliases(FALLBACK_MODELS).map((model) => ({
        id: model,
        name: model,
        pricing: null,
        context_length: null,
      })),
    });
  }

  try {
    const headers = {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    };

    const response = await fetch(OPENROUTER_MODELS_URL, { headers });
    if (!response.ok) {
      return res.status(response.status).json({
        error: "Não foi possível carregar os modelos do OpenRouter.",
        details: await safeResponseText(response),
        configured_model: DEFAULT_MODEL,
        fallback_models: FALLBACK_MODELS,
      });
    }

    const payload = await response.json();
    const models = Array.isArray(payload.data) ? payload.data : [];
    res.json({
      configured_model: DEFAULT_MODEL,
      fallback_models: expandModelAliases(FALLBACK_MODELS),
      models: withFreeAlias(models).map((model) => ({
        id: model.id,
        name: model.name || model.id,
        pricing: model.pricing || null,
        context_length: model.context_length || null,
      })),
    });
  } catch (error) {
    res.status(502).json({
      error: "Falha ao consultar modelos do OpenRouter.",
      details: error.message,
      configured_model: DEFAULT_MODEL,
      fallback_models: FALLBACK_MODELS,
    });
  }
});

app.post("/api/agent-run", async (req, res) => {
  const { agentName, agentRole, task, tools, model } = req.body || {};

  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(400).json({
      error: "OPENROUTER_API_KEY não está configurada no servidor.",
      details: "Crie um arquivo .env com OPENROUTER_API_KEY=sua_chave_aqui e reinicie o servidor.",
    });
  }

  if (!agentName || !agentRole || !task) {
    return res.status(400).json({
      error: "Campos obrigatórios ausentes.",
      details: "Envie agentName, agentRole, task e tools.",
    });
  }

  const normalizedTools = Array.isArray(tools) ? tools.join(", ") : String(tools || "nenhuma");
  const candidateModels = uniqueList(expandModelAliases([model, ...FALLBACK_MODELS].filter(Boolean)));
  const errors = [];

  for (const candidateModel of candidateModels) {
    try {
      const startedAt = Date.now();
      const aiPayload = await callOpenRouter({
        model: candidateModel,
        agentName,
        agentRole,
        task,
        tools: normalizedTools,
      });
      const latency_ms = Date.now() - startedAt;
      const content = aiPayload?.choices?.[0]?.message?.content;
      const parsed = normalizeAgentJson(parseJsonFromText(content));

      return res.json({
        model: candidateModel,
        latency_ms,
        usage: aiPayload.usage || null,
        prompt: buildMessages({ agentName, agentRole, task, tools: normalizedTools }),
        raw_model_response: content,
        result: parsed,
      });
    } catch (error) {
      errors.push({ model: candidateModel, message: error.message });
    }
  }

  res.status(502).json({
    error: "A IA não retornou um JSON válido ou os modelos testados falharam.",
    details: errors,
  });
});

const server = app.listen(PORT, () => {
  console.log(`Lukintosh Mission Control rodando em http://localhost:${PORT}`);
  console.log(`Modelo OpenRouter padrão: ${DEFAULT_MODEL}`);
});

server.on("error", (error) => {
  console.error(`Falha ao iniciar servidor na porta ${PORT}:`, error.message);
  process.exitCode = 1;
});

async function callOpenRouter({ model, agentName, agentRole, task, tools }) {
  const messages = buildMessages({ agentName, agentRole, task, tools });
  const body = {
    model,
    messages,
    temperature: 0.2,
    response_format: { type: "json_object" },
  };

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "Lukintosh Mission Control",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter ${response.status}: ${await safeResponseText(response)}`);
  }

  return response.json();
}

function buildMessages({ agentName, agentRole, task, tools }) {
  return [
    {
      role: "system",
      content:
        "Você é um agente da Lukintosh Mission Control. Planeje tarefas com segurança. Nunca execute ações externas diretamente. Avalie risco, peça aprovação para ações sensíveis e responda somente em JSON válido, sem Markdown, sem blocos de código e sem texto fora do JSON.",
    },
    {
      role: "user",
      content: `Agente: ${agentName}\nFunção: ${agentRole}\nFerramentas permitidas: ${tools}\nTarefa: ${task}\n\nResponda somente em JSON válido neste formato exato:\n{\n  "summary": "string curta",\n  "steps": ["passo 1", "passo 2"],\n  "risk_level": "low|medium|high",\n  "required_approval": true,\n  "suggested_actions": ["acao"]\n}`,
    },
  ];
}

function parseJsonFromText(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Resposta vazia da IA.");
  }

  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("Não foi possível encontrar JSON na resposta da IA.");
    }
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

function expandModelAliases(models) {
  return uniqueList(
    models.flatMap((model) => {
      if (!model || model === FREE_MODEL_ALIAS) return BUILT_IN_FREE_MODELS;
      return [model];
    })
  );
}

function withFreeAlias(models) {
  const freeAlias = {
    id: FREE_MODEL_ALIAS,
    name: "OpenRouter Free Auto (alias local)",
    pricing: { prompt: "0", completion: "0" },
    context_length: null,
  };
  return [freeAlias, ...models];
}

function normalizeAgentJson(value) {
  const risk = String(value.risk_level || "medium").toLowerCase();
  const riskLevel = ["low", "medium", "high"].includes(risk) ? risk : "medium";
  const steps = Array.isArray(value.steps)
    ? value.steps.map((step) => String(step)).filter(Boolean)
    : String(value.steps || "")
        .split("\n")
        .map((step) => step.trim())
        .filter(Boolean);
  const suggestedActions = Array.isArray(value.suggested_actions)
    ? value.suggested_actions.map((action) => String(action)).filter(Boolean)
    : String(value.suggested_actions || "")
        .split("\n")
        .map((action) => action.trim())
        .filter(Boolean);

  return {
    summary: String(value.summary || "Plano recebido da IA."),
    steps: steps.length ? steps : ["Revisar a tarefa", "Planejar execução segura", "Registrar resultado"],
    risk_level: riskLevel,
    required_approval: Boolean(value.required_approval) || riskLevel !== "low",
    suggested_actions: suggestedActions,
  };
}

function uniqueList(items) {
  return [...new Set(items.filter(Boolean))];
}

async function safeResponseText(response) {
  try {
    return await response.text();
  } catch {
    return "Sem detalhes disponíveis.";
  }
}
