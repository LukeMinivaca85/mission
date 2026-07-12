const CONNECTOR_DEFINITIONS = [
  {
    id: "github",
    name: "GitHub",
    provider: "github",
    status: "available",
    requiredEnv: ["GITHUB_TOKEN"],
    docs: "Crie um fine-grained token no GitHub e salve como GITHUB_TOKEN.",
  },
  {
    id: "gmail",
    name: "Gmail",
    provider: "google",
    status: "available",
    requiredEnv: ["GOOGLE_ACCESS_TOKEN"],
    docs: "Use um access token OAuth do Google com escopos de Gmail.",
  },
  {
    id: "slack",
    name: "Slack",
    provider: "slack",
    status: "available",
    requiredEnv: ["SLACK_BOT_TOKEN"],
    docs: "Crie um Slack App, instale no workspace e salve o Bot User OAuth Token.",
  },
  {
    id: "google-drive",
    name: "Google Drive",
    provider: "google",
    status: "available",
    requiredEnv: ["GOOGLE_ACCESS_TOKEN"],
    docs: "Use um access token OAuth do Google com escopos de Drive.",
  },
  {
    id: "google-calendar",
    name: "Google Agenda",
    provider: "google",
    status: "available",
    requiredEnv: ["GOOGLE_ACCESS_TOKEN"],
    docs: "Use um access token OAuth do Google com escopo Calendar readonly ou Calendar.",
  },
  {
    id: "google-sheets",
    name: "Google Sheets",
    provider: "google",
    status: "available",
    requiredEnv: ["GOOGLE_ACCESS_TOKEN", "GOOGLE_SHEET_ID"],
    docs: "Configure GOOGLE_ACCESS_TOKEN e GOOGLE_SHEET_ID para testar metadados da planilha.",
  },
  {
    id: "notion",
    name: "Notion",
    provider: "notion",
    status: "available",
    requiredEnv: ["NOTION_TOKEN"],
    docs: "Crie uma integração no Notion e salve o Internal Integration Secret.",
  },
  {
    id: "http-api",
    name: "APIs HTTP",
    provider: "http",
    status: "available",
    requiredEnv: ["HTTP_API_BASE_URL"],
    optionalEnv: ["HTTP_API_TOKEN"],
    docs: "Configure HTTP_API_BASE_URL e opcionalmente HTTP_API_TOKEN.",
  },
  {
    id: "local-files",
    name: "Arquivos locais",
    provider: "local",
    status: "guarded",
    requiredEnv: ["CONNECTOR_WORKSPACE_ROOT"],
    docs: "Configure CONNECTOR_WORKSPACE_ROOT para liberar inspeção de arquivos locais no servidor.",
  },
  {
    id: "sql",
    name: "Banco de dados SQL",
    provider: "sql",
    status: "guarded",
    requiredEnv: ["DATABASE_URL"],
    docs: "Configure DATABASE_URL. Nesta fase o Mission Control apenas valida configuração e bloqueia mutações.",
  },
  {
    id: "mcp",
    name: "MCP Servers",
    provider: "mcp",
    status: "available",
    requiredEnv: ["MCP_SERVER_URL"],
    optionalEnv: ["MCP_SERVER_TOKEN"],
    docs: "Configure MCP_SERVER_URL e opcionalmente MCP_SERVER_TOKEN.",
  },
  {
    id: "discord",
    name: "Discord",
    provider: "discord",
    status: "guarded",
    requiredEnv: ["DISCORD_WEBHOOK_URL"],
    docs: "Configure DISCORD_WEBHOOK_URL. Envio de mensagens deve exigir aprovação humana.",
  },
  {
    id: "linear",
    name: "Linear",
    provider: "linear",
    status: "available",
    requiredEnv: ["LINEAR_API_KEY"],
    docs: "Configure LINEAR_API_KEY para consultar usuário, times e issues.",
  },
  {
    id: "trello",
    name: "Trello",
    provider: "trello",
    status: "available",
    requiredEnv: ["TRELLO_KEY", "TRELLO_TOKEN"],
    docs: "Configure TRELLO_KEY e TRELLO_TOKEN para consultar boards e cartões.",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    provider: "hubspot",
    status: "available",
    requiredEnv: ["HUBSPOT_ACCESS_TOKEN"],
    docs: "Configure HUBSPOT_ACCESS_TOKEN para consultar contatos e CRM.",
  },
];

export function listConnectors(env) {
  return CONNECTOR_DEFINITIONS.map((connector) => connectorStatus(env, connector));
}

