const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
const FREE_MODEL_ALIAS = "openrouter/free";
const BUILT_IN_FREE_MODELS = [
  "poolside/laguna-xs-2.1:free",
  "cohere/north-mini-code:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-4-26b-a4b-it:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
];

export function getDefaultModel(env) {
  return env.OPENROUTER_MODEL || "openrouter/free";
}

export function getFallbackModels(env) {
  return uniqueList([
    getDefaultModel(env),
    ...String(env.OPENROUTER_FALLBACK_MODELS || "")
      .split(",")
      .map((model) => model.trim())
      .filter(Boolean),
  ]);
}

export function json(data, init = {}) {
  return Response.json(data, {
    ...init,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      ...(init.headers || {}),
    },
  });
}

export function options() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    },
  });
}

export async function fetchModels(env) {
  const defaultModel = getDefaultModel(env);
  const fallbackModels = expandModelAliases(getFallbackModels(env));

  if (!env.OPENROUTER_API_KEY) {
    return {
      configured_model: defaultModel,
      fallback_models: fallbackModels,
      models: fallbackModels.map((model) => ({
        id: model,
        name: model,
        pricing: null,
        context_length: null,
      })),
    };
  }

  const response = await fetch(OPENROUTER_MODELS_URL, {
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
    },
  });

  if (!response.ok) {
    return {
      configured_model: defaultModel,
      fallback_models: fallbackModels,
      models: fallbackModels.map((model) => ({ id: model, name: model, pricing: null, context_length: null })),
      warning: "Não foi possível carregar modelos do OpenRouter.",
    };
  }

  const payload = await response.json();
  const models = Array.isArray(payload.data) ? payload.data : [];
  return {
    configured_model: defaultModel,
    fallback_models: fallbackModels,
    models: withFreeAlias(models).map((model) => ({
      id: model.id,
      name: model.name || model.id,
      pricing: model.pricing || null,
      context_length: model.context_length || null,
    })),
  };
}

export async function runAgent(env, body) {
  const { agentName, agentRole, task, tools, model } = body || {};

  if (!env.OPENROUTER_API_KEY) {
    return json(
      {
        error: "OPENROUTER_API_KEY não está configurada no Cloudflare Pages.",
        details: "Configure a variável secreta OPENROUTER_API_KEY no projeto Pages e faça novo deploy.",
      },
      { status: 400 }
    );
  }

  if (!agentName || !agentRole || !task) {
    return json(
      {
        error: "Campos obrigatórios ausentes.",
        details: "Envie agentName, agentRole, task e tools.",
      },
      { status: 400 }
    );
  }

  const normalizedTools = Array.isArray(tools) ? tools.join(", ") : String(tools || "nenhuma");
  const candidateModels = uniqueList(expandModelAliases([model, ...getFallbackModels(env)].filter(Boolean)));
  const errors = [];

  for (const candidateModel of candidateModels) {
    try {
      const startedAt = Date.now();
      const aiPayload = await callOpenRouter(env, {
        model: candidateModel,
        agentName,
        agentRole,
        task,
        tools: normalizedTools,
      });
      const latency_ms = Date.now() - startedAt;
      const content = aiPayload?.choices?.[0]?.message?.content;
      const parsed = normalizeAgentJson(parseJsonFromText(content));

      return json({
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

  return json(
    {
      error: "A IA não retornou um JSON válido ou os modelos testados falharam.",
      details: errors,
    },
    { status: 502 }
  );
}

async function callOpenRouter(env, { model, agentName, agentRole, task, tools }) {
  const messages = buildMessages({ agentName, agentRole, task, tools });
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://mission.lukintosh.com",
      "X-Title": "Lukintosh Mission Control",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
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
    steps: steps.length ? steps : ["Revisar a missão", "Planejar execução segura", "Registrar resultado"],
    risk_level: riskLevel,
    required_approval: Boolean(value.required_approval) || riskLevel !== "low",
    suggested_actions: suggestedActions,
  };
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
  return [
    {
      id: FREE_MODEL_ALIAS,
      name: "OpenRouter Free Auto (alias local)",
      pricing: { prompt: "0", completion: "0" },
      context_length: null,
    },
    ...models,
  ];
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
