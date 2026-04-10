const { callTelegram, escapeHtml } = require("./_lib/telegram");

let localRuntimeConfig = {};
try {
  localRuntimeConfig = require("./_lib/runtime-telegram-local");
} catch {
  localRuntimeConfig = {};
}

const MAX_MESSAGE_LENGTH = 3900;

const json = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
};

const parseJsonBody = (req) => {
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

const normalizePositiveNumber = (value) => {
  const parsed = Number.parseFloat(String(value ?? "").replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
};

const formatRub = (value = 0) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));

const getRequestId = () => {
  const stamp = new Date().toISOString().replaceAll(/[-:TZ.]/g, "").slice(2, 12);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GB-SITE-${stamp}-${suffix}`;
};

const getWebhookRouteConfig = async (token) => {
  const info = await callTelegram(token, "getWebhookInfo");
  if (!info?.url) return {};

  try {
    const url = new URL(info.url);
    return {
      ownerUserId:
        url.searchParams.get("ownerUserId") ||
        url.searchParams.get("adminChatId") ||
        "",
      complaintsChatId:
        url.searchParams.get("complaintsChatId") ||
        url.searchParams.get("adminChatId") ||
        "",
    };
  } catch {
    return {};
  }
};

const getBotToken = () => process.env.TELEGRAM_BOT_TOKEN || localRuntimeConfig.botToken || "";

const validatePayload = (payload = {}) => {
  const errors = [];
  const lead = payload.lead || {};
  const company = payload.company || {};
  const delivery = payload.delivery || {};
  const order = payload.order || {};

  if (!lead.name) errors.push("Укажите имя");
  if (!lead.phone) errors.push("Укажите телефон");
  if (!lead.consent) errors.push("Нужно согласие на обработку данных");

  const isQuoteRequest =
    payload.context?.page === "contacts" ||
    Number.isFinite(order.quantityKg) ||
    Boolean(company.name) ||
    Boolean(delivery.address);

  if (isQuoteRequest) {
    if (!company.name) errors.push("Укажите юридическое лицо или ИП");
    if (!order.quantityKg) errors.push("Укажите объём закупки в килограммах");
    if (!delivery.address) errors.push("Укажите адрес доставки");
  }

  return errors;
};

const line = (label, value) =>
  value === null || value === undefined || value === ""
    ? ""
    : `<b>${escapeHtml(label)}:</b> ${escapeHtml(value)}`;

const formatTargets = (targets = []) => (Array.isArray(targets) ? targets.join(", ") : "");

const buildTelegramMessage = (payload, requestId) => {
  const lead = payload.lead || {};
  const company = payload.company || {};
  const context = payload.context || {};
  const product = payload.product || {};
  const order = payload.order || {};
  const delivery = payload.delivery || {};
  const pricing = payload.pricing || {};
  const utm = payload.utm || {};
  const integration = payload.integration || {};

  const lines = [
    "<b>Новая заявка с сайта Global Basket</b>",
    line("Номер обращения", requestId),
    line("Источник", context.source || "site"),
    line("Страница", context.page || "site"),
    "",
    "<b>Контакт</b>",
    line("Имя", lead.name),
    line("Телефон", lead.phone),
    line("Email", lead.email),
    line("Telegram", lead.telegramUsername),
    line("Предпочтительный канал", lead.preferredContact),
    "",
    "<b>Компания и запрос</b>",
    line("Юридическое лицо / ИП", company.name),
    line("ИНН", company.inn),
    line("Формат закупки", company.purchaseFormat),
    line("Тема", lead.topic || order.topic),
    line(
      "Объём",
      Number.isFinite(order.quantityKg) && order.quantityKg > 0 ? `${order.quantityKg} кг` : "",
    ),
    "",
    "<b>Доставка</b>",
    line("Адрес", delivery.address),
    line(
      "Расстояние от Москвы",
      Number.isFinite(delivery.distanceKm) && delivery.distanceKm > 0
        ? `${delivery.distanceKm} км`
        : Number.isFinite(delivery.distanceKm)
          ? "0 км"
          : "",
    ),
    line(
      "Полные блоки по 1000 км",
      Number.isFinite(delivery.distanceBlocks1000) ? String(delivery.distanceBlocks1000) : "",
    ),
    "",
    "<b>Предварительный расчёт</b>",
    line(
      "Базовая цена",
      pricing.basePricePerKg ? `${formatRub(pricing.basePricePerKg)} / кг` : "",
    ),
    line("Скидка", pricing.discountTier),
    line(
      "Надбавка за расстояние",
      Number.isFinite(pricing.distanceMarkupRate) && pricing.distanceMarkupRate > 0
        ? `+${Math.round(pricing.distanceMarkupRate * 100)}%`
        : Number.isFinite(pricing.distanceMarkupRate)
          ? "+0%"
          : "",
    ),
    line(
      "Цена за кг после расчёта",
      pricing.estimatedPricePerKg ? `${formatRub(pricing.estimatedPricePerKg)} / кг` : "",
    ),
    line("Предварительная сумма", pricing.totalEstimate ? formatRub(pricing.totalEstimate) : ""),
    "",
    "<b>Товар и контекст</b>",
    line("Товар", product.name),
    line("Категория", product.category),
    line("Landing URL", context.landingUrl),
    line("Referrer", context.referrer),
    line("Session ID", context.sessionId),
    line("Payload version", integration.payloadVersion),
    line("Integration targets", formatTargets(integration.targets)),
    line("UTM source", utm.source),
    line("UTM medium", utm.medium),
    line("UTM campaign", utm.campaign),
    line("UTM content", utm.content),
    line("UTM term", utm.term),
    "",
    "<b>Комментарий</b>",
    escapeHtml(lead.message || "—"),
  ].filter(Boolean);

  const text = lines.join("\n");
  return text.length > MAX_MESSAGE_LENGTH ? `${text.slice(0, MAX_MESSAGE_LENGTH - 1)}…` : text;
};

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return json(res, 405, { ok: false, error: "Method not allowed" });
  }

  try {
    const payload = parseJsonBody(req);
    const errors = validatePayload(payload);

    if (errors.length) {
      return json(res, 400, {
        ok: false,
        error: "validation_error",
        message: errors.join(". "),
      });
    }

    const token = getBotToken();
    const complaintsChatId =
      process.env.TELEGRAM_COMPLAINT_CHAT_ID ||
      (await getWebhookRouteConfig(token)).complaintsChatId;

    if (!token || !complaintsChatId) {
      return json(res, 500, {
        ok: false,
        error: "telegram_route_missing",
        message: "Telegram-маршрут для заявок не настроен.",
      });
    }

    const requestId = getRequestId();
    const text = buildTelegramMessage(payload, requestId);

    await callTelegram(token, "sendMessage", {
      chat_id: complaintsChatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });

    return json(res, 200, {
      ok: true,
      requestId,
      routedTo: complaintsChatId,
    });
  } catch (error) {
    console.error("contact-request error", error);
    return json(res, 500, {
      ok: false,
      error: "request_send_failed",
      message: "Не удалось отправить заявку в Telegram.",
    });
  }
};