export async function testConnector(env, id) {
  const connector = CONNECTOR_DEFINITIONS.find((item) => item.id === id);
  if (!connector) {
    return {
      id,
      state: "unknown",
      ok: false,
      message: "Conector desconhecido.",
    };
  }

  const status = connectorStatus(env, connector);
  if (!status.configured) {
    return {
      ...status,
      ok: false,
      message: `Configure ${formatMissingEnv(status.missingEnv).join(", ")} no servidor antes de testar.`,
    };
  }

  try {
    if (id === "github") return await testGitHub(env, status);
    if (id === "gmail") return await testGmail(env, status);
    if (id === "slack") return await testSlack(env, status);
    if (id === "google-drive") return await testGoogleDrive(env, status);
    if (id === "google-calendar") return await testGoogleCalendar(env, status);
    if (id === "google-sheets") return await testGoogleSheets(env, status);
    if (id === "notion") return await testNotion(env, status);
    if (id === "http-api") return await testHttpApi(env, status);
    if (id === "mcp") return await testMcp(env, status);
    if (id === "discord") return await testDiscord(env, status);
    if (id === "linear") return await testLinear(env, status);
    if (id === "trello") return await testTrello(env, status);
    if (id === "hubspot") return await testHubSpot(env, status);

    return {
      ...status,
      ok: true,
      state: "configured",
      message: "Conector configurado. A execução real permanece bloqueada por aprovação humana.",
    };
  } catch (error) {
    return {
      ...status,
      ok: false,
      state: "error",
      message: error.message || "Falha ao testar conector.",
    };
  }
}

export async function runConnectorAction(env, id, action = "preview") {
  const connector = CONNECTOR_DEFINITIONS.find((item) => item.id === id);
  if (!connector) {
    return {
      id,
      action,
      ok: false,
      state: "unknown",
      message: "Conector desconhecido.",
    };
  }

  const status = connectorStatus(env, connector);
  if (!status.configured) {
    return {
      ...status,
      action,
      ok: false,
      message: `Configure ${formatMissingEnv(status.missingEnv).join(", ")} no servidor antes de executar.`,
    };
  }

  if (action !== "preview") {
    return {
      ...status,
      action,
      ok: false,
      state: "approval_required",
      message: "Ações mutáveis exigem aprovação humana e ainda estão bloqueadas neste MVP.",
    };
  }

  try {
    if (id === "github") return await previewGitHub(env, status);
    if (id === "gmail") return await previewGmail(env, status);
    if (id === "slack") return await previewSlack(env, status);
    if (id === "google-drive") return await previewGoogleDrive(env, status);
    if (id === "google-calendar") return await previewGoogleCalendar(env, status);
    if (id === "google-sheets") return await previewGoogleSheets(env, status);
    if (id === "notion") return await previewNotion(env, status);
    if (id === "http-api") return await previewHttpApi(env, status);
    if (id === "mcp") return await previewMcp(env, status);
    if (id === "discord") return await previewDiscord(env, status);
    if (id === "linear") return await previewLinear(env, status);
    if (id === "trello") return await previewTrello(env, status);
    if (id === "hubspot") return await previewHubSpot(env, status);

    return {
      ...status,
      action,
      ok: true,
      state: "connected",
      message: "Conector pronto, sem preview específico.",
      preview: [],
    };
  } catch (error) {
    return {
      ...status,
      action,
      ok: false,
      state: "error",
      message: error.message || "Falha ao executar ação do conector.",
    };
  }
}

function connectorStatus(env, connector) {
  const requiredEnv = connector.requiredEnv || [];
  const optionalEnv = connector.optionalEnv || [];
  const missingEnv = requiredEnv.filter((key) => {
    if (key === "GOOGLE_ACCESS_TOKEN") return !hasGoogleAuth(env);
    return !getEnv(env, key);
  });
  const configured = missingEnv.length === 0;

  return {
    id: connector.id,
    name: connector.name,
    provider: connector.provider,
    state: configured ? "configured" : "missing_config",
    configured,
    requiredEnv,
    optionalEnv,
    missingEnv,
    docs: connector.docs,
    guarded: connector.status === "guarded",
    message: configured
      ? "Segredos encontrados no servidor. Pronto para teste."
      : `Falta configurar ${formatMissingEnv(missingEnv).join(", ")} no servidor.`,
  };
}

async function testGitHub(env, status) {
  const payload = await fetchJson("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${getEnv(env, "GITHUB_TOKEN")}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "Lukintosh-Mission-Control",
    },
  });

  return connected(status, `GitHub conectado como ${payload.login || payload.name || "usuário"}.`, {
    login: payload.login,
    scopes: "token-validado",
  });
}

