const TELEGRAM_API = "https://api.telegram.org";

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const callTelegram = async (token, method, payload = {}) => {
  const response = await fetch(`${TELEGRAM_API}/bot${token}/${method}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    throw new Error(data.description || `Telegram API error in ${method}`);
  }

  return data.result;
};

const buildWebhookUrl = (req, token, adminChatId = "") => {
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const pathname = req.url.split("?")[0];
  const url = new URL(`${protocol}://${host}${pathname}`);
  url.searchParams.set("token", token);
  if (adminChatId) url.searchParams.set("adminChatId", adminChatId);
  return url.toString();
};

const parseUpdate = (req) => {
  if (!req.body) return {};
  if (Buffer.isBuffer(req.body)) {
    try {
      return JSON.parse(req.body.toString("utf8"));
    } catch {
      return {};
    }
  }
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
};

module.exports = {
  buildWebhookUrl,
  callTelegram,
  escapeHtml,
  parseUpdate,
};