async function testGmail(env, status) {
  const payload = await fetchJson("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
    headers: await googleHeaders(env),
  });

  return connected(status, `Gmail conectado para ${payload.emailAddress || "conta Google"}.`, {
    email: payload.emailAddress,
    messagesTotal: payload.messagesTotal,
  });
}

async function testSlack(env, status) {
  const payload = await fetchJson("https://slack.com/api/auth.test", {
    headers: {
      Authorization: `Bearer ${getEnv(env, "SLACK_BOT_TOKEN")}`,
    },
  });

  if (!payload.ok) {
    throw new Error(payload.error || "Slack recusou o token.");
  }

  return connected(status, `Slack conectado em ${payload.team || "workspace"}.`, {
    team: payload.team,
    user: payload.user,
  });
}

async function testGoogleDrive(env, status) {
  const payload = await fetchJson("https://www.googleapis.com/drive/v3/about?fields=user,storageQuota", {
    headers: await googleHeaders(env),
  });

  return connected(status, `Google Drive conectado para ${payload.user?.emailAddress || "conta Google"}.`, {
    email: payload.user?.emailAddress,
  });
}

async function testGoogleCalendar(env, status) {
  const payload = await fetchJson("https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1", {
    headers: await googleHeaders(env),
  });

  return connected(status, `Google Agenda conectado com ${payload.summary || payload.items?.length || 0} calendário(s) visíveis.`, {
    calendars: payload.items?.length || 0,
  });
}

async function testGoogleSheets(env, status) {
  const sheetId = getEnv(env, "GOOGLE_SHEET_ID");
  const payload = await fetchJson(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}?fields=spreadsheetId,properties.title,sheets.properties.title`, {
    headers: await googleHeaders(env),
  });

  return connected(status, `Google Sheets conectado à planilha ${payload.properties?.title || "configurada"}.`, {
    spreadsheetId: payload.spreadsheetId,
    title: payload.properties?.title,
    sheets: payload.sheets?.length || 0,
  });
}

async function testNotion(env, status) {
  const payload = await fetchJson("https://api.notion.com/v1/users/me", {
    headers: {
      Authorization: `Bearer ${getEnv(env, "NOTION_TOKEN")}`,
      "Notion-Version": "2022-06-28",
    },
  });

  return connected(status, `Notion conectado como ${payload.name || payload.bot?.owner?.workspace_name || "integração"}.`, {
    user: payload.name,
    type: payload.type,
  });
}

async function testHttpApi(env, status) {
  const baseUrl = getEnv(env, "HTTP_API_BASE_URL");
  const headers = {};
  const token = getEnv(env, "HTTP_API_TOKEN");
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(baseUrl, { method: "GET", headers });
  if (!response.ok) {
    throw new Error(`API HTTP respondeu ${response.status}.`);
  }

  return connected(status, `API HTTP respondeu ${response.status}.`, {
    url: redactUrl(baseUrl),
  });
}

async function testMcp(env, status) {
  const url = getEnv(env, "MCP_SERVER_URL");
  const headers = {};
  const token = getEnv(env, "MCP_SERVER_TOKEN");
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, { method: "GET", headers });
  if (!response.ok) {
    throw new Error(`MCP respondeu ${response.status}.`);
  }

  return connected(status, `MCP Server respondeu ${response.status}.`, {
    url: redactUrl(url),
  });
}

async function testDiscord(env, status) {
  const payload = await fetchJson(getEnv(env, "DISCORD_WEBHOOK_URL"), { method: "GET" });
  return connected(status, `Discord Webhook conectado ao canal ${payload.channel_id || "configurado"}.`, {
    name: payload.name,
    channel: payload.channel_id,
  });
}

async function testLinear(env, status) {
  const payload = await linearGraphql(env, "{ viewer { id name email } }");
  return connected(status, `Linear conectado como ${payload.data?.viewer?.name || "usuário"}.`, {
    user: payload.data?.viewer?.name,
    email: payload.data?.viewer?.email,
  });
}

async function testTrello(env, status) {
  const payload = await fetchJson(trelloUrl(env, "members/me", "fields=username,fullName"), {});
  return connected(status, `Trello conectado como ${payload.fullName || payload.username || "usuário"}.`, {
    user: payload.username,
  });
}

async function testHubSpot(env, status) {
  const payload = await fetchJson("https://api.hubapi.com/crm/v3/objects/contacts?limit=1&properties=email,firstname,lastname", {
    headers: {
      Authorization: `Bearer ${getEnv(env, "HUBSPOT_ACCESS_TOKEN")}`,
    },
  });

  return connected(status, `HubSpot conectado com acesso ao CRM.`, {
    sampleContacts: payload.results?.length || 0,
  });
}

async function previewGitHub(env, status) {
  const repos = await fetchJson("https://api.github.com/user/repos?per_page=5&sort=updated", {
    headers: {
      Authorization: `Bearer ${getEnv(env, "GITHUB_TOKEN")}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "Lukintosh-Mission-Control",
    },
  });
  return preview(status, "Repositórios recentes carregados do GitHub.", repos.map((repo) => ({
    title: repo.full_name,
    detail: repo.private ? "privado" : "público",
    url: repo.html_url,
  })));
}

async function previewGmail(env, status) {
  const labels = await fetchJson("https://gmail.googleapis.com/gmail/v1/users/me/labels", {
    headers: await googleHeaders(env),
  });
  return preview(status, "Labels do Gmail carregadas.", (labels.labels || []).slice(0, 8).map((label) => ({
    title: label.name,
    detail: label.type,
  })));
}

async function previewSlack(env, status) {
  const payload = await fetchJson("https://slack.com/api/conversations.list?limit=8&types=public_channel,private_channel", {
    headers: {
      Authorization: `Bearer ${getEnv(env, "SLACK_BOT_TOKEN")}`,
    },
  });
  if (!payload.ok) throw new Error(payload.error || "Slack recusou o token.");
  return preview(status, "Canais do Slack carregados.", (payload.channels || []).map((channel) => ({
    title: `#${channel.name}`,
    detail: channel.is_private ? "privado" : "público",
  })));
}

async function previewGoogleDrive(env, status) {
  const payload = await fetchJson("https://www.googleapis.com/drive/v3/files?pageSize=8&fields=files(id,name,mimeType,modifiedTime,webViewLink)", {
    headers: await googleHeaders(env),
  });
  return preview(status, "Arquivos recentes do Google Drive carregados.", (payload.files || []).map((file) => ({
    title: file.name,
    detail: file.mimeType,
    url: file.webViewLink,
  })));
}

async function previewGoogleCalendar(env, status) {
  const timeMin = new Date().toISOString();
  const payload = await fetchJson(`https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=8&singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(timeMin)}`, {
    headers: await googleHeaders(env),
  });
  return preview(status, "Próximos eventos do Google Agenda carregados.", (payload.items || []).map((event) => ({
    title: event.summary || "Sem título",
    detail: event.start?.dateTime || event.start?.date || "sem horário",
    url: event.htmlLink,
  })));
}

async function previewGoogleSheets(env, status) {
  const sheetId = getEnv(env, "GOOGLE_SHEET_ID");
  const metadata = await fetchJson(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}?fields=properties.title,sheets.properties(title,gridProperties.rowCount,gridProperties.columnCount)`, {
    headers: await googleHeaders(env),
  });
  return preview(status, `Abas da planilha ${metadata.properties?.title || "configurada"} carregadas.`, (metadata.sheets || []).slice(0, 8).map((sheet) => ({
    title: sheet.properties?.title,
    detail: `${sheet.properties?.gridProperties?.rowCount || 0} linhas x ${sheet.properties?.gridProperties?.columnCount || 0} colunas`,
  })));
}

async function previewNotion(env, status) {
  const payload = await fetchJson("https://api.notion.com/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getEnv(env, "NOTION_TOKEN")}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ page_size: 8 }),
  });
  return preview(status, "Páginas e databases do Notion carregados.", (payload.results || []).map((item) => ({
    title: readNotionTitle(item),
    detail: item.object,
    url: item.url,
  })));
}

async function previewHttpApi(env, status) {
  const result = await testHttpApi(env, status);
  return preview(result, "API HTTP respondeu ao GET configurado.", [{ title: "GET configurado", detail: result.message }]);
}

async function previewMcp(env, status) {
  const result = await testMcp(env, status);
  return preview(result, "MCP respondeu ao handshake HTTP.", [{ title: "MCP Server", detail: result.message }]);
}

async function previewDiscord(env, status) {
  const payload = await fetchJson(getEnv(env, "DISCORD_WEBHOOK_URL"), { method: "GET" });
  return preview(status, "Webhook Discord validado. Envio permanece bloqueado por aprovação.", [{
    title: payload.name || "Webhook",
    detail: `Canal ${payload.channel_id || "configurado"}`,
  }]);
}

async function previewLinear(env, status) {
  const payload = await linearGraphql(env, "{ viewer { name } teams(first: 5) { nodes { name key } } }");
  return preview(status, "Times do Linear carregados.", (payload.data?.teams?.nodes || []).map((team) => ({
    title: team.name,
    detail: team.key,
  })));
}

async function previewTrello(env, status) {
  const boards = await fetchJson(trelloUrl(env, "members/me/boards", "fields=name,url&filter=open"), {});
  return preview(status, "Boards do Trello carregados.", (boards || []).slice(0, 8).map((board) => ({
    title: board.name,
    detail: "board aberto",
    url: board.url,
  })));
}

async function previewHubSpot(env, status) {
  const payload = await fetchJson("https://api.hubapi.com/crm/v3/objects/contacts?limit=5&properties=email,firstname,lastname,createdate", {
    headers: {
      Authorization: `Bearer ${getEnv(env, "HUBSPOT_ACCESS_TOKEN")}`,
    },
  });
  return preview(status, "Contatos recentes do HubSpot carregados.", (payload.results || []).map((contact) => ({
    title: [contact.properties?.firstname, contact.properties?.lastname].filter(Boolean).join(" ") || contact.properties?.email || contact.id,
    detail: contact.properties?.email || "sem email",
  })));
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();
  let payload = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text.slice(0, 240) };
  }

  if (!response.ok) {
    throw new Error(readApiError(payload, response.status, url));
  }

  return payload;
}

function readApiError(payload, status, url = "") {
  if (status === 401 && String(url).includes("googleapis.com")) {
    return "Google recusou o token OAuth. Configure GOOGLE_REFRESH_TOKEN + GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET para renovar automaticamente.";
  }
  if (typeof payload?.error === "string") return payload.error_description || payload.error;
  if (typeof payload?.error?.message === "string") return payload.error.message;
  if (typeof payload?.message === "string") return payload.message;
  if (typeof payload?.raw === "string" && payload.raw) return payload.raw;
  return `HTTP ${status}`;
}

function connected(status, message, metadata = {}) {
  return {
    ...status,
    ok: true,
    configured: true,
    state: "connected",
    message,
    metadata,
    testedAt: new Date().toISOString(),
  };
}

function preview(status, message, items = []) {
  return {
    ...status,
    ok: true,
    state: "connected",
    action: "preview",
    message,
    preview: items.filter(Boolean),
  };
}

async function googleHeaders(env) {
  return {
    Authorization: `Bearer ${await getGoogleAccessToken(env)}`,
  };
}

async function getGoogleAccessToken(env) {
  const refreshToken = getEnv(env, "GOOGLE_REFRESH_TOKEN");
  const clientId = getEnv(env, "GOOGLE_CLIENT_ID");
  const clientSecret = getEnv(env, "GOOGLE_CLIENT_SECRET");

  if (refreshToken && clientId && clientSecret) {
    const body = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    });
    const payload = await fetchJson("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (payload.access_token) return payload.access_token;
  }

  return getEnv(env, "GOOGLE_ACCESS_TOKEN");
}

function hasGoogleAuth(env) {
  return Boolean(
    getEnv(env, "GOOGLE_ACCESS_TOKEN") ||
      (getEnv(env, "GOOGLE_REFRESH_TOKEN") && getEnv(env, "GOOGLE_CLIENT_ID") && getEnv(env, "GOOGLE_CLIENT_SECRET"))
  );
}

function formatMissingEnv(missingEnv) {
  return missingEnv.map((key) => {
    if (key === "GOOGLE_ACCESS_TOKEN") {
      return "GOOGLE_ACCESS_TOKEN ou GOOGLE_REFRESH_TOKEN + GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET";
    }
    return key;
  });
}

async function linearGraphql(env, query) {
  return fetchJson("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      Authorization: getEnv(env, "LINEAR_API_KEY"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
}

function trelloUrl(env, path, query = "") {
  const separator = query ? "&" : "";
  return `https://api.trello.com/1/${path}?${query}${separator}key=${encodeURIComponent(getEnv(env, "TRELLO_KEY"))}&token=${encodeURIComponent(getEnv(env, "TRELLO_TOKEN"))}`;
}

function readNotionTitle(item) {
  const source = item.properties?.title?.title || item.properties?.Name?.title || item.title || [];
  if (Array.isArray(source)) {
    return source.map((part) => part.plain_text).filter(Boolean).join("") || item.id;
  }
  return item.id;
}

function getEnv(env, key) {
  if (env && Object.prototype.hasOwnProperty.call(env, key)) return env[key];
  if (globalThis.process?.env) return globalThis.process.env[key];
  return undefined;
}

function redactUrl(value) {
  try {
    const url = new URL(value);
    url.username = "";
    url.password = "";
    return url.toString();
  } catch {
    return "url-configurada";
  }
}
